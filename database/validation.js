const Decimal = require('decimal.js');
const sharedReturn = require('../controllers/message');

exports.validateUsername = function(result,username){
   if(username.length == 0 || username.length > 30){
      result.status(400);
      sharedReturn.sendError(result,'username',"Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   }

   return { status: 'pass' };
}

exports.validateEmail = function(result,email){
   let emailTest = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

   if(emailTest.test(email) == 0){
      //Ensure valid email for security of account
      result.status(400);
      sharedReturn.sendError(result,'email',"Invalid email address <i class='fa-regular fa-envelope'></i>");
      return { status: 'fail' };
   }

   return { status: 'pass' };
}

exports.validatePasswords = function(result,password,secondPassword){
   let passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");
   if (passwordTest.test(password) == 0){
      //Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      result.status(400);
      sharedReturn.sendError(result,'password',"Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters <i class='fa-solid fa-key'></i>");
      return { status: 'fail' };
   } else if (password != secondPassword){
      //Passwords must match in case users enters in undesired input for security
      result.status(400);
      sharedReturn.sendError(result,'additionalPassword',"Passwords do not match <i class='fa-solid fa-lock'></i>");
      return { status: 'fail' };
   }
   return { status: 'pass' };
}

exports.trimInputs = function(result,inputs = {},decimalComponentID='amount',dateComponentID='date'){
   let keys = Object.keys(inputs);
   let trimmedInputs = {};

   for(let i = 0; i < keys.length; i++){
      //Only trim inputs of type string
     if(keys[i] == 'amount' || keys[i] == 'balance'){
         //Amount inputs all have names of amount in request.body
         try{
            trimmedInputs[keys[i]] = new Decimal(`${parseFloat(inputs[keys[i]]).toFixed(2)}`);

            if(isNaN(trimmedInputs[keys[i]])) throw error;

            let highLimit = new Decimal('99999999999.99');
            let lowLimit = new Decimal('0.00');

            if(trimmedInputs[keys[i]].gt(highLimit) ||  trimmedInputs[keys[i]].lessThanOrEqualTo(lowLimit)){
               sharedReturn.sendError(result,decimalComponentID,"Amount must be greater than $0.00, but less than $99,999,999,999.99 <i class='fa-brands fa-stack-overflow;'></i>");
               return { status: 'fail' };
            }
         } catch(error){
            result.status(400);
            sharedReturn.sendError(result,decimalComponentID,"Amount should represent a legitimate dollar value <i class='fa-solid fa-money-check-dollar'></i>");
            return { status: 'fail' };
         }
      } else if(keys[i] == 'date'){
         trimmedInputs[keys[i]] = inputs[keys[i]].trim();
         let parts = inputs[keys[i]].split('-');

         if (parts.length !== 3) {
            result.status(400);
            sharedReturn.sendError(result,dateComponentID,"Invalid date <i class='fa-solid fa-calendar-days'></i>");
            return { status: 'fail' };
         }

         let year = parseInt(parts[0]);
         let month = parseInt(parts[1]) - 1;
         let day = parseInt(parts[2]);

         let inputDate = new Date(year, month, day);

         if(isNaN(inputDate)){
            result.status(400);
            sharedReturn.sendError(result,dateComponentID,"Invalid date <i class='fa-solid fa-calendar-days'></i>");
            return { status: 'fail' };
         } else{
            let currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            if(inputDate > currentDate){
               result.status(400);
               sharedReturn.sendError(result,dateComponentID,"Date cannot be in the future <i class='fa-solid fa-calendar-days'></i>");
               return { status: 'fail' };
            }
         }
      }else if(typeof inputs[keys[i]] == 'string'){
         trimmedInputs[keys[i]] = inputs[keys[i]].trim();
      }
   }

   return trimmedInputs;
}

exports.validateBudgetForm = function(result,name,nameComponentID,type,typeComponentID,editingMainCategory=false){
   if(name.length == 0 || name.length > 30){
      result.status(400);
      sharedReturn.sendError(result,nameComponentID,"Category names must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   } else if(editingMainCategory == false && (name == 'Income' || name == 'Expenses')){
      result.status(400);
      sharedReturn.sendError(result,typeComponentID,"Category cannot be 'Income' or 'Expenses' <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   } else if(type != "Income" && type != 'Expenses'){
      result.status(400);
      //Rare case that user edits frontend form to return a type not supported by database
      sharedReturn.sendError(result,typeComponentID,"Category type must be Income or Expenses<i class='fa-solid fa-coins'></i>");
      return { status: 'fail' };
   }

   //Amount is validated via trimInputs function
   return { status: 'pass' };
}

exports.validateAccountForm = function(result,name,nameComponentID,type,typeComponentID){
   let options = {
      "Checking": 1,
      "Savings": 1,
      "Credit Card": 1,
      "Retirement": 1,
      "Investment": 1,
      "Loan": 1,
      "Property": 1,
      "Other": 1
    };

   if(name.length == 0 || name.length > 30){
      result.status(400);
      sharedReturn.sendError(result,nameComponentID,"Account names must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   } else if(!options[type]){
      result.status(400);
      sharedReturn.sendError(result,typeComponentID,"Invalid account type <i class='fa-solid fa-building-columns'></i>");
      return { status: 'fail' };
   }

   return { status: 'pass' };
}

exports.validateTransactionForm = function(request,result,account,accountComponentID,title,titleComponentID,category,categoryComponentID){
   //Test that ID's exist within request
   //Amount and date is validated in the trim inputs function
   if(title.length == 0 || title.length > 50){
      result.status(400);
      sharedReturn.sendError(result,titleComponentID,"Transaction title's must be between 1 and 50 characters <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   } else if(account != null && !request.session.accounts[account]){
      //Always test for a valid request using current cache for altering of form on frontend
      result.status(400);
      sharedReturn.sendError(result,accountComponentID,"Invalid account <i class='fa-solid fa-building-columns'></i>");
      return { status: 'fail' };
   } else if((category != 'Income' && category != 'Expenses') && !request.session.budget.categories[category]){
      result.status(400);
      sharedReturn.sendError(result,categoryComponentID,"Invalid category <i class='fa-solid fa-building-columns'></i>");
      return { status: 'fail' };
   }

   return { status: 'pass' };
}
