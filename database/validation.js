function validateUsername(username){
   if(username.length == 0 || username.length > 30){
      return{
         status:'fail',
         componentID: 'username',
         message:"Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>"
      }
   }

   return { status: 'pass' };
}

function validateEmail(email){
   let emailTest = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

   if(emailTest.test(email) == 0){
      //Ensure valid email for security of account
      return{
         status:'fail',
         componentID: 'email',
         message:"Invalid email address <i class='fa-regular fa-envelope'></i>"
      }
   }

   return { status: 'pass' };
}

function validatePasswords(password,secondPassword){
   let passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");
   if (passwordTest.test(password) == 0){
      //Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      return{
         status:'fail',
         componentID: 'password',
         message:"Passwords must have at least one special character (@$!%*?&), one digit, 1 uppercase, 1 lowercase, and at least 8 total characters <i class='fa-solid fa-key'></i>"
      }
   } else if (password != secondPassword){
      //Passwords must match in case users enters in undesired input for security
      return{
         status:'fail',
         componentID: 'additionalPassword',
         message:"Passwords do not match <i class='fa-solid fa-lock'></i>"
      }
   }
   return { status: 'pass' };
}

function trimInputs(inputs = {}){
   let keys = Object.keys(inputs);
   let trimmedInputs = {};

   for(let i = 0; i < keys.length; i++){
      //Only trim inputs of type string
      if(typeof inputs[keys[i]] == 'string'){
         trimmedInputs[keys[i]] = inputs[keys[i]].trim();
      }
   }

   return trimmedInputs;
}

module.exports = {validateUsername,validateEmail,validatePasswords,trimInputs};