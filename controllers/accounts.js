const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');
const Decimal = require("decimal.js");
const budgetController = require('./budget.js');


async function grabUserAccounts(request){
   try{
      let returnData = {
         accounts:{},
         transactions:{},
         budget:{},
         netWorth:0.00
      };
      let netWorth = new Decimal('0.00');
      let accounts = await query.runQuery('SELECT * FROM Accounts WHERE UserID = ?;',[request.session.UserID]);
      let transactions = await query.runQuery('SELECT * FROM Transactions WHERE UserID = ? ORDER BY Month;',[request.session.UserID]);

      for(let i = 0; i < accounts.length; i++){
         let preciseBalance = new Decimal(accounts[i].Balance);

         returnData.accounts[accounts[i].AccountID] = {
            name:accounts[i].Name,
            type:accounts[i].Type,
            balance:parseFloat(preciseBalance.toString())
         }

         if(accounts[i].Type == 'Loan' || accounts[i].Type == 'Credit Card') preciseBalance = preciseBalance.neg();

         netWorth = netWorth.plus(preciseBalance);
      }

      returnData.netWorth = parseFloat(netWorth.toString());

      for(let i = 0; i < transactions.length; i++){
         returnData.transactions[transactions[i].TransactionID] = {
            title:accounts[i].Title,
            type: accounts[i].Type,
            categoryID:accounts[i].CategoryID,
            accountID: accounts[i].accountID,
            month:accounts[i].Month,
            amount:accounts[i].Amount
         }
      }

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

async function setUpAccountsCache(request){
   //Update cached user data
   let updatedAccounts = await grabUserAccounts(request);
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
         returnData = await setUpAccountsCache(request);
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
         name:trimmedInputs.name,
         type:trimmedInputs.type,
         balance:trimmedInputs.balance
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

      let previousBalance = new Decimal(request.session.accounts[trimmedInputs.ID].balance);
      let previousName = request.session.accounts[trimmedInputs.ID].name;
      let previousType = request.session.accounts[trimmedInputs.ID].type;

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
         // await query.runQuery(`UPDATE Transactions SET AccountID = '' WHERE AccountID = ?;`,[trimmedInputs.ID]);
          //Must add onto Net worth when removing any type of debt


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

      if(previousType != trimmedInputs.type || previousName != trimmedInputs.name || !(previousBalance.abs()).equals(trimmedInputs.balance)){
         //Update columns on any change
         await query.runQuery('UPDATE Accounts SET Name = ?, Type = ?, Balance = ? WHERE AccountID = ?;',[trimmedInputs.name, trimmedInputs.type,trimmedInputs.balance.toString(),trimmedInputs.ID]);

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

         //Revert back to an absolute value type in case this is a debt type account
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

exports.addTransaction = asyncHandler(async(request,result,next)=>{
   try{
      let trimmedInputs = validation.trimInputs(result,request.body,'amount');
      if(trimmedInputs.status != undefined) return;

      console.log(trimmedInputs);
      throw error;


      let randomID = await query.retrieveRandomID('SELECT * FROM Transactions WHERE TransactionID = ?');

      await query.runQuery('INSERT INTO Transactions (TransactionID, Title, Month, Amount, UserID, AccountID, CategoryID) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomID, trimmedInputs.title,trimmedInputs.month,trimmedInputs.amount.toString(),request.session.UserID,trimmedInputs.AccountID, trimmedInputs.CategoryID]);

      trimmedInputs.ID = randomID;

      if(budgetController.testNewMonth(trimmedInputs.month)){
         //Only update budget for current month expenses
         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully added transaction <i class="fa-solid fa-credit-card"></i>',trimmedInputs);
      }



      let mainCategoryCurrent = new Decimal(`${request.session.budget[`${trimmedInputs.type}`].current}`);
      mainCategoryCurrent = mainCategoryCurrent.plus(trimmedInputs.amount);

      const updateBudgetQuery = `UPDATE Budgets SET ${trimmedInputs.type}Current = ?, WHERE UserID = ?;`;
      await query.runQuery(updateBudgetQuery,[mainCategoryCurrent.toString(),request.session.UserID]);
      request.session.budget[`${trimmedInputs.type}`].current = parseFloat(mainCategoryCurrent.toString());

      if(trimmedInputs.categoryID != 'Income' || trimmedInputs.categoryID != 'Income' ){
         //Update category
         let categoryCurrent = new Decimal(`${request.session.budget.categories[trimmedInputs.categoryID].current}`);
         categoryCurrent = categoryCurrent.plus(trimmedInputs.amount);
         await query.runQuery('UPDATE Budgets SET Current = ?, WHERE CategoryID = ?;',[categoryCurrent.toString(),trimmedInputs.categoryID]);
         request.session.budget.categories[trimmedInputs.categoryID].current = parseFloat(categoryCurrent.toString());
      }

      await request.session.save();
      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully added transaction <i class="fa-solid fa-credit-card"></i>',trimmedInputs);


   } catch (error){
      result.status(500);
      sharedReturn.sendError(result,'N/A',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});