const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');
const Decimal = require("decimal.js");


async function grabUserAccounts(request){
   try{
      let returnData = {
         accounts:{},
         transactions:{}
      };
      let netWorth = 0;
      let accounts = await query.runQuery('SELECT * FROM Accounts WHERE UserID = ?;',[request.session.UserID]);
      // let transactions = await query.runQuery('SELECT * FROM Transactions WHERE UserID = ? ORDER BY Month;',[request.session.UserID]);

      for(let i = 0; i < accounts.length; i++){
         let parsedBalance = parseFloat(accounts[i].Balance);

         returnData.accounts[accounts[i].AccountID] = {
            name:accounts[i].Name,
            type:accounts[i].Type,
            balance:parsedBalance
         }

         if(accounts[i].type == 'Loan' || accounts[i].type == 'Credit Card') parsedBalance *= -1;

         netWorth += parsedBalance;
      }

      returnData.netWorth = netWorth;

      // for(let i = 0; i < transactions.length; i++){
      //    returnData[transactions[i].TransactionID] = {
      //       title:accounts[i].Title,
      //       categoryID:accounts[i].CategoryID,
      //       month:accounts[i].Month,
      //       amount:accounts[i].Amount
      //    }
      // }
      return returnData;
   } catch(error){
      throw error;
   }
}

async function updateAccountsCache(request){
   //Update cached user data
   let updatedAccounts = await grabUserAccounts(request);
   request.session.accounts = updatedAccounts.accounts;
   request.session.transactions = updatedAccounts.transactions;
   request.session.netWorth = updatedAccounts.netWorth;
   await request.session.save();
   return updatedAccounts;
}

exports.getUserAccounts = asyncHandler(async(request,result,next)=>{
   try{
      let returnData;

      if(!request.session.accounts){
         returnData = await updateAccountsCache(request);
      } else{
         returnData = {
            accounts: request.session.accounts,
            transactions: request.session.transactions,
            netWorth:request.session.netWorth
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

      console.log(trimmedInputs);

      let formValidation = validation.validateAccountForm(result,trimmedInputs.name,'name',trimmedInputs.type,'type');
      if(formValidation.status != 'pass') return;

      let randomID = await query.retrieveRandomID('SELECT * FROM Accounts WHERE AccountID = ?;');

      await query.runQuery('INSERT INTO Accounts (AccountID,Name,Type,Balance,UserID) VALUES (?,?,?,?,?)',
         [randomID,trimmedInputs.name,trimmedInputs.type,trimmedInputs.balance.toString(),request.session.UserID]);

      trimmedInputs.ID = randomID;
      trimmedInputs.balance = parseFloat(trimmedInputs.balance.toString());

      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully added account <i class="fa-solid fa-layer-group fa-xl"></i>',trimmedInputs);

   } catch (error){
      result.status(500);
      sharedReturn.sendError(result,'username',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});