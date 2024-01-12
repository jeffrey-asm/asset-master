const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');
const Decimal = require("decimal.js");
const accountController = require('./accounts.js');

exports.testNewMonth = function(oldDate){
   // YY-MM-DD
   let currentDate = query.getCurrentMonth().split('-');
   let currentMonth = parseInt(currentDate[1]);
   let currentYear = parseInt(currentDate[0]);

   let testingDate = new Date(oldDate);
   let testingMonth = testingDate.getMonth() + 1;
   let testingYear = testingDate.getFullYear();

   return testingMonth != currentMonth || currentYear != testingYear;
}

exports.grabBudgetInformation =  async function(request,result,next){
   try{
      let returnData = {};
      let userBudget = await query.runQuery('SELECT * FROM Budgets WHERE UserID = ?;',[request.session.UserID]);
      let userCategories = await query.runQuery('SELECT * FROM Categories WHERE UserID = ? ORDER BY Type DESC;',[request.session.UserID]);

      returnData.Income = {
         current : parseFloat(userBudget[0].IncomeCurrent),
         total : parseFloat(userBudget[0].IncomeTotal),
      }

      returnData.Expenses = {
         current : parseFloat(userBudget[0].ExpensesCurrent),
         total : parseFloat(userBudget[0].ExpensesTotal),
      }

      returnData.categories = {};

      for(let i = 0; i < userCategories.length; i++){
         // Categories -> ID -> {}
         returnData.categories[userCategories[i].CategoryID] = {
            name : userCategories[i].Name,
            type : userCategories[i].Type,
            current : parseFloat(userCategories[i].Current),
            total : parseFloat(userCategories[i].Total),
            month: userCategories[i].Month,
         }
      }

      returnData.Month = userBudget[0].Month;
      request.session.budget = returnData;
      await request.session.save();

      let resetBudgetTest = exports.testNewMonth(returnData.Month);

      let incomeFixed = new Decimal(userBudget[0].IncomeCurrent);
      let expensesFixed = new Decimal(userBudget[0].ExpensesCurrent);

      if(resetBudgetTest){
         //Reset budget for the month ==> all budget values should be 0.00
         returnData = await exports.resetBudget(request,result,next);
      } else{
         returnData.leftOver = parseFloat((incomeFixed.minus(expensesFixed).toString()));
      }

      return returnData;
   } catch(error){
      console.log(error);
      throw error;
   }
}

