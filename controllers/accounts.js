const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const sharedReturn = require("./message.js");
const Decimal = require("decimal.js");
const budgetController = require("./budget.js");

exports.grabUserData =  async function (request) {
   try {
      const returnData = {
         accounts : {},
         transactions : {},
         budget : {},
         netWorth : 0.00
      };

      let netWorth = new Decimal("0.00");
      const accounts = await query.runQuery("SELECT * FROM Accounts WHERE UserID = ?;", [request.session.UserID]);
      const transactions = await query.runQuery("SELECT * FROM Transactions WHERE UserID = ?;", [request.session.UserID]);

      for (const account of accounts) {
         let preciseBalance = new Decimal(account.Balance);

         returnData.accounts[account.AccountID] = {
            name : account.Name,
            type : account.Type,
            balance : parseFloat(preciseBalance.toString()),
         };

         if (account.Type == "Loan" || account.Type == "Credit Card") preciseBalance = preciseBalance.neg();

         netWorth = netWorth.plus(preciseBalance);
      };

      returnData.netWorth = parseFloat(netWorth.toString());

      for (const transaction of transactions) {
         returnData.transactions[transaction.TransactionID] = {
            title : transaction.Title,
            type : transaction.Type,
            categoryID : transaction.CategoryID,
            accountID : transaction.AccountID,
            date : transaction.Date,
            amount : parseFloat(transaction.Amount)
         };
      };

      if (!request.session.budget) {
         // Need budget for specific categories in transaction form
         returnData.budget = request.session.budget = await budgetController.grabBudgetInformation(request);
      } else {
         returnData.budget = request.session.budget;
      }
      return returnData;
   } catch (error) {
      console.log(error);
      throw error;
   }
};

exports.setUpAccountsCache = async function (request) {
   // Update cached user data
   const updatedAccounts = await exports.grabUserData(request);
   request.session.accounts = updatedAccounts.accounts;
   request.session.transactions = updatedAccounts.transactions;
   request.session.netWorth = updatedAccounts.netWorth;
   request.session.budget = updatedAccounts.budget;
   await request.session.save();
   return updatedAccounts;
};

exports.getUserAccounts = asyncHandler(async (request, result, next) => {
   try {
      let returnData;

      if (!request.session.accounts) {
         returnData = await exports.setUpAccountsCache(request);
      } else {
         returnData = {
            accounts: request.session.accounts,
            transactions: request.session.transactions,
            netWorth:request.session.netWorth,
            budget: request.session.budget
         };
      }

      sharedReturn.sendSuccess(result, "N/A", returnData);
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "N/A", "Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});


exports.addAccount = asyncHandler(async (request, result, next) => {
   try {
      const trimmedInputs = validation.trimInputs(result, request.body, "balance");
      if (trimmedInputs.status != undefined) return;

      const formValidation = validation.validateAccountForm(result, trimmedInputs.name, "name", trimmedInputs.type, "type");
      if (formValidation.status != "pass") return;

      const randomID = await query.retrieveRandomID("SELECT * FROM Accounts WHERE AccountID = ?;");

      await query.runQuery("INSERT INTO Accounts (AccountID,Name,Type,Balance,UserID) VALUES (?,?,?,?,?)",
         [randomID, trimmedInputs.name, trimmedInputs.type, trimmedInputs.balance.toString(), request.session.UserID]);

      trimmedInputs.ID = randomID;

      // Update net-worth and accounts cache
      let adjustingNetWorthAmount;

      if (trimmedInputs.type == "Loan" || trimmedInputs.type == "Credit Card") {
         adjustingNetWorthAmount = trimmedInputs.balance.neg();
      } else {
         adjustingNetWorthAmount = new Decimal(trimmedInputs.balance);
      }
      trimmedInputs.balance = parseFloat(trimmedInputs.balance.toString());

      if (request.session.netWorth) {
         const currentNetWorth = new Decimal(request.session.netWorth);
         request.session.netWorth  =  trimmedInputs.netWorth = parseFloat((currentNetWorth.plus(adjustingNetWorthAmount)).toString());
      } else {
         request.session.netWorth  = trimmedInputs.netWorth  = trimmedInputs.balance;
      }

      request.session.accounts[randomID] = {
         name : trimmedInputs.name,
         type : trimmedInputs.type,
         balance : trimmedInputs.balance
      };

      await request.session.save();
      sharedReturn.sendSuccess(result, "Successfully added account <i class=\"fa-solid fa-building-columns\"></i>", trimmedInputs);
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "username", "Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});


exports.editAccount = asyncHandler(async (request, result, next) => {
   try {
      const trimmedInputs = validation.trimInputs(result, request.body, "editBalance");
      if (trimmedInputs.status != undefined) return;

      const formValidation = validation.validateAccountForm(result, trimmedInputs.name, "editName", trimmedInputs.type, "editType");
      if (formValidation.status != "pass") return;

      const previousAccount = request.session.accounts[trimmedInputs.ID];
      let previousBalance = new Decimal(previousAccount.balance);
      const previousType = previousAccount.type;

      const debtTypes = {
         "Loan" : 1,
         "Credit Card": 1
      };

      if (debtTypes[previousType]) previousBalance = previousBalance.neg();

      let currentNetWorth = new Decimal(request.session.netWorth);
      currentNetWorth = currentNetWorth.minus(previousBalance);

      if (trimmedInputs.remove == "true") {
         // Handle remove (income/expenses is not changed at all because all transactions are moved to main types)
         await query.runQuery("DELETE FROM Accounts WHERE AccountID = ?;", [trimmedInputs.ID]);

         await query.runQuery("UPDATE Transactions SET AccountID = ? WHERE AccountID = ?;", ["", trimmedInputs.ID]);
         // Must add onto Net worth when removing any type of debt

         const possibleTransactionIDs = Object.keys(request.session.transactions);

         possibleTransactionIDs.forEach((transactionID) => {
            // Update all connected account transactions within the cache
            if (request.session.transactions[transactionID].accountID == trimmedInputs.ID) {
               request.session.transactions[transactionID].accountID = null;
            }
         });

         trimmedInputs.remove = true;
         trimmedInputs.changes = true;
         // Update cache accordingly
         request.session.netWorth = trimmedInputs.netWorth = parseFloat(currentNetWorth.toString());
         delete request.session.accounts[trimmedInputs.ID];
         await request.session.save();

         sharedReturn.sendSuccess(result, "Successfully removed account <i class=\"fa-solid fa-building-columns\"></i>", trimmedInputs);
         return;
      }

      trimmedInputs.remove = false;

      if (query.changesMade(trimmedInputs, previousAccount)) {
         // Update columns on any change
         await query.runQuery("UPDATE Accounts SET Name = ?, Type = ?, Balance = ? WHERE AccountID = ?;",
            [trimmedInputs.name, trimmedInputs.type, trimmedInputs.balance.toString(), trimmedInputs.ID]);

         trimmedInputs.changes = true;
         trimmedInputs.remove = false;

         let adjustingNetWorthAmount;

         if (debtTypes[trimmedInputs.type]) {
            // Ensure new type reflects a debt value to adjust net worth
            adjustingNetWorthAmount = trimmedInputs.balance.neg();
         } else {
            adjustingNetWorthAmount = new Decimal(trimmedInputs.balance);
         }

         request.session.netWorth  = trimmedInputs.netWorth  = parseFloat((currentNetWorth.plus(adjustingNetWorthAmount)).toString());

         trimmedInputs.balance = parseFloat(trimmedInputs.balance.toString());

         request.session.accounts[trimmedInputs.ID] = {
            name:trimmedInputs.name,
            type:trimmedInputs.type,
            balance:trimmedInputs.balance
         };

         await request.session.save();
         sharedReturn.sendSuccess(result, "Successfully edited account <i class=\"fa-solid fa-building-columns\"></i>", trimmedInputs);
      } else {
         trimmedInputs.changes = false;
         sharedReturn.sendSuccess(result, "No changes <i class=\"fa-solid fa-circle-info\"></i>", trimmedInputs);
      }
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "username", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});