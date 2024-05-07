const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const sharedReturn = require("./message.js");
const Decimal = require("decimal.js");
const accountController = require("./accounts.js");

exports.testNewMonth = function (oldDate) {
   // YY-MM-DD
   const currentDate = query.getCurrentMonth().split("-");
   const currentMonth = parseInt(currentDate[1]);
   const currentYear = parseInt(currentDate[0]);

   const testingDate = new Date(oldDate);
   const testingMonth = testingDate.getMonth() + 1;
   const testingYear = testingDate.getFullYear();

   return testingMonth != currentMonth || currentYear != testingYear;
};

exports.grabBudgetInformation = async function (request, result, next) {
   try {
      let returnData = {};
      const userBudget = await query.runQuery(
         "SELECT * FROM Budgets WHERE UserID = ?;",
         [request.session.UserID]
      );
      const userCategories = await query.runQuery(
         "SELECT * FROM Categories WHERE UserID = ? ORDER BY Type DESC;",
         [request.session.UserID]
      );

      returnData.Income = {
         current: parseFloat(userBudget[0].IncomeCurrent),
         total: parseFloat(userBudget[0].IncomeTotal),
      };

      returnData.Expenses = {
         current: parseFloat(userBudget[0].ExpensesCurrent),
         total: parseFloat(userBudget[0].ExpensesTotal),
      };

      returnData.categories = {};

      for (const category of userCategories) {
         returnData.categories[category.CategoryID] = {
            name: category.Name,
            type: category.Type,
            current: parseFloat(category.Current),
            total: parseFloat(category.Total),
            month: category.Month,
         };
      }

      returnData.Month = userBudget[0].Month;
      request.session.budget = returnData;
      await request.session.save();

      const resetBudgetTest = exports.testNewMonth(returnData.Month);

      const incomeFixed = new Decimal(userBudget[0].IncomeCurrent);
      const expensesFixed = new Decimal(userBudget[0].ExpensesCurrent);

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

exports.getUserBudget = asyncHandler(async (request, result, next) => {
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

exports.addCategory = asyncHandler(async (request, result, next) => {
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
      const randomID = await query.retrieveRandomID(
         "SELECT * FROM Categories WHERE CategoryID = ?;"
      );
      const formattedDate = query.getCurrentMonth();

      await query.runQuery(
         "INSERT INTO Categories (CategoryID,Name,Type,Current,Total,Month,UserID) VALUES (?,?,?,?,?,?,?);",
         [
            randomID,
            trimmedInputs.name,
            trimmedInputs.type,
            0.0,
            trimmedInputs.amount.toString(),
            formattedDate,
            request.session.UserID,
         ]
      );

      // Return database values for front end rendering
      trimmedInputs.ID = randomID;
      trimmedInputs.amount = parseFloat(trimmedInputs.amount.toString());

      // Update cache
      request.session.budget.categories[randomID] = {
         name: trimmedInputs.name,
         type: trimmedInputs.type,
         current: 0.0,
         total: trimmedInputs.amount,
         month: formattedDate,
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

exports.updateCategory = asyncHandler(async (request, result, next) => {
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
         await query.runQuery("DELETE FROM Categories WHERE CategoryID = ?;", [
            trimmedInputs.ID,
         ]);

         if (!request.session.transactions) {
            await accountController.setUpAccountsCache(request);
         }

         const possibleTransactionIDs = Object.keys(request.session.transactions);
         const previousType =
        request.session.budget.categories[trimmedInputs.ID].type;
         await query.runQuery(
            "UPDATE Transactions SET CategoryID = ? WHERE CategoryID = ?;",
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
            await query.runQuery("UPDATE Budgets SET ?? = ? WHERE UserID = ?;", [
               `${trimmedInputs.type}Total`,
               trimmedInputs.amount.toString(),
               request.session.UserID,
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
               "UPDATE Budgets SET IncomeCurrent = ?, ExpensesCurrent = ? WHERE UserID = ?;",
               [
                  newIncomeCurrent.toString(),
                  newExpensesCurrent.toString(),
                  request.session.UserID,
               ]
            );
            await query.runQuery(
               "UPDATE Transactions SET Type = ? WHERE CategoryID = ?;",
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
               "UPDATE Categories SET Name = ?, Type = ?, Current = ?, Total = ? WHERE CategoryID = ?;",
               [
                  trimmedInputs.name,
                  trimmedInputs.type,
                  trimmedInputs.current.toString(),
                  trimmedInputs.amount.toString(),
                  trimmedInputs.ID,
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

exports.resetBudget = asyncHandler(async (request, result, next) => {
   try {
      const validRequest = exports.testNewMonth(request.session.budget.Month);
      const currentMonth = query.getCurrentMonth();

      if (!validRequest) {
         throw new Error("");
      }

      const resetQuery = `UPDATE Budgets B
                        JOIN Categories C ON B.UserID = C.UserID
                        SET B.IncomeCurrent = 0.00,
                           B.ExpensesCurrent = 0.00,
                           B.Month = ?,
                           C.Current = 0.00,
                           C.Month = ?
                        WHERE B.UserID = ?;`;

      await query.runQuery(resetQuery, [
         currentMonth,
         currentMonth,
         request.session.UserID,
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
      request.session.budget.Month = currentMonth;
      await request.session.save();

      return request.session.budget;
   } catch (error) {
      console.log(error);
   }
});
