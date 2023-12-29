const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');
const Decimal = require("decimal.js");

function testNewMonth(oldDate){
   // YY-MM-DD
   let currentDate = query.getCurrentMonth().split('-');
   let currentMonth = parseInt(currentDate[1]);
   let currentYear = parseInt(currentDate[0]);

   let testingDate = new Date(oldDate);
   let testingMonth = testingDate.getMonth() + 1;
   let testingYear = testingDate.getFullYear();

   if(testingYear == currentYear){
      return currentMonth > testingMonth;
   } else{
      return currentYear > testingYear;
   }
}

async function grabBudgetInformation(request){
   try{
      let returnData = {};
      let userBudget = await query.runQuery('SELECT * FROM Budgets WHERE UserID = ?;',[request.session.UserID]);
      let userCategories = await query.runQuery('SELECT * FROM Categories WHERE UserID = ?;',[request.session.UserID]);

      returnData['Income'] = {
         'current' : parseFloat(userBudget[0].IncomeCurrent),
         'total' : parseFloat(userBudget[0].IncomeTotal),
         'categories' : {}
      }

      returnData['Expenses'] = {
         'current' : parseFloat(userBudget[0].ExpensesCurrent),
         'total' : parseFloat(userBudget[0].ExpensesTotal),
         'categories' : {}
      }

      for(let i = 0; i < userCategories.length; i++){
         //Add categories as needed to build proper components on frontend
         // Main Type -> Categories -> ID -> {}
         returnData[userCategories[i].Type].categories[userCategories[i].CategoryID] = {
            'name': userCategories[i].Name,
            'current' : parseFloat(userCategories[i].Current),
            'total' : parseFloat(userCategories[i].Total)
         }
      }


      returnData['Month'] = userBudget[0].Month;

      let resetBudgetTest = testNewMonth(returnData['Month']);

      if(resetBudgetTest){
         //Show user pop up that they should reset budget and note down current budget as database space is limited
         // All transactions are still saved
         returnData['notify'] = true;
      }

      let incomeFixed = new Decimal(userBudget[0].IncomeCurrent);
      let expensesFixed = new Decimal(userBudget[0].ExpensesCurrent);

      returnData['leftOver'] = parseFloat(String(incomeFixed.minus(expensesFixed)));

      return returnData;
   } catch(error){
      throw error;
   }
}

async function updateBudgetCache(request){
   //Update cached user data
   let updatedBudget = await grabBudgetInformation(request);
   request.session.budget = updatedBudget;
   await request.session.save();
   return updatedBudget;
}

