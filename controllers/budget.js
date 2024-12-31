const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const sharedReturn = require("./message.js");
const Decimal = require("decimal.js");
const accountController = require("./accounts.js");

exports.testNewMonth = function(oldDate) {
   // YY-MM-DD
   const currentDate = query.getCurrentMonth().split("-");
   const currentMonth = parseInt(currentDate[1]);
   const currentYear = parseInt(currentDate[0]);

   const testingDate = new Date(oldDate);
   const testingMonth = testingDate.getMonth() + 1;
   const testingYear = testingDate.getFullYear();

   return testingMonth != currentMonth || currentYear != testingYear;
};

exports.grabBudgetInformation = async function(request, result, next) {
   try {
      let returnData = {};
      const userBudget = await query.runQuery(
         "SELECT * FROM budgets WHERE user_id = ?;",
         [request.session.user_id]
      );
      const userCategories = await query.runQuery(
         "SELECT * FROM categories WHERE user_id = ? ORDER BY type DESC;",
         [request.session.user_id]
      );

      returnData.Income = {
         current: parseFloat(userBudget[0].income_current),
         total: parseFloat(userBudget[0].income_total)
      };

      returnData.Expenses = {
         current: parseFloat(userBudget[0].expenses_current),
         total: parseFloat(userBudget[0].expenses_total)
      };

      returnData.categories = {};

      for (const category of userCategories) {
         returnData.categories[category.category_id] = {
            name: category.name,
            type: category.type,
            current: parseFloat(category.current),
            total: parseFloat(category.total),
            month: category.month
         };
      }

      returnData.month = userBudget[0].month;
      request.session.budget = returnData;
      await request.session.save();

      const resetBudgetTest = exports.testNewMonth(returnData.month);

      const incomeFixed = new Decimal(userBudget[0].income_current);
      const expensesFixed = new Decimal(userBudget[0].expenses_current);

      if (resetBudgetTest) {
         returnData = await exports.resetBudget(request, result, next);

         // Notify user that their current inputs are based on new month
         returnData.notify = true;
      } else {
         returnData.leftOver = parseFloat(
            incomeFixed.minus(expensesFixed).toString()
         );
      }

      return returnData;
   } catch (error) {
      console.log(error);
      throw error;
   }
};

exports.getUserBudget = asyncHandler(async(request, result, next) => {
   try {
      let returnData = {};

      if (!request.session.budget) {
         returnData = request.session.budget = await exports.grabBudgetInformation(
            request,
            result,
            next
         );
         await request.session.save();
      } else {
      // Use cached data using redis for quicker accessing of temporary user data
         returnData = JSON.parse(JSON.stringify(request.session.budget));
      }

      sharedReturn.sendSuccess(
         result,
         "Data for displaying user budget",
         returnData
      );
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(
         result,
         500,
         "N/A",
         "Could not successfully process request <i class='fa-solid fa-database'></i>"
      );
   }
});

exports.addCategory = asyncHandler(async(request, result) => {
   const trimmedInputs = validation.trimInputs(result, request.body, "amount");

   if (trimmedInputs.status != undefined) return;

   const validationCheck = validation.validateBudgetForm(
      result,
      trimmedInputs.name,
      "name",
      trimmedInputs.type,
      "type",
      false
   );
   if (validationCheck.status != "pass") return;

   try {
      const formattedDate = query.getCurrentMonth();

      const category = await query.runQuery(
         "INSERT INTO categories (name, type, current, total, month, user_id) VALUES (?, ?, ?, ?, ?, ?);",
         [
            trimmedInputs.name,
            trimmedInputs.type,
            0.0,
            trimmedInputs.amount.toString(),
            formattedDate,
            request.session.user_id
         ]
      );

      // Return database values for front end rendering
      const insertId = category.insertId;
      trimmedInputs.ID = insertId;
      trimmedInputs.amount = parseFloat(trimmedInputs.amount.toString());

      // Update cache
      request.session.budget.categories[insertId] = {
         name: trimmedInputs.name,
         type: trimmedInputs.type,
         current: 0.0,
         total: trimmedInputs.amount,
         month: formattedDate
      };

      await request.session.save();
      sharedReturn.sendSuccess(
         result,
         "Successfully added category <i class=\"fa-solid fa-chart-pie\" ></i>",
         trimmedInputs
      );
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(
         result,
         500,
         "addCategoryName",
         "Could not successfully process request <i class='fa-solid fa-database'></i>"
      );
   }
});

exports.updateCategory = asyncHandler(async(request, result) => {
   try {
      const trimmedInputs = validation.trimInputs(
         result,
         request.body,
         "editAmount"
      );
      if (trimmedInputs.status != undefined) return;

      const editingMainCategory =
      trimmedInputs.ID == "mainIncome" || trimmedInputs.ID == "mainExpenses";
      const validationCheck = validation.validateBudgetForm(
         result,
         trimmedInputs.name,
         "editName",
         trimmedInputs.type,
         "editType",
         editingMainCategory
      );
      if (validationCheck.status != "pass") return;

      let previousCategory, previousCurrent, previousTotal;

      if (trimmedInputs.remove == "true" && !editingMainCategory) {
         // Handle remove (Main Income/Expenses are not changed at all because all transactions are moved to main types)
         await query.runQuery("DELETE FROM categories WHERE category_id = ?;", [
            trimmedInputs.ID
         ]);

         if (!request.session.transactions) {
            await accountController.setUpAccountsCache(request);
         }

         const possibleTransactionIDs = Object.keys(request.session.transactions);
         const previousType = request.session.budget.categories[trimmedInputs.ID].type;
         await query.runQuery(
            "UPDATE transactions SET type = ? WHERE category_id = ?;",
            [previousType, trimmedInputs.ID]
         );

         possibleTransactionIDs.forEach((transactionID) => {
            // Update all connected account transactions within the cache and roll back to main type
            if (
               request.session.transactions[transactionID].categoryID ==
          trimmedInputs.ID
            ) {
               request.session.transactions[transactionID].categoryID = previousType;
            }
         });

         trimmedInputs.changes = true;
         trimmedInputs.mainOrSub = "remove";

         // Update cache via deleting category
         delete request.session.budget.categories[trimmedInputs.ID];
         await request.session.save();
         sharedReturn.sendSuccess(
            result,
            "Successfully removed category <i class=\"fa-solid fa-trash\"></i>",
            trimmedInputs
         );
         return;
      }

      if (editingMainCategory) {
         previousCategory = request.session.budget[trimmedInputs.name];
         previousTotal = new Decimal(`${previousCategory.total}`);
         previousCurrent = new Decimal(`${previousCategory.current}`);

         // May only update total if there is a change using cached data
         if (!previousTotal.equals(trimmedInputs.amount)) {
            await query.runQuery("UPDATE budgets SET ?? = ? WHERE user_id = ?;", [
               `${trimmedInputs.type}total`,
               trimmedInputs.amount.toString(),
               request.session.user_id
            ]);

            // Update cache and format rendering data
            trimmedInputs.mainOrSub = "main";
            trimmedInputs.total = parseFloat(trimmedInputs.amount.toString());
            trimmedInputs.current = parseFloat(previousCurrent.toString());
            trimmedInputs.changes = true;

            request.session.budget[trimmedInputs.type].total = trimmedInputs.total;
            await request.session.save();
            sharedReturn.sendSuccess(
               result,
               "Successfully updated category <i class=\"fa-solid fa-chart-pie\"></i>",
               trimmedInputs
            );
         } else {
            sharedReturn.sendSuccess(
               result,
               "No changes <i class=\"fa-solid fa-circle-info\"></i>",
               trimmedInputs
            );
         }
      } else {
         const previousType =
        request.session.budget.categories[trimmedInputs.ID].type;
         previousCategory = request.session.budget.categories[trimmedInputs.ID];
         previousTotal = new Decimal(previousCategory.total);
         previousCurrent = new Decimal(previousCategory.current);

         trimmedInputs.current = parseFloat(previousCurrent.toString());

         let changesMade = false;
         trimmedInputs.mainOrSub = "sub";

         if (
            !previousTotal.equals(trimmedInputs.amount) ||
        trimmedInputs.name != previousCategory.name
         ) {
            changesMade = true;
         }

         if (previousType != trimmedInputs.type) {
            // Swapping between Income and Expenses, must update both current trackers
            let newIncomeCurrent = new Decimal(
               request.session.budget.Income.current
            );
            let newExpensesCurrent = new Decimal(
               request.session.budget.Expenses.current
            );

            // Transfer of values in terms of income/expenses totals given swapping category current
            if (trimmedInputs.type == "Income") {
               newIncomeCurrent = newIncomeCurrent.plus(previousCurrent);
               newExpensesCurrent = newExpensesCurrent.minus(previousCurrent);
            } else {
               newIncomeCurrent = newIncomeCurrent.minus(previousCurrent);
               newExpensesCurrent = newExpensesCurrent.plus(previousCurrent);
            }

            request.session.budget.Income.current = trimmedInputs.Income =
          parseFloat(newIncomeCurrent.toString());
            request.session.budget.Expenses.current = trimmedInputs.Expenses =
          parseFloat(newExpensesCurrent.toString());

            await query.runQuery(
               "UPDATE budgets SET income_current = ?, expenses_current = ? WHERE user_id = ?;",
               [
                  newIncomeCurrent.toString(),
                  newExpensesCurrent.toString(),
                  request.session.user_id
               ]
            );
            await query.runQuery(
               "UPDATE transactions SET type = ? WHERE category_id = ?;",
               [trimmedInputs.type, trimmedInputs.ID]
            );

            if (!request.session.transactions) {
               await accountController.setUpAccountsCache(request);
            }

            const possibleTransactionIDs = Object.keys(
               request.session.transactions
            );

            possibleTransactionIDs.forEach((transactionID) => {
               // Update all connected account transactions within the cache
               if (
                  request.session.transactions[transactionID].categoryID ==
            trimmedInputs.ID
               ) {
                  request.session.transactions[transactionID].type =
              trimmedInputs.type;
               }
            });

            // Will need to re-construct containers for changes in several categories
            changesMade = true;
            trimmedInputs.mainOrSub = "reload";
         }

         if (changesMade) {
            await query.runQuery(
               "UPDATE categories SET name = ?, type = ?, current = ?, total = ? WHERE category_id = ?;",
               [
                  trimmedInputs.name,
                  trimmedInputs.type,
                  trimmedInputs.current.toString(),
                  trimmedInputs.amount.toString(),
                  trimmedInputs.ID
               ]
            );

            // Update cache and format rendering data
            trimmedInputs.changes = true;
            trimmedInputs.total = parseFloat(trimmedInputs.amount.toString());

            request.session.budget.categories[trimmedInputs.ID].name =
          trimmedInputs.name;
            request.session.budget.categories[trimmedInputs.ID].type =
          trimmedInputs.type;
            request.session.budget.categories[trimmedInputs.ID].current =
          trimmedInputs.current;
            request.session.budget.categories[trimmedInputs.ID].total =
          trimmedInputs.total;

            sharedReturn.sendSuccess(
               result,
               "Changes saved <i class=\"fa-solid fa-check\"></i>",
               trimmedInputs
            );
         } else {
            trimmedInputs.changes = false;
            sharedReturn.sendSuccess(
               result,
               "No changes <i class=\"fa-solid fa-circle-info\"></i>"
            );
         }
      }
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(
         result,
         500,
         "editCategoryName",
         "Could not successfully process request <i class='fa-solid fa-database'></i>"
      );
   }
});

exports.resetBudget = asyncHandler(async(request) => {
   try {
      const validRequest = exports.testNewMonth(request.session.budget.month);
      const currentMonth = query.getCurrentMonth();

      if (!validRequest) {
         throw new Error("");
      }

      const resetQuery = `UPDATE budgets B
                        JOIN categories C ON B.user_id = C.user_id
                        SET B.income_current = 0.00,
                           B.expenses_current = 0.00,
                           B.month = ?,
                           C.current = 0.00,
                           C.month = ?
                        WHERE B.user_id = ?;`;

      await query.runQuery(resetQuery, [
         currentMonth,
         currentMonth,
         request.session.user_id
      ]);

      // Await for cache to store data first for proper rendering
      request.session.budget.Income.current =
      request.session.budget.Expenses.current = 0.0;

      const categories = Object.keys(request.session.budget.categories);

      categories.forEach((category) => {
         request.session.budget.categories[category].current = 0.0;
         request.session.budget.categories[category].month = currentMonth;
      });

      request.session.budget.leftOver = 0.0;
      request.session.budget.month = currentMonth;
      await request.session.save();

      return request.session.budget;
   } catch (error) {
      console.log(error);
   }
});