const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');
const { default: Decimal } = require("decimal.js");

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

      return returnData;
   } catch(error){
      throw error;
   }
}

async function updateBudgetCache(request){
   //Update cached user data
   let updatedBudget = await grabBudgetInformation(request);
   request.session.budget = updatedBudget;
   return;
}

exports.getUserBudget = asyncHandler(async(request,result,next)=>{
   try{
      let returnData = {};

      if(!request.session.budget){
         returnData = await grabBudgetInformation(request);
         request.session.budget = returnData;
      } else{
         //Use cached data using redis for quicker accessing of temporary user data
         returnData = JSON.parse(JSON.stringify(request.session.budget));
      }
      result.status(200);
      sharedReturn.sendSuccess(result,'Data for displaying user budget',returnData);
   } catch(error){
      result.status(500);
      sharedReturn.sendError(result,'N/A',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
   } finally{
      await request.session.save();
   }
});

exports.addCategory = asyncHandler(async(request,result,next)=>{
   let trimmedInputs = validation.trimInputs(result,request.body);

    //Must have gotten an incorrect input like invalid decimal for dollar representation
   if(trimmedInputs.status !== undefined) return;

   //Use precise decimal arithmetic via decimal.js
   let validationCheck = validation.validateBudgetForm(result,trimmedInputs.name,trimmedInputs.type,false);

   if(validationCheck.status != 'pass') return;

   //FOR DECIMAL INPUTS ADD VALIDATION FOR 2 DECIMALS
   try{
      let randomID = await query.retrieveRandomID(`SELECT * FROM Categories WHERE CategoryID = ?;`);
      let formattedDate = query.getCurrentDate();

      await query.runQuery('INSERT INTO Categories (CategoryID,Name,Type,Current,Total,Month,UserID) VALUES (?,?,?,?,?,?,?);',[randomID,trimmedInputs.name,trimmedInputs.type,0.00, trimmedInputs.amount.toString(), formattedDate,request.session.UserID]);

      //Returned trimmed inputs for constructing front end components
      trimmedInputs['ID'] = randomID;
      result.status(200);
      sharedReturn.sendSuccess(result,'Category added <i class="fa-solid fa-chart-pie" ></i>',trimmedInputs);
      await updateBudgetCache(request);
   } catch(error){
      result.status(500);
      sharedReturn.sendError(result,'addCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
   } finally{
      await request.session.save();
   }
});

exports.updateCategory = asyncHandler(async(request,result,next)=>{
   try{
      let trimmedInputs = validation.trimInputs(result,request.body);
      if(trimmedInputs.status !== undefined) return;

      console.log(trimmedInputs);

      //HANDLE REMOVE ('on'), SWITCHING TYPES, AND DIFFERENTIATING MAIN VS SUB CHANGES
      let editingMainCategory = trimmedInputs.ID == 'mainIncome' || trimmedInputs.ID == 'mainExpenses';

      if(trimmedInputs.remove == true && !editingMainCategory){
         //Handle remove
         await query.runQuery(`DELETE FROM Categories WHERE CategoryID = ?;`,[trimmedInputs.ID]);
         result.status(200);
         sharedReturn.sendSuccess(result,'Successfully removed category <i class="fa-solid fa-trash"></i>');
         await updateBudgetCache(request);
         return;
   }

      let previousCategory;

      if(editingMainCategory){
         previousCategory = request.session.budget[trimmedInputs.name];
         previousCategory.total = new Decimal(`${previousCategory.total}`);

         //May only update total if there is a change using cached data
         if(!previousCategory.total.equals(trimmedInputs.amount)){
            let updateMainBudgetQuery = `UPDATE Budgets SET ${type}Total = ? WHERE UserID = ?;`;

            await query.runQuery(updateMainBudgetQuery,[trimmedInputs.amount,request.session.UserID]);
            result.status(200);
            sharedReturn.sendSuccess(result,'Successfully updated category <i class="fa-solid fa-chart-pie" ></i>');
            await updateBudgetCache(request);
         } else{
            console.log('NO CHANGES');
            result.status(200);
            sharedReturn.sendSuccess(result,'No changes <i class="fa-solid fa-circle-info"></i>');
            return;
         }

      } else{
         //Stored within main type's categories object {ID:{data}}
         previousCategory = request.session.budget[trimmedInputs.name].categories[trimmedInputs.ID];

         sharedReturn.sendError(result,'editCategoryName',"TEST <i class='fa-solid fa-database'></i>");

      }
   } catch(error){
      result.status(500)
      sharedReturn.sendError(result,'editCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }finally{
      await request.session.save();
   }
});

exports.resetBudget = asyncHandler(async(request,result,next)=>{
   //Implement Later
});