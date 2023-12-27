const Decimal = require('decimal.js');
const sharedReturn = require('../controllers/message');

function validateUsername(result,username){
   if(username.length == 0 || username.length > 30){
      result.status(400);
      sharedReturn.sendError(result,'username',"Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   }

   return { status: 'pass' };
}

function validateEmail(result,email){
   let emailTest = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

   if(emailTest.test(email) == 0){
      //Ensure valid email for security of account
      result.status(400);
      sharedReturn.sendError(result,'email',"Invalid email address <i class='fa-regular fa-envelope'></i>");
      return { status: 'fail' };
   }

   return { status: 'pass' };
}

function validatePasswords(result,password,secondPassword){
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

function trimInputs(result,inputs = {}){
   let keys = Object.keys(inputs);
   let trimmedInputs = {};

   for(let i = 0; i < keys.length; i++){
      //Only trim inputs of type string
     if(keys[i] == 'amount'){
         //Amount inputs all have names of amount in request.body
         try{
            trimmedInputs[keys[i]] = new Decimal(`${parseFloat(inputs[keys[i]]).toFixed(2)}`);

            if(isNaN(trimmedInputs[keys[i]])) throw error;

            let highLimit = new Decimal('99999999999.99');
            let lowLimit = new Decimal('0.00');

            if(trimmedInputs[keys[i]].gt(highLimit) ||  trimmedInputs[keys[i]].lessThanOrEqualTo(lowLimit)){
               sharedReturn.sendError(result,'amount',"Amount must be greater than $0.00, but less than $99,999,999,999.99 <i class='fa-brands fa-stack-overflow;'></i>");
               return { status: 'fail' };
            }
         } catch(error){
            result.status(400);
            sharedReturn.sendError(result,'amount',"The category amount should represent a legitimate dollar value <i class='fa-solid fa-money-check-dollar'></i>");
            return { status: 'fail' };
         }
      } else if(typeof inputs[keys[i]] == 'string'){
         trimmedInputs[keys[i]] = inputs[keys[i]].trim();
      }
   }

   return trimmedInputs;
}

function validateBudgetForm(result,name,type,editingMainCategory=false){
   if(name.length == 0 || name.length > 30){
      result.status(400);
      sharedReturn.sendError(result,'name',"Category names must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   } else if(editingMainCategory == false && (name == 'Income' || name == 'Expenses')){
      result.status(400);
      sharedReturn.sendError(result,'name',"Category cannot be 'Income' or 'Expenses' <i class='fa-solid fa-signature'></i>");
      return { status: 'fail' };
   } else if(type != "Income" && type != 'Expenses'){
      result.status(400);
      //Rare case that user edits frontend form to return a type not supported by database
      sharedReturn.sendError(result,'type',"Category type must be Income or Expenses<i class='fa-solid fa-coins'></i>");
      return { status: 'fail' };
   }

   //Amount is validated via trimInputs function
   return { status: 'pass' };
}

module.exports = {validateUsername,validateEmail,validatePasswords,trimInputs,validateBudgetForm};