const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const responseHandler = require("./message.js");
const Decimal = require("decimal.js");

async function updateBudgetLeftOver(request) {
   const incomeFixed = new Decimal(request.session.budget.Income.current);
   const expensesFixed =  new Decimal(request.session.budget.Expenses.current);

   request.session.budget.leftOver = parseFloat((incomeFixed.minus(expensesFixed).toString()));
   await request.session.save();
}

exports.addTransaction = asyncHandler(async(request, result) => {
   try {
      const normalizedInputs = validation.normalizeInputs(result, request.body, "amount", "date");
      if (normalizedInputs.status != undefined) return;

      if (normalizedInputs.account == "") {
         normalizedInputs.account = null;
      }

      const formValidation = validation.validateTransactionForm(request, result, normalizedInputs.account, "account", normalizedInputs.title, "title", normalizedInputs.category, "category");
      if (formValidation.status != "Success") return;

      const transaction = await query.runQuery("INSERT INTO transactions (title, date, type, amount, user_id, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
         [normalizedInputs.title, normalizedInputs.date, normalizedInputs.type, normalizedInputs.amount.toString(),
            request.session.user_id, normalizedInputs.account, normalizedInputs.category]);

      const transactionID = transaction.insertId;
      normalizedInputs.ID = transactionID;

      // Must be in same month and year to affect budget
      const currentBudgetDate = (request.session.budget.month).toString().split("-");
      const testingDate = (normalizedInputs.date).split("-");

      if (testingDate[0] != currentBudgetDate[0] || testingDate[1] != currentBudgetDate[1]) {
         // Only update budget for current month expenses
         normalizedInputs.amount = parseFloat((normalizedInputs.amount).toString());

         request.session.transactions[transactionID] = {
            title : normalizedInputs.title,
            type : normalizedInputs.type,
            categoryID : normalizedInputs.category,
            accountID : normalizedInputs.account,
            date : normalizedInputs.date,
            amount : normalizedInputs.amount
         };

         await request.session.save();
         responseHandler.sendSuccess(result, "Successfully added transaction", normalizedInputs);
         return;
      }

      let mainCategoryCurrent = new Decimal(request.session.budget[`${normalizedInputs.type}`].current);
      mainCategoryCurrent = mainCategoryCurrent.plus(normalizedInputs.amount);

      await query.runQuery("UPDATE budgets SET ?? = ? WHERE user_id = ?;",
         [`${normalizedInputs.type}current`, mainCategoryCurrent.toString(), request.session.user_id]);

      request.session.budget[`${normalizedInputs.type}`].current = parseFloat(mainCategoryCurrent.toString());

      if (normalizedInputs.category != "Income" && normalizedInputs.category != "Expenses") {
         // Update category
         let categoryCurrent = new Decimal(`${request.session.budget.categories[normalizedInputs.category].current}`);
         categoryCurrent = categoryCurrent.plus(normalizedInputs.amount);
         await query.runQuery("UPDATE categories SET current = ? WHERE category_id = ?;",
            [categoryCurrent.toString(), normalizedInputs.category]);

         request.session.budget.categories[normalizedInputs.category].current = parseFloat(categoryCurrent.toString());
      }

      normalizedInputs.amount = parseFloat((normalizedInputs.amount).toString());

      request.session.transactions[transactionID] = {
         title : normalizedInputs.title,
         type : normalizedInputs.type,
         categoryID : normalizedInputs.category,
         accountID : normalizedInputs.account,
         date : normalizedInputs.date,
         amount : normalizedInputs.amount
      };

      await request.session.save();
      await updateBudgetLeftOver(request);
      responseHandler.sendSuccess(result, "Successfully added transaction", normalizedInputs);
   } catch (error) {
      console.error(error);
      responseHandler.sendError(result, 500, "N/A", "Could not successfully process request");
      return;
   }
});

exports.editTransaction = asyncHandler(async(request, result) => {
   try {
      const normalizedInputs = validation.normalizeInputs(result, request.body, "editAmount", "editDate");
      if (normalizedInputs.status != undefined) return;

      if (normalizedInputs.account == "") {
         normalizedInputs.account = null;
      }

      const formValidation = validation.validateTransactionForm(request, result, normalizedInputs.account, "editAccount", normalizedInputs.title, "editTitle", normalizedInputs.category, "editCategory");
      if (formValidation.status != "Success") return;

      // Check for any changes:
      const previousTransaction = request.session.transactions[normalizedInputs.ID];

      // Set variables to properly match up differences within the cache
      normalizedInputs.categoryID = normalizedInputs.category;
      normalizedInputs.accountID = normalizedInputs.account;

      if (normalizedInputs.remove != "true" && !query.changesMade(normalizedInputs, previousTransaction)) {
         normalizedInputs.changes = false;
         responseHandler.sendSuccess(result, "No changes", normalizedInputs);
         return;
      } else {
         normalizedInputs.changes = true;
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
      const toMainCategory = mainCategories.hasOwnProperty(normalizedInputs.category);

      // Must be in same month and year to affect budget
      const currentBudgetDate = (request.session.budget.month).toString().split("-");

      const previousDate = (request.session.transactions[normalizedInputs.ID].date).toString().split("-");
      const inputDate = (normalizedInputs.date).split("-");

      // Compare YY-MM for input and previous dates using current budget year-month
      const previousDateAffectsBudget = (previousDate[0] == currentBudgetDate[0] && previousDate[1] == currentBudgetDate[1]);
      const currentDateAffectsBudget = (inputDate[0] == currentBudgetDate[0] && inputDate[1] == currentBudgetDate[1]);

      if (normalizedInputs.remove == "true") {
         await query.runQuery("DELETE FROM transactions WHERE transaction_id = ?;", [normalizedInputs.ID]);
         normalizedInputs.remove = true;

         if (!previousDateAffectsBudget) {
            // Update cache via deleting category
            delete request.session.transactions[normalizedInputs.ID];
            // Removals should only affect current budgets
            await request.session.save();
            responseHandler.sendSuccess(result, "Successfully removed transaction", normalizedInputs);
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

            delete request.session.transactions[normalizedInputs.ID];
            request.session.budget.Income.current  = parseFloat(newIncomeCurrent.toString());
            request.session.budget.Expenses.current  = parseFloat(newExpensesCurrent.toString());

            await request.session.save();
            await updateBudgetLeftOver(request);
            responseHandler.sendSuccess(result, "Successfully removed transaction", normalizedInputs);
            return;
         }
      } else if (!currentDateAffectsBudget && !previousDateAffectsBudget) {
         // Simple update transaction table, no budget if not within same month
         await query.runQuery("UPDATE transactions SET title = ?, date = ?, type = ?, amount = ?, account_id = ?, category_id = ? WHERE transaction_id = ?",
            [normalizedInputs.title, normalizedInputs.date, normalizedInputs.type, normalizedInputs.amount.toString(), normalizedInputs.account,
               normalizedInputs.category, normalizedInputs.ID]);

         normalizedInputs.amount = parseFloat(normalizedInputs.amount.toString());

         request.session.transactions[normalizedInputs.ID] = {
            title : normalizedInputs.title,
            type : normalizedInputs.type,
            categoryID : normalizedInputs.category,
            accountID : normalizedInputs.account,
            date : normalizedInputs.date,
            amount : normalizedInputs.amount
         };

         await request.session.save();
         responseHandler.sendSuccess(result, "Successfully updated transaction", normalizedInputs);
         return;
      }

      // Check if any changes will have affect on budget
      if (previousTransaction.type != normalizedInputs.type) {
         // Income -> Expenses and vice versa
         if (fromMainCategory && !toMainCategory && currentDateAffectsBudget) {
            // Income -> Expenses Category or Expenses -> Income categories
            newCategoryCurrent = new Decimal(request.session.budget.categories[normalizedInputs.category].current);
            newCategoryCurrent = newCategoryCurrent.plus(normalizedInputs.amount);
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
               newCategoryCurrent = new Decimal(request.session.budget.categories[normalizedInputs.category].current);
               newCategoryCurrent = newCategoryCurrent.plus(normalizedInputs.amount);
            }
         }

         // Update main trackers if applicable to budget
         if (normalizedInputs.type == "Income") {
            if (currentDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.plus(normalizedInputs.amount);
            }

            if (previousDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }
         } else {
            if (currentDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.plus(normalizedInputs.amount);
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
            newCategoryCurrent = new Decimal(request.session.budget.categories[normalizedInputs.category].current);
            newCategoryCurrent = newCategoryCurrent.plus(normalizedInputs.amount);
         } else if (!fromMainCategory && !toMainCategory) {
            // Income Category -> New Income Category
            if (normalizedInputs.category != previousTransaction.categoryID && previousDateAffectsBudget) {
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
            } else if (previousDateAffectsBudget) {
               // If they have the same sub category ID, then only make a single row update in database
               newCategoryCurrent = new Decimal(request.session.budget.categories[normalizedInputs.category].current);
               newCategoryCurrent = newCategoryCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               if (!newCategoryCurrent) {
                  newCategoryCurrent = new Decimal(request.session.budget.categories[normalizedInputs.category].current);
               }

               newCategoryCurrent = newCategoryCurrent.plus(normalizedInputs.amount);
            }
         }

         // Always update main trackers
         if (normalizedInputs.type == "Income") {
            if (previousDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               newIncomeCurrent = newIncomeCurrent.plus(normalizedInputs.amount);
            }
         } else {
            if (previousDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }

            if (currentDateAffectsBudget) {
               newExpensesCurrent = newExpensesCurrent.plus(normalizedInputs.amount);
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
            [newCategoryCurrent.toString(), normalizedInputs.ID]);

         // Update cache
         request.session.budget.categories[normalizedInputs.category].current = parseFloat(newCategoryCurrent.toString());
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
            [normalizedInputs.ID, newCategoryCurrent.toString(), previousTransaction.categoryID,
               previousCategoryCurrent.toString(), normalizedInputs.ID, previousTransaction.categoryID]);

         // Update cache
         request.session.budget.categories[normalizedInputs.category].current = parseFloat(newCategoryCurrent.toString());
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

      await query.runQuery(updateQuery, [newIncomeCurrent.toString(), newExpensesCurrent.toString(), normalizedInputs.title,
         normalizedInputs.category, normalizedInputs.account, normalizedInputs.type, normalizedInputs.date,
         normalizedInputs.amount.toString(), request.session.user_id, normalizedInputs.ID]);

      normalizedInputs.amount = parseFloat(normalizedInputs.amount.toString());

      request.session.transactions[normalizedInputs.ID] = {
         title : normalizedInputs.title,
         type : normalizedInputs.type,
         categoryID : normalizedInputs.category,
         accountID : normalizedInputs.account,
         date : normalizedInputs.date,
         amount : normalizedInputs.amount
      };

      await request.session.save();
      responseHandler.sendSuccess(result, "Successfully edited transaction", normalizedInputs);
   } catch (error) {
      console.error(error);
      responseHandler.sendError(result, 500, "username", "Could not successfully process request");
      return;
   }
});