exports.getUserBudget = asyncHandler(async(request,result,next)=>{
   try{
      let returnData = {};

      if(!request.session.budget){
         returnData = await updateBudgetCache(request);
      } else{
         //Use cached data using redis for quicker accessing of temporary user data
         returnData = JSON.parse(JSON.stringify(request.session.budget));
      }

      result.status(200);
      sharedReturn.sendSuccess(result,'Data for displaying user budget',returnData);
   } catch(error){
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
      trimmedInputs['ID'] = randomID;
      trimmedInputs.amount = parseFloat(trimmedInputs.amount.toString());
      result.status(200);
      sharedReturn.sendSuccess(result,'Successfully added category <i class="fa-solid fa-chart-pie" ></i>',trimmedInputs);
      await updateBudgetCache(request);
   } catch(error){
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
         // await query.runQuery(`UPDATE Transactions SET CategoryID = NULL WHERE CategoryID = ?;`,[trimmedInputs.ID]);
         result.status(200);
         trimmedInputs['changes'] = true;
         trimmedInputs['mainOrSub'] = 'main';
         trimmedInputs['current'] =  request.session.budget[`${trimmedInputs.type}`].current
         trimmedInputs['total'] = request.session.budget[`${trimmedInputs.type}`].total;
         sharedReturn.sendSuccess(result,'Successfully removed category <i class="fa-solid fa-trash"></i>',trimmedInputs);
         await updateBudgetCache(request);
         return;
      }

      if(editingMainCategory){
         previousCategory = request.session.budget[trimmedInputs.name];
         previousTotal = new Decimal(`${previousCategory.total}`);
         previousCurrent = new Decimal(`${previousCategory.current}`);

         //May only update total if there is a change using cached data
         if(!previousTotal.equals(trimmedInputs.amount)){
            let updateMainBudgetQuery = `UPDATE Budgets SET ${trimmedInputs.type}Total = ? WHERE UserID = ?;`;

            await query.runQuery(updateMainBudgetQuery,[trimmedInputs.amount.toString(),request.session.UserID]);
            result.status(200);
            trimmedInputs['mainOrSub'] = 'main';
            trimmedInputs['total'] = parseFloat(trimmedInputs.amount.toString());
            trimmedInputs['current'] = parseFloat(previousCurrent.toString());
            trimmedInputs['changes'] = true;
            sharedReturn.sendSuccess(result,'Successfully updated category <i class="fa-solid fa-chart-pie" ></i>',trimmedInputs);
            await updateBudgetCache(request);
            return;
         } else{
            result.status(200);
            sharedReturn.sendSuccess(result,'No changes <i class="fa-solid fa-circle-info"></i>',trimmedInputs);
            return;
         }
      } else{
         //Stored within main type's categories object {ID:{data}}
         let previousType;

         if(request.session.budget['Income'].categories[trimmedInputs.ID]){
            previousType = 'Income';
         } else{
            previousType = 'Expenses';
         }

         previousCategory = request.session.budget[`${previousType}`].categories[trimmedInputs.ID];
         previousTotal = new Decimal(`${previousCategory.total}`);
         previousCurrent = new Decimal(`${previousCategory.current}`);

         trimmedInputs['current'] = parseFloat(previousCurrent.toString());

         let changesMade = false;

         if(!(previousTotal).equals(trimmedInputs.amount)){
            changesMade = true;
            trimmedInputs['mainOrSub'] = 'sub';
         }

         if(trimmedInputs.name != previousCategory.name){
            changesMade = true;
         }

         if(previousType != trimmedInputs.type){
            //Swapping between Income and Expenses, must update both current trackers
            let newIncomeTotal = new Decimal(`${request.session.budget['Income'].current}`);
            let newExpensesTotal = new Decimal(`${request.session.budget['Expenses'].current}`);

            //Transfer of values in terms of income/expenses totals given swapping category current
            if(trimmedInputs.type == 'Income'){
               newIncomeTotal  = newIncomeTotal.plus(previousCurrent);
               newExpensesTotal = newExpensesTotal.minus(previousCurrent);
            } else{
               newIncomeTotal = newIncomeTotal.minus(previousCurrent);
               newExpensesTotal = newExpensesTotal.plus(previousCurrent);
            }


            await query.runQuery('UPDATE Budgets SET IncomeCurrent = ?, ExpensesCurrent = ? WHERE UserID = ?;',
            [newIncomeTotal.toString(),newExpensesTotal.toString(),request.session.UserID]);
            // await query.runQuery(`UPDATE Transactions SET Type = ? WHERE CategoryID = ?;`,[trimmedInputs.type,trimmedInputs.ID]);

            //Will need to re-construct containers for changes in several categories
            changesMade = true;
            trimmedInputs['mainOrSub'] = 'reload';
         }

         result.status(200);

         if(changesMade){
            await query.runQuery('UPDATE Categories SET Name = ?, Type = ?, Total = ? WHERE CategoryID = ?;',[trimmedInputs.name, trimmedInputs.type,trimmedInputs.amount.toString(),trimmedInputs.ID]);
            trimmedInputs['changes'] = true;
            trimmedInputs['total'] = parseFloat(trimmedInputs.amount.toString());
            sharedReturn.sendSuccess(result,'Changes saved <i class="fa-solid fa-check"></i>',trimmedInputs);
            await updateBudgetCache(request);
         } else{
            trimmedInputs['changes'] = false;
            sharedReturn.sendSuccess(result,`No changes <i class="fa-solid fa-circle-info"></i>`);
         }
      }
   } catch(error){
      result.status(500);
      sharedReturn.sendError(result,'editCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});

exports.resetBudget = asyncHandler(async(request,result,next)=>{
   try{
      let validRequest = testNewMonth(request.session.budget.Month);
      let currentMonth = query.getCurrentMonth();

      if(!validRequest){
         throw error;
      }

      await query.runQuery('UPDATE Budgets Set IncomeCurrent = 0.00, ExpensesCurrent = 0.00, Month = ? WHERE UserID = ?',[currentMonth,request.session.UserID]);
      await query.runQuery('UPDATE Categories Set Current = 0.00, Month = ? WHERE UserID = ?',[currentMonth,request.session.UserID]);

      //Await for cache to store data first for proper rendering
      await updateBudgetCache(request);
      result.status(200);
      sharedReturn.sendSuccess(result,'Budget reset for the month <i class="fa-solid fa-check"></i>');
   }catch(error){
      result.status(500);
      sharedReturn.sendError(result,'editCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});