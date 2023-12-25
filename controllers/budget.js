const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');

exports.getUserBudget = asyncHandler(async(request,result,next)=>{
   try{
      let userBudget = await query.runQuery('SELECT * FROM Budgets WHERE UserID = ?;',[request.session.UserID]);
      let userCategories = await query.runQuery('SELECT * FROM Categories WHERE UserID = ?;',[request.session.UserID]);
      let data = {};

      data['Income'] = {
         'current' : parseFloat(userBudget[0].IncomeCurrent),
         'total' : parseFloat(userBudget[0].IncomeTotal),
         'categories' : []
      }

      data['Expenses'] = {
         'current' : parseFloat(userBudget[0].ExpensesCurrent),
         'total' : parseFloat(userBudget[0].ExpensesTotal),
         'categories' : {}
      }

      for(let i = 0; i < userCategories.length; i++){
         //Add categories as needed to build proper components on frontend
         data[userCategories[i].Type].categories.push({
            'ID':userCategories[i].CategoryID,
            'name': userCategories[i].Name,
            'current' : parseFloat(userCategories[i].Current),
            'total' : parseFloat(userCategories[i].Total)
         });
      }

      data['Month'] = userBudget[0].Month;

      result.json(data);
   } catch(error){
      sharedReturn.sendError(result,'N/A',`Could not successfully process request <i class='fa-solid fa-database'></i>`);   }
});

exports.addCategory = asyncHandler(async(request,result,next)=>{
   let trimmedInputs = validation.trimInputs(result,request.body);

   if(trimmedInputs.status !== undefined){
      //Must have gotten an incorrect input like invalid decimal for dollar representation
      return;
   }



   //Use precise decimal arithmetic via decimal.js
   let validationCheck = validation.validateBudgetForm(result,trimmedInputs.name,trimmedInputs.type);

   if(validationCheck.status != 'pass'){
      return;
   }

   //FOR DECIMAL INPUTS ADD VALIDATION FOR 2 DECIMALS
   try{
      let randomID = await query.retrieveRandomID(`SELECT * FROM Categories WHERE CategoryID = ?;`);
      let formattedDate = query.getCurrentDate();

      let test = await query.runQuery('INSERT INTO Categories (CategoryID,Name,Type,Current,Total,Month,UserID) VALUES (?,?,?,?,?,?,?);',[randomID,trimmedInputs.name,trimmedInputs.type,0.00, trimmedInputs.amount.toString(), formattedDate,request.session.UserID]);
      console.log(test);
      //Returned trimmed inputs for constructing front end components
      trimmedInputs['ID'] = randomID;
      sharedReturn.sendSuccess(result,'Category added <i class="fa-solid fa-chart-pie" ></i>',trimmedInputs);
      return;
   } catch(error){
      sharedReturn.sendError(result,'addCategoryName',"Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

exports.resetBudget = asyncHandler(async(request,result,next)=>{
   //Implement Later
});