const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const sharedReturn = require("./message.js");
const Decimal = require("decimal.js");

async function updateBudgetLeftOver(request) {
   const incomeFixed = new Decimal(request.session.budget.Income.current);
   const expensesFixed =  new Decimal(request.session.budget.Expenses.current);

   request.session.budget.leftOver = parseFloat((incomeFixed.minus(expensesFixed).toString()));
   await request.session.save();
}

exports.addTransaction = asyncHandler(async(request, result) => {
   try {
      const trimmedInputs = validation.trimInputs(result, request.body, "amount", "date");
      if (trimmedInputs.status != undefined) return;

      if (trimmedInputs.account == "") {
         trimmedInputs.account = null;
      }

      const formValidation = validation.validateTransactionForm(request, result, trimmedInputs.account, "account", trimmedInputs.title, "title", trimmedInputs.category, "category");
      if (formValidation.status != "pass") return;

      const transaction = await query.runQuery("INSERT INTO transactions (title, date, type, amount, user_id, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
         [trimmedInputs.title, trimmedInputs.date, trimmedInputs.type, trimmedInputs.amount.toString(),
            request.session.user_id, trimmedInputs.account, trimmedInputs.category]);

      const transactionID = transaction.insertId;
      trimmedInputs.ID = transactionID;

      // Must be in same month and year to affect budget
      const currentBudgetDate = (request.session.budget.month).toString().split("-");
      const testingDate = (trimmedInputs.date).split("-");

      if (testingDate[0] != currentBudgetDate[0] || testingDate[1] != currentBudgetDate[1]) {
         // Only update budget for current month expenses
         trimmedInputs.amount = parseFloat((trimmedInputs.amount).toString());

         request.session.transactions[transactionID] = {
            title : trimmedInputs.title,
            type : trimmedInputs.type,
            categoryID : trimmedInputs.category,
            accountID : trimmedInputs.account,
            date : trimmedInputs.date,
            amount : trimmedInputs.amount
         };

         await request.session.save();
         sharedReturn.sendSuccess(result, "Successfully added transaction <i class=\"fa-solid fa-credit-card\"></i>", trimmedInputs);
         return;
      }

      let mainCategoryCurrent = new Decimal(request.session.budget[`${trimmedInputs.type}`].current);
      mainCategoryCurrent = mainCategoryCurrent.plus(trimmedInputs.amount);

      await query.runQuery("UPDATE budgets SET ?? = ? WHERE user_id = ?;",
         [`${trimmedInputs.type}current`, mainCategoryCurrent.toString(), request.session.user_id]);

      request.session.budget[`${trimmedInputs.type}`].current = parseFloat(mainCategoryCurrent.toString());

      if (trimmedInputs.category != "Income" && trimmedInputs.category != "Expenses") {
         // Update category
         let categoryCurrent = new Decimal(`${request.session.budget.categories[trimmedInputs.category].current}`);
         categoryCurrent = categoryCurrent.plus(trimmedInputs.amount);
         await query.runQuery("UPDATE categories SET current = ? WHERE category_id = ?;",
            [categoryCurrent.toString(), trimmedInputs.category]);

         request.session.budget.categories[trimmedInputs.category].current = parseFloat(categoryCurrent.toString());
      }

      trimmedInputs.amount = parseFloat((trimmedInputs.amount).toString());

      request.session.transactions[randomID] = {
         title : trimmedInputs.title,
         type : trimmedInputs.type,
         categoryID : trimmedInputs.category,
         accountID : trimmedInputs.account,
         date : trimmedInputs.date,
         amount : trimmedInputs.amount
      };

      await request.session.save();
      await updateBudgetLeftOver(request);
      sharedReturn.sendSuccess(result, "Successfully added transaction <i class=\"fa-solid fa-credit-card\"></i>", trimmedInputs);
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "N/A", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

exports.editTransaction = asyncHandler(async(request, result) => {
   try {
      const trimmedInputs = validation.trimInputs(result, request.body, "editAmount", "editDate");
      if (trimmedInputs.status != undefined) return;

      if (trimmedInputs.account == "") {
         trimmedInputs.account = null;
      }

      const formValidation = validation.validateTransactionForm(request, result, trimmedInputs.account, "editAccount", trimmedInputs.title, "editTitle", trimmedInputs.category, "editCategory");
      if (formValidation.status != "pass") return;

      // Check for any changes:
      const previousTransaction = request.session.transactions[trimmedInputs.ID];

      // Set variables to properly match up differences within the cache
      trimmedInputs.categoryID = trimmedInputs.category;
      trimmedInputs.accountID = trimmedInputs.account;

      if (trimmedInputs.remove != "true" && !query.changesMade(trimmedInputs, previousTransaction)) {
         trimmedInputs.changes = false;
         sharedReturn.sendSuccess(result, "No changes <i class=\"fa-solid fa-circle-info\"></i>", trimmedInputs);
         return;
      } else {
         trimmedInputs.changes = true;
      }

      const previousAmount = new Decimal(previousTransaction.amount);

      let newIncomeCurrent = new Decimal(request.session.budget.Income.current);
      let newExpensesCurrent = new Decimal(request.session.budget.Expenses.current);

      let previousCategoryCurrent = null;
      let newCategoryCurrent = null;

      const mainCategories = {
         "Income":true,
         "Expenses":true
      };

      const fromMainCategory = mainCategories.hasOwnProperty(previousTransaction.categoryID);
      const toMainCategory = mainCategories.hasOwnProperty(trimmedInputs.category);

      // Must be in same month and year to affect budget
      const currentBudgetDate = (request.session.budget.month).toString().split("-");

      const previousDate = (request.session.transactions[trimmedInputs.ID].date).toString().split("-");
      const inputDate = (trimmedInputs.date).split("-");

      // Compare YY-MM for input and previous dates using current budget year-month
      const previousDateAffectsBudget = (previousDate[0] == currentBudgetDate[0] && previousDate[1] == currentBudgetDate[1]);
      const currentDateAffectsBudget = (inputDate[0] == currentBudgetDate[0] && inputDate[1] == currentBudgetDate[1]);

      if (trimmedInputs.remove == "true") {
         await query.runQuery("DELETE FROM transactions WHERE transaction_id = ?;", [trimmedInputs.ID]);
         trimmedInputs.remove = true;

         if (!previousDateAffectsBudget) {
            // Update cache via deleting category
            delete request.session.transactions[trimmedInputs.ID];
            // Removals should only affect current budgets
            await request.session.save();
            sharedReturn.sendSuccess(result, "Successfully removed transaction <i class=\"fa-solid fa-trash\"></i>", trimmedInputs);
            return;
         } else {
            // Update budgets
            if (!fromMainCategory) {
               // Update category
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);

               await query.runQuery("UPDATE categories SET current = ? WHERE category_id = ?;",
                  [previousCategoryCurrent.toString(), previousTransaction.categoryID]);

               request.session.budget.categories[previousTransaction.categoryID].current = parseFloat(previousCategoryCurrent.toString());
            }

            if (previousTransaction.type == "Income") {
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            } else {
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }

            await query.runQuery("UPDATE budgets SET income_current = ?, expenses_current = ? WHERE user_id = ?;", [newIncomeCurrent.toString(), newExpensesCurrent.toString(), request.session.user_id]);

            delete request.session.transactions[trimmedInputs.ID];
            request.session.budget.Income.current  = parseFloat(newIncomeCurrent.toString());
            request.session.budget.Expenses.current  = parseFloat(newExpensesCurrent.toString());

            await request.session.save();
            await updateBudgetLeftOver(request);
            sharedReturn.sendSuccess(result, "Successfully removed transaction <i class=\"fa-solid fa-trash\"></i>", trimmedInputs);
            return;
         }
      } else if (!currentDateAffectsBudget && !previousDateAffectsBudget) {
         // Simple update transaction table, no budget if not within same month
         await query.runQuery("UPDATE transactions SET title = ?, date = ?, type = ?, amount = ?, account_id = ?, category_id = ? WHERE transaction_id = ?",
            [trimmedInputs.title, trimmedInputs.date, trimmedInputs.type, trimmedInputs.amount.toString(), trimmedInputs.account,
               trimmedInputs.category, trimmedInputs.ID]);

         trimmedInputs.amount = parseFloat(trimmedInputs.amount.toString());

         request.session.transactions[trimmedInputs.ID] = {
            title : trimmedInputs.title,
            type : trimmedInputs.type,
            categoryID : trimmedInputs.category,
            accountID : trimmedInputs.account,
            date : trimmedInputs.date,
            amount : trimmedInputs.amount
         };

         await request.session.save();
         sharedReturn.sendSuccess(result, "Successfully updated transaction <i class=\"fa-solid fa-credit-card\"></i>", trimmedInputs);
         return;
      }

      // Check if any changes will have affect on budget
      if (previousTransaction.type != trimmedInputs.type) {
         // Income -> Expenses and vice versa
         if (fromMainCategory && !toMainCategory && currentDateAffectsBudget) {
            // Income -> Expenses Category or Expenses -> Income categories
            newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
            newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
         } else if (!fromMainCategory && toMainCategory && previousDateAffectsBudget) {
            // Income Category -> Expenses  or Expenses Category -> Income
            previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
            previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
         } else if (!fromMainCategory && !toMainCategory) {
            // Income Category -> Expenses Category  or Expenses Category -> Income Category
            if (previousDateAffectsBudget) {
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
               newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
            }
         }

         // Update main trackers if applicable to budget
         if (trimmedInputs.type == "Income") {
            if (currentDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.plus(trimmedInputs.amount);
            }

            if (previousDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }
         } else {
            if (currentDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.plus(trimmedInputs.amount);
            }

            if (previousDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            }
         }
      } else {
         // Handle any changes within same type domain
         if (!fromMainCategory && toMainCategory && previousDateAffectsBudget) {
            // Income Category -> Income (No affect on main total)
            previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
            previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
         } else if (fromMainCategory && !toMainCategory && currentDateAffectsBudget) {
            // Income -> Income Category
            newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
            newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
         } else if (!fromMainCategory && !toMainCategory) {
            // Income Category -> New Income Category
            if (trimmedInputs.category != previousTransaction.categoryID && previousDateAffectsBudget) {
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
            } else if (previousDateAffectsBudget) {
               // If they have the same sub category ID, then only make a single row update in database
               newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
               newCategoryCurrent = newCategoryCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               if (!newCategoryCurrent) {
                  newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
               }

               newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
            }
         }

         // Always update main trackers
         if (trimmedInputs.type == "Income") {
            if (previousDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.plus(trimmedInputs.amount);
            }
         } else {
            if (previousDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.plus(trimmedInputs.amount);
            }
         }
      }

      request.session.budget.Income.current  = parseFloat(newIncomeCurrent.toString());
      request.session.budget.Expenses.current  = parseFloat(newExpensesCurrent.toString());

      if (previousCategoryCurrent && !newCategoryCurrent) {
         // Case of Income Category -> Income or Income
         await query.runQuery("Update categories Set current = ? WHERE category_id = ?",
            [previousCategoryCurrent.toString(), previousTransaction.categoryID]);

         // Update cache
         request.session.budget.categories[previousTransaction.categoryID].current = parseFloat(previousCategoryCurrent.toString());
      } else if (!previousCategoryCurrent && newCategoryCurrent) {
         // All other cases involving from main to new category within current month
         await query.runQuery("Update categories Set current = ? WHERE category_id = ?",
            [newCategoryCurrent.toString(), trimmedInputs.ID]);

         // Update cache
         request.session.budget.categories[trimmedInputs.category].current = parseFloat(newCategoryCurrent.toString());
      } else if (previousCategoryCurrent && newCategoryCurrent) {
         // Updating two categories in one go
         const updateCategoriesQuery = `
            UPDATE categories
            Set current =
               CASE
                  WHEN category_id = ? THEN ?
                  WHEN category_id = ? THEN ?
                  ELSE current
               END
            WHERE category_id IN (?, ?);
         `;
         await query.runQuery(updateCategoriesQuery,
            [trimmedInputs.ID, newCategoryCurrent.toString(), previousTransaction.categoryID,
               previousCategoryCurrent.toString(), trimmedInputs.ID, previousTransaction.categoryID]);

         // Update cache
         request.session.budget.categories[trimmedInputs.category].current = parseFloat(newCategoryCurrent.toString());
         request.session.budget.categories[previousTransaction.categoryID].current = parseFloat(previousCategoryCurrent.toString());
      }

      await request.session.save();
      await updateBudgetLeftOver(request);

      // Update transactions and budgets table in one go for monthly budget affects
      const updateQuery = `UPDATE transactions T
                           JOIN budgets B ON T.user_id = B.user_id
                           SET
                              B.income_current = ?,
                              B.expenses_current = ?,
                              T.title = ?,
                              T.category_id = ?,
                              T.account_id = ?,
                              T.type = ?,
                              T.date = ?,
                              T.amount = ?
                           WHERE T.user_id = ? AND T.transaction_id = ?;`;

      await query.runQuery(updateQuery, [newIncomeCurrent.toString(), newExpensesCurrent.toString(), trimmedInputs.title,
         trimmedInputs.category, trimmedInputs.account, trimmedInputs.type, trimmedInputs.date,
         trimmedInputs.amount.toString(), request.session.user_id, trimmedInputs.ID]);

      trimmedInputs.amount = parseFloat(trimmedInputs.amount.toString());

      request.session.transactions[trimmedInputs.ID] = {
         title : trimmedInputs.title,
         type : trimmedInputs.type,
         categoryID : trimmedInputs.category,
         accountID : trimmedInputs.account,
         date : trimmedInputs.date,
         amount : trimmedInputs.amount
      };

      await request.session.save();
      sharedReturn.sendSuccess(result, "Successfully edited transaction <i class=\"fa-solid fa-credit-card\"></i>", trimmedInputs);
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "username", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});