exports.getUserBudget = asyncHandler(async(request,result,next)=>{
   try{
      let returnData = {};

      if(!request.session.budget){
         returnData = request.session.budget = await exports.grabBudgetInformation(request,result,next);
         await request.session.save();
      } else{
         //Use cached data using redis for quicker accessing of temporary user data
         returnData = JSON.parse(JSON.stringify(request.session.budget));
      }

      result.status(200);
      sharedReturn.sendSuccess(result,'Data for displaying user budget',returnData);
   } catch(error){
      console.log(error);

      result.status(500);
      sharedReturn.sendError(result,'N/A',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
   }
});

exports.addCategory = asyncHandler(async(request,result,next)=>{
   let trimmedInputs = validation.trimInputs(result,request.body,'amount');

   //Must have gotten an incorrect input like invalid decimal for dollar representation
   if(trimmedInputs.status != undefined) return;

   //Use precise decimal arithmetic via decimal.js
   let validationCheck = validation.validateBudgetForm(result,trimmedInputs.name,'name',trimmedInputs.type,'type',false);

   if(validationCheck.status != 'pass') return;

   try{
      let randomID = await query.retrieveRandomID(`SELECT * FROM Categories WHERE CategoryID = ?;`);
      let formattedDate = query.getCurrentMonth();

      await query.runQuery('INSERT INTO Categories (CategoryID,Name,Type,Current,Total,Month,UserID) VALUES (?,?,?,?,?,?,?);',
      [randomID,trimmedInputs.name,trimmedInputs.type,0.00, trimmedInputs.amount.toString(), formattedDate,request.session.UserID]);

      //Returned trimmed inputs for constructing front end components
      trimmedInputs.ID = randomID;
      trimmedInputs.amount = parseFloat(trimmedInputs.amount.toString());

      //Update cache
      request.session.budget.categories[randomID] = {
         name : trimmedInputs.name,
         type : trimmedInputs.type,
         current : 0.00,
         total : trimmedInputs.amount,
         month : formattedDate
      }

      await request.session.save();

      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully added category <i class="fa-solid fa-chart-pie" ></i>',trimmedInputs);
   } catch(error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result,'addCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});

exports.updateCategory = asyncHandler(async(request,result,next)=>{
   try{
      let trimmedInputs = validation.trimInputs(result,request.body,'editAmount');
      if(trimmedInputs.status != undefined) return;

      let editingMainCategory = trimmedInputs.ID == 'mainIncome' || trimmedInputs.ID == 'mainExpenses';

      let validationCheck = validation.validateBudgetForm(result,trimmedInputs.name,'editName',trimmedInputs.type,'editType',editingMainCategory);
      if(validationCheck.status != 'pass') return;

      let previousCategory,previousCurrent,previousTotal;

      if(trimmedInputs.remove == "true" && !editingMainCategory){
         //Handle remove (income/expenses is not changed at all because all transactions are moved to main types)
         await query.runQuery(`DELETE FROM Categories WHERE CategoryID = ?;`,[trimmedInputs.ID]);

         if(!request.session.transactions){
            await accountController.setUpAccountsCache(request);
         }

         let possibleTransactionIDs = Object.keys(request.session.transactions);
         let previousType = request.session.budget.categories[trimmedInputs.ID].type;

         await query.runQuery(`UPDATE Transactions SET CategoryID = ? WHERE CategoryID = ?;`,[previousType,trimmedInputs.ID]);

         for(let i = 0; i < possibleTransactionIDs.length; i++){
            //Update all connected account transactions within the cache and roll back to main type
            if(request.session.transactions[possibleTransactionIDs[i]].categoryID == trimmedInputs.ID){
               request.session.transactions[possibleTransactionIDs[i]].categoryID = previousType;
            }
         }

         trimmedInputs.changes = true;
         trimmedInputs.mainOrSub = 'remove';

         //Update cache via deleting category
         delete request.session.budget.categories[trimmedInputs.ID];
         await request.session.save();

         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully removed category <i class="fa-solid fa-trash"></i>',trimmedInputs);
         return;
      }

      if(editingMainCategory){
         previousCategory = request.session.budget[trimmedInputs.name];
         previousTotal = new Decimal(`${previousCategory.total}`);
         previousCurrent = new Decimal(`${previousCategory.current}`);

         //May only update total if there is a change using cached data
         if(!previousTotal.equals(trimmedInputs.amount)){
            await query.runQuery(`UPDATE Budgets SET ?? = ? WHERE UserID = ?;`,[`${trimmedInputs.type}Total`,trimmedInputs.amount.toString(),request.session.UserID]);

            trimmedInputs.mainOrSub = 'main';
            trimmedInputs.total = parseFloat(trimmedInputs.amount.toString());
            trimmedInputs.current = parseFloat(previousCurrent.toString());
            trimmedInputs.changes = true;

            request.session.budget[trimmedInputs.type].total = trimmedInputs.total;
            await request.session.save();

            result.status(200);
            sharedReturn.sendSuccess(result,'Successfully updated category <i class="fa-solid fa-chart-pie" ></i>',trimmedInputs);
            return;
         } else{
            result.status(200);
            sharedReturn.sendSuccess(result,'No changes <i class="fa-solid fa-circle-info"></i>',trimmedInputs);
            return;
         }
      } else{
         //Stored within main type's categories object {ID:{data}}
         let previousType = request.session.budget.categories[trimmedInputs.ID].type;

         previousCategory = request.session.budget.categories[trimmedInputs.ID];
         previousTotal = new Decimal(`${previousCategory.total}`);
         previousCurrent = new Decimal(`${previousCategory.current}`);

         trimmedInputs.current = parseFloat(previousCurrent.toString());

         let changesMade = false;
         trimmedInputs.mainOrSub = 'sub';

         if(!(previousTotal).equals(trimmedInputs.amount) || trimmedInputs.name != previousCategory.name){
            changesMade = true;
         }

         if(previousType != trimmedInputs.type){
            //Swapping between Income and Expenses, must update both current trackers
            let newIncomeCurrent = new Decimal(`${request.session.budget.Income.current}`);
            let newExpensesCurrent = new Decimal(`${request.session.budget.Expenses.current}`);

            //Transfer of values in terms of income/expenses totals given swapping category current
            if(trimmedInputs.type == 'Income'){
               newIncomeCurrent = newIncomeCurrent.plus(previousCurrent);
               newExpensesCurrent = newExpensesCurrent.minus(previousCurrent);
            } else{
               newIncomeCurrent = newIncomeCurrent.minus(previousCurrent);
               newExpensesCurrent = newExpensesCurrent.plus(previousCurrent);
            }

            request.session.budget.Income.current  = parseFloat(newIncomeCurrent.toString());
            request.session.budget.Expenses.current  = parseFloat(newExpensesCurrent.toString());

            await query.runQuery('UPDATE Budgets SET IncomeCurrent = ?, ExpensesCurrent = ? WHERE UserID = ?;',
            [newIncomeCurrent.toString(),newExpensesCurrent.toString(),request.session.UserID]);
            await query.runQuery(`UPDATE Transactions SET Type = ? WHERE CategoryID = ?;`,[trimmedInputs.type,trimmedInputs.ID]);

            if(!request.session.transactions){
               await accountController.setUpAccountsCache(request);
            }

            let possibleTransactionIDs = Object.keys(request.session.transactions);

            for(let i = 0; i < possibleTransactionIDs.length; i++){
               //Update all connected account transactions within the cache
               if(request.session.transactions[possibleTransactionIDs[i]].categoryID == trimmedInputs.ID){
                  request.session.transactions[possibleTransactionIDs[i]].type = trimmedInputs.type;
               }
            }

            //Will need to re-construct containers for changes in several categories
            changesMade = true;
            trimmedInputs.mainOrSub = 'reload';
         }

         if(changesMade){
            await query.runQuery('UPDATE Categories SET Name = ?, Type = ?, Current = ?, Total = ? WHERE CategoryID = ?;',
            [trimmedInputs.name, trimmedInputs.type,trimmedInputs.current.toString(),trimmedInputs.amount.toString(),trimmedInputs.ID]);
            trimmedInputs.changes = true;
            trimmedInputs.total = parseFloat(trimmedInputs.amount.toString());

            //Update specific category cache
            request.session.budget.categories[trimmedInputs.ID].name = trimmedInputs.name;
            request.session.budget.categories[trimmedInputs.ID].type = trimmedInputs.type;
            request.session.budget.categories[trimmedInputs.ID].current = trimmedInputs.current;
            request.session.budget.categories[trimmedInputs.ID].total = trimmedInputs.total;

            result.status(200);
            sharedReturn.sendSuccess(result,'Changes saved <i class="fa-solid fa-check"></i>',trimmedInputs);
         } else{
            trimmedInputs.changes = false;
            result.status(200);
            sharedReturn.sendSuccess(result,`No changes <i class="fa-solid fa-circle-info"></i>`);
         }
      }
   } catch(error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result,'editCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});

exports.resetBudget = asyncHandler(async(request,result,next)=>{
   try{
      let validRequest = exports.testNewMonth(request.session.budget.Month);
      let currentMonth = query.getCurrentMonth();

      if(!validRequest){
         throw error;
      }

      let resetQuery = `UPDATE Budgets B
                        JOIN Categories C ON B.UserID = C.UserID
                        SET B.IncomeCurrent = 0.00,
                           B.ExpensesCurrent = 0.00,
                           B.Month = ?,
                           C.Current = 0.00,
                           C.Month = ?
                        WHERE B.UserID = ?;`

      await query.runQuery(resetQuery,[currentMonth,currentMonth,request.session.UserID]);

      //Await for cache to store data first for proper rendering
      request.session.budget.Income.current = request.session.budget.Expenses.current = 0.00;

      let categories = Object.keys(request.session.budget.categories);

      for(let i = 0; i < categories.length; i++){
         request.session.budget.categories[categories[i]].current = 0.00;
         request.session.budget.categories[categories[i]].month = currentMonth;
      }

      request.session.budget.leftOver = 0.00;
      request.session.budget.Month = currentMonth;
      await request.session.save();
      return request.session.budget;
   } catch(error){
      return;
   }
});