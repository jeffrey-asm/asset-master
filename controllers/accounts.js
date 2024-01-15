const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');
const Decimal = require("decimal.js");
const budgetController = require('./budget.js');

async function grabUserData(request){
   try{
      let returnData = {
         accounts : {},
         transactions : {},
         budget : {},
         netWorth : 0.00
      };
      let netWorth = new Decimal('0.00');
      let accounts = await query.runQuery('SELECT * FROM Accounts WHERE UserID = ?;',[request.session.UserID]);
      let transactions = await query.runQuery('SELECT * FROM Transactions WHERE UserID = ?;',[request.session.UserID]);

      for(let account of accounts) {
         let preciseBalance = new Decimal(account.Balance);

         returnData.accounts[account.AccountID] = {
            name : account.Name,
            type : account.Type,
            balance : parseFloat(preciseBalance.toString()),
         }

         if(account.Type == 'Loan' || account.Type == 'Credit Card') preciseBalance = preciseBalance.neg();

         netWorth = netWorth.plus(preciseBalance);
      };

      returnData.netWorth = parseFloat(netWorth.toString());

      for(let transaction of transactions) {
         returnData.transactions[transaction.TransactionID] = {
            title : transaction.Title,
            type : transaction.Type,
            categoryID : transaction.CategoryID,
            accountID : transaction.AccountID,
            date : transaction.Date,
            amount : parseFloat(transaction.Amount)
         }
      };

      if(!request.session.budget){
         //Need budget for specific categories in transaction form
         returnData.budget = request.session.budget = await budgetController.grabBudgetInformation(request);
      } else{
         returnData.budget = request.session.budget;
      }
      return returnData;
   } catch(error){
      console.log(error);
      throw error;
   }
}

exports.setUpAccountsCache = async function (request){
   //Update cached user data
   let updatedAccounts = await grabUserData(request);
   request.session.accounts = updatedAccounts.accounts;
   request.session.transactions = updatedAccounts.transactions;
   request.session.netWorth = updatedAccounts.netWorth;
   request.session.budget = updatedAccounts.budget;
   await request.session.save();
   return updatedAccounts;
}

exports.getUserAccounts = asyncHandler(async(request,result,next)=>{
   try{
      let returnData;

      if(!request.session.accounts){
         returnData = await exports.setUpAccountsCache(request);
      } else{
         returnData = {
            accounts: request.session.accounts,
            transactions: request.session.transactions,
            netWorth:request.session.netWorth,
            budget: request.session.budget
         }
      }

      result.status(200);
      sharedReturn.sendSuccess(result,'N/A',returnData);
   } catch (error){
      result.status(500);
      sharedReturn.sendError(result,'N/A',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});


exports.addAccount = asyncHandler(async(request,result,next)=>{
   try{
      let trimmedInputs = validation.trimInputs(result,request.body,'balance');
      if(trimmedInputs.status != undefined) return;

      let formValidation = validation.validateAccountForm(result,trimmedInputs.name,'name',trimmedInputs.type,'type');
      if(formValidation.status != 'pass') return;

      let randomID = await query.retrieveRandomID('SELECT * FROM Accounts WHERE AccountID = ?;');

      await query.runQuery('INSERT INTO Accounts (AccountID,Name,Type,Balance,UserID) VALUES (?,?,?,?,?)',
         [randomID,trimmedInputs.name,trimmedInputs.type,trimmedInputs.balance.toString(),request.session.UserID]);

      trimmedInputs.ID = randomID;

      //Update net-worth and accounts cache
      let adjustingNetWorthAmount;

      if(trimmedInputs.type == 'Loan' || trimmedInputs.type == 'Credit Card') {
         adjustingNetWorthAmount = trimmedInputs.balance.neg();
      } else{
         adjustingNetWorthAmount = new Decimal(trimmedInputs.balance);
      }
      trimmedInputs.balance = parseFloat(trimmedInputs.balance.toString());

      if(request.session.netWorth){
         let currentNetWorth = new Decimal(request.session.netWorth);
         request.session.netWorth  =  trimmedInputs.netWorth = parseFloat((currentNetWorth.plus(adjustingNetWorthAmount)).toString());
      } else{
         request.session.netWorth  = trimmedInputs.netWorth  = trimmedInputs.balance;
      }

      request.session.accounts[randomID] = {
         name : trimmedInputs.name,
         type : trimmedInputs.type,
         balance : trimmedInputs.balance
      }

      await request.session.save();

      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully added account <i class="fa-solid fa-building-columns"></i>',trimmedInputs);

   } catch (error){
      console.log(error)
      result.status(500);
      sharedReturn.sendError(result,'username',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});


exports.editAccount = asyncHandler(async(request,result,next)=>{
   try{
      let trimmedInputs = validation.trimInputs(result,request.body,'editBalance');
      if(trimmedInputs.status != undefined) return;

      let formValidation = validation.validateAccountForm(result,trimmedInputs.name,'editName',trimmedInputs.type,'editType');
      if(formValidation.status != 'pass') return;

      let previousAccount = request.session.accounts[trimmedInputs.ID];
      let previousBalance = new Decimal(previousAccount.balance);
      let previousType = previousAccount.type;

      let debtTypes ={
         'Loan' : 1,
         'Credit Card': 1
      }

      if(debtTypes[previousType]) previousBalance = previousBalance.neg();

      let currentNetWorth = new Decimal(request.session.netWorth);
      currentNetWorth = currentNetWorth.minus(previousBalance);

      if(trimmedInputs.remove == "true"){
         //Handle remove (income/expenses is not changed at all because all transactions are moved to main types)
         await query.runQuery(`DELETE FROM Accounts WHERE AccountID = ?;`,[trimmedInputs.ID]);

         await query.runQuery(`UPDATE Transactions SET AccountID = ? WHERE AccountID = ?;`,['',trimmedInputs.ID]);
         //Must add onto Net worth when removing any type of debt

         let possibleTransactionIDs = Object.keys(request.session.transactions);

         possibleTransactionIDs.forEach((transactionID) => {
            //Update all connected account transactions within the cache
            if(request.session.transactions[transactionID].accountID == trimmedInputs.ID){
               request.session.transactions[transactionID].accountID = null;
            }
         });

         trimmedInputs.remove = true;
         trimmedInputs.changes = true;
         //Update cache accordingly
         request.session.netWorth = trimmedInputs.netWorth = parseFloat(currentNetWorth.toString());
         delete request.session.accounts[trimmedInputs.ID];
         await request.session.save();

         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully removed account <i class="fa-solid fa-building-columns"></i>',trimmedInputs);
         return;
      }

      trimmedInputs.remove = false;

      console.log(trimmedInputs);
      console.log(previousAccount);

      if(query.changesMade(trimmedInputs,previousAccount)){
         //Update columns on any change
         await query.runQuery('UPDATE Accounts SET Name = ?, Type = ?, Balance = ? WHERE AccountID = ?;',
         [trimmedInputs.name, trimmedInputs.type,trimmedInputs.balance.toString(),trimmedInputs.ID]);

         trimmedInputs.changes = true;
         trimmedInputs.remove = false;

         let adjustingNetWorthAmount;

         if(debtTypes[trimmedInputs.type]){
            //Ensure new type reflects a debt value to adjust net worth
            adjustingNetWorthAmount = trimmedInputs.balance.neg();
         } else{
            adjustingNetWorthAmount = new Decimal(trimmedInputs.balance);
         }

         request.session.netWorth  = trimmedInputs.netWorth  = parseFloat((currentNetWorth.plus(adjustingNetWorthAmount)).toString());

         trimmedInputs.balance = parseFloat(trimmedInputs.balance.toString());

         request.session.accounts[trimmedInputs.ID] = {
            name:trimmedInputs.name,
            type:trimmedInputs.type,
            balance:trimmedInputs.balance
         }

         await request.session.save();

         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully edited account <i class="fa-solid fa-building-columns"></i>',trimmedInputs);
      } else{
         trimmedInputs.changes = false;
         result.status(200);
         sharedReturn.sendSuccess(result,'No changes <i class="fa-solid fa-circle-info"></i>',trimmedInputs);
      }

   } catch (error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result,'username',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});

async function updateBudgetLeftOver(request){
   let incomeFixed = new Decimal(request.session.budget.Income.current);
   let expensesFixed =  new Decimal(request.session.budget.Expenses.current);

   request.session.budget.leftOver = parseFloat((incomeFixed.minus(expensesFixed).toString()));
   await request.session.save();
}

exports.addTransaction = asyncHandler(async(request,result,next)=>{
   try{
      let trimmedInputs = validation.trimInputs(result,request.body,'amount','date');
      if(trimmedInputs.status != undefined) return;

      if(trimmedInputs.account == ''){
         trimmedInputs.account = null;
      }

      let formValidation = validation.validateTransactionForm(request,result,trimmedInputs.account,'account',trimmedInputs.title,'title',trimmedInputs.category,'category');
      if(formValidation.status != 'pass') return;


      let randomID = await query.retrieveRandomID('SELECT * FROM Transactions WHERE TransactionID = ?');

      await query.runQuery('INSERT INTO Transactions (TransactionID, Title, Date, Type, Amount, UserID, AccountID, CategoryID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [randomID, trimmedInputs.title,trimmedInputs.date,trimmedInputs.type,trimmedInputs.amount.toString(),
         request.session.UserID,trimmedInputs.account, trimmedInputs.category]);

      trimmedInputs.ID = randomID;

      //Must be in same month and year to affect budget
      let currentBudgetDate = (request.session.budget.Month).toString().split('-');
      let testingDate = (trimmedInputs.date).split('-');

      if(testingDate[0] != currentBudgetDate[0] || testingDate[1] != currentBudgetDate[1]){
         //Only update budget for current month expenses
         trimmedInputs.amount = parseFloat((trimmedInputs.amount).toString());

         request.session.transactions[randomID] = {
            title : trimmedInputs.title,
            type : trimmedInputs.type,
            categoryID : trimmedInputs.category,
            accountID : trimmedInputs.account,
            date : trimmedInputs.date,
            amount : trimmedInputs.amount
         }

         await request.session.save();

         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully added transaction <i class="fa-solid fa-credit-card"></i>',trimmedInputs);
         return;
      }

      let mainCategoryCurrent = new Decimal(request.session.budget[`${trimmedInputs.type}`].current);
      mainCategoryCurrent = mainCategoryCurrent.plus(trimmedInputs.amount);

      await query.runQuery(`UPDATE Budgets SET ?? = ? WHERE UserID = ?;`,
      [`${trimmedInputs.type}Current`,mainCategoryCurrent.toString(),request.session.UserID]);

      request.session.budget[`${trimmedInputs.type}`].current = parseFloat(mainCategoryCurrent.toString());

      if(trimmedInputs.category != 'Income' && trimmedInputs.category != 'Expenses'){
         //Update category
         let categoryCurrent = new Decimal(`${request.session.budget.categories[trimmedInputs.category].current}`);
         categoryCurrent = categoryCurrent.plus(trimmedInputs.amount);
         await query.runQuery('UPDATE Categories SET Current = ? WHERE CategoryID = ?;',
         [categoryCurrent.toString(),trimmedInputs.category]);

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
      }

      await request.session.save();
      await updateBudgetLeftOver(request);

      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully added transaction <i class="fa-solid fa-credit-card"></i>',trimmedInputs);
   } catch (error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result,'N/A',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});

exports.editTransaction = asyncHandler(async(request,result,next) => {
   try{
      let trimmedInputs = validation.trimInputs(result,request.body,'editAmount','editDate');
      if(trimmedInputs.status != undefined) return;

      if(trimmedInputs.account == ''){
         trimmedInputs.account = null;
      }

      let formValidation = validation.validateTransactionForm(request,result,trimmedInputs.account,'editAccount',trimmedInputs.title,'editTitle',trimmedInputs.category,'editCategory');
      if(formValidation.status != 'pass') return;

      //Check for any changes:
      let previousTransaction = request.session.transactions[trimmedInputs.ID];

      //Set variables to properly match up differences within the cache
      trimmedInputs.categoryID = trimmedInputs.category;
      trimmedInputs.accountID = trimmedInputs.account;

      if(trimmedInputs.remove != 'true' && !query.changesMade(trimmedInputs,previousTransaction)){
         trimmedInputs.changes = false;
         result.status(200);
         sharedReturn.sendSuccess(result,'No changes <i class="fa-solid fa-circle-info"></i>',trimmedInputs);
         return;
      } else{
         trimmedInputs.changes = true;
      }

      let previousAmount = new Decimal(previousTransaction.amount);

      let newIncomeCurrent = new Decimal(request.session.budget.Income.current);
      let newExpensesCurrent = new Decimal(request.session.budget.Expenses.current);

      let previousCategoryCurrent = null;
      let newCategoryCurrent = null;

      let mainCategories = {
         'Income':true,
         'Expenses':true
      }

      let fromMainCategory = mainCategories.hasOwnProperty(previousTransaction.categoryID);
      let toMainCategory = mainCategories.hasOwnProperty(trimmedInputs.category);

      //Must be in same month and year to affect budget
      let currentBudgetDate = (request.session.budget.Month).toString().split('-');

      let previousDate = (request.session.transactions[trimmedInputs.ID].date).toString().split('-');
      let inputDate = (trimmedInputs.date).split('-');

      //Compare YY-MM for input and previous dates using current budget year-month
      let previousDateAffectsBudget = (previousDate[0] == currentBudgetDate[0] && previousDate[1] == currentBudgetDate[1]);
      let currentDateAffectsBudget = (inputDate[0] == currentBudgetDate[0] && inputDate[1] == currentBudgetDate[1]);

      if(trimmedInputs.remove == 'true'){
         await query.runQuery(`DELETE FROM Transactions WHERE TransactionID = ?;`,[trimmedInputs.ID]);
         trimmedInputs.remove = true;

         if(!previousDateAffectsBudget){
            //Update cache via deleting category
            delete request.session.transactions[trimmedInputs.ID];
            //Removals should only affect current budgets
            await request.session.save();
            result.status(200);
            sharedReturn.sendSuccess(result,'Successfully removed transaction <i class="fa-solid fa-trash"></i>',trimmedInputs);
            return;
         } else{
            //Update Budgets
            if(!fromMainCategory){
               //Update category
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);

               await query.runQuery(`UPDATE Categories SET Current = ? WHERE CategoryID = ?;`,
               [previousCategoryCurrent.toString(),previousTransaction.categoryID]);

               request.session.budget.categories[previousTransaction.categoryID].current = parseFloat(previousCategoryCurrent.toString());
            }

            if(previousTransaction.type == 'Income'){
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            } else{
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }

            await query.runQuery(`UPDATE Budgets SET IncomeCurrent = ?, ExpensesCurrent = ? WHERE UserID = ?;`,[newIncomeCurrent.toString(),newExpensesCurrent.toString(),request.session.UserID]);

            delete request.session.transactions[trimmedInputs.ID];
            request.session.budget.Income.current  = parseFloat(newIncomeCurrent.toString());
            request.session.budget.Expenses.current  = parseFloat(newExpensesCurrent.toString());

            await request.session.save();
            await updateBudgetLeftOver(request);

            result.status(200);
            sharedReturn.sendSuccess(result,'Successfully removed transaction <i class="fa-solid fa-trash"></i>',trimmedInputs);
            return;
         }

      } else if(!currentDateAffectsBudget && !previousDateAffectsBudget) {
         //Simple update transaction table, no budget if not within same month
         await query.runQuery('UPDATE Transactions SET Title = ?, Date = ?, Type = ?, Amount = ?, AccountID = ?, CategoryID = ? WHERE TransactionID = ?',
         [trimmedInputs.title,trimmedInputs.date,trimmedInputs.type,trimmedInputs.amount.toString(),trimmedInputs.account,
            trimmedInputs.category,trimmedInputs.ID]);

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

         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully updated transaction <i class="fa-solid fa-credit-card"></i>',trimmedInputs);
         return;
      }

      //Check if any changes will have affect on budget always
      if(previousTransaction.type != trimmedInputs.type){
         //Income -> Expenses and vice versa
         if(fromMainCategory && !toMainCategory && currentDateAffectsBudget){
            //Income -> Expenses Category or Expenses -> Income Categories
            newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
            newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
         } else if(!fromMainCategory && toMainCategory && previousDateAffectsBudget){
            //Income Category -> Expenses  or Expenses Category -> Income
            previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
            previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
         } else if(!fromMainCategory && !toMainCategory){
            //Income Category -> Expenses Category  or Expenses Category -> Income Category
            if(previousDateAffectsBudget){
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
            }

            if(currentDateAffectsBudget){
               newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
               newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
            }
         }

         //Update main trackers if applicable to budget
         if(trimmedInputs.type == 'Income'){
            if(currentDateAffectsBudget){
               newIncomeCurrent = newIncomeCurrent.plus(trimmedInputs.amount);
            }

            if(previousDateAffectsBudget){
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }
         } else{
            if(currentDateAffectsBudget){
               newExpensesCurrent = newExpensesCurrent.plus(trimmedInputs.amount);
            }

            if(previousDateAffectsBudget){
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            }
         }
      } else {
         // Handle any changes within same type domain
         if(!fromMainCategory && toMainCategory && previousDateAffectsBudget){
            // Income Category -> Income (No affect on main total)
            previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
            previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
         } else if(fromMainCategory && !toMainCategory && currentDateAffectsBudget){
            // Income -> Income Category
            newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
            newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
         } else if(!fromMainCategory && !toMainCategory){
            //Income Category -> New Income Category
            if(trimmedInputs.category != previousTransaction.categoryID && previousDateAffectsBudget){
               previousCategoryCurrent = new Decimal(request.session.budget.categories[previousTransaction.categoryID].current);
               previousCategoryCurrent = previousCategoryCurrent.minus(previousAmount);
            } else if(previousDateAffectsBudget){
               //If they have the same sub category ID, then only make a single row update in database
               newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
               newCategoryCurrent = newCategoryCurrent.minus(previousAmount);
            }

            if(currentDateAffectsBudget){
               if(!newCategoryCurrent){
                  newCategoryCurrent = new Decimal(request.session.budget.categories[trimmedInputs.category].current);
               }

               newCategoryCurrent = newCategoryCurrent.plus(trimmedInputs.amount);
            }
         }

         //Always update main trackers
         if(trimmedInputs.type == 'Income'){
            if(previousDateAffectsBudget){
               newIncomeCurrent = newIncomeCurrent.minus(previousAmount);
            }

            if(currentDateAffectsBudget){
               newIncomeCurrent = newIncomeCurrent.plus(trimmedInputs.amount);
            }
         } else{
            if(previousDateAffectsBudget){
               newExpensesCurrent = newExpensesCurrent.minus(previousAmount);
            }

            if(currentDateAffectsBudget){
               newExpensesCurrent = newExpensesCurrent.plus(trimmedInputs.amount);
            }
         }
      }

      request.session.budget.Income.current  = parseFloat(newIncomeCurrent.toString());
      request.session.budget.Expenses.current  = parseFloat(newExpensesCurrent.toString());

      if(previousCategoryCurrent && !newCategoryCurrent){
         // Case of Income Category -> Income or Income
         await query.runQuery(`Update Categories Set Current = ? WHERE CategoryID = ?`,
         [previousCategoryCurrent.toString(),previousTransaction.categoryID]);

         //Update cache
         request.session.budget.categories[previousTransaction.categoryID].current = parseFloat(previousCategoryCurrent.toString());
      } else if(!previousCategoryCurrent && newCategoryCurrent){
         // All other cases involving from main to new category within current month
         await query.runQuery(`Update Categories Set Current = ? WHERE CategoryID = ?`,
         [newCategoryCurrent.toString(),trimmedInputs.ID]);

         //Update cache
         request.session.budget.categories[trimmedInputs.category].current = parseFloat(newCategoryCurrent.toString());
      } else if(previousCategoryCurrent && newCategoryCurrent){
         //Updating two categories in one go
         const updateCategoriesQuery = `
            UPDATE Categories
            Set Current =
               CASE
                  WHEN CategoryID = ? THEN ?
                  WHEN CategoryID = ? THEN ?
                  ELSE Current
               END
            WHERE CategoryID IN (?,?);
         `;
         await query.runQuery(updateCategoriesQuery,
            [trimmedInputs.ID,newCategoryCurrent.toString(),previousTransaction.categoryID,
               previousCategoryCurrent.toString(),trimmedInputs.ID,previousTransaction.categoryID]);

         //Update cache
         request.session.budget.categories[trimmedInputs.category].current = parseFloat(newCategoryCurrent.toString());
         request.session.budget.categories[previousTransaction.categoryID].current = parseFloat(previousCategoryCurrent.toString());
      }

      await request.session.save();
      await updateBudgetLeftOver(request);

      //Update transactions and budgets table in one go for monthly budget affects
      const updateQuery = `UPDATE Transactions T
                           JOIN Budgets B ON T.UserID = B.UserID
                           SET
                              B.IncomeCurrent = ?,
                              B.ExpensesCurrent = ?,
                              T.Title = ?,
                              T.CategoryID = ?,
                              T.AccountID = ?,
                              T.Type = ?,
                              T.Date = ?,
                              T.Amount = ?
                           WHERE T.UserID = ? AND T.TransactionID = ?;`;
      await query.runQuery(updateQuery,[newIncomeCurrent.toString(),newExpensesCurrent.toString(),trimmedInputs.title,
         trimmedInputs.category,trimmedInputs.account,trimmedInputs.type,trimmedInputs.date,
         trimmedInputs.amount.toString(),request.session.UserID,trimmedInputs.ID]);

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

      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully edited transaction <i class="fa-solid fa-credit-card"></i>',trimmedInputs);
   } catch (error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result,'username',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});