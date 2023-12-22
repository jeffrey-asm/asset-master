function validateUsername(username){
   if(username.length == 0 || username.length > 30){
      return{
         status:'fail',
         componentID: 'username',
         message:"Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>"
      }
   }

   return {status:'pass'};
}

function validateEmail(email){
   let emailTest = new RegExp('^(([^<>()[\\]\\.,;:\\s@"]+(\\.[^<>()[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');

   console.log(email.length);

   if(emailTest.test(email) == 0 || email.length == 0){
      //Ensure valid email for security of account
      return{
         status:'fail',
         componentID: 'email',
         message:"Invalid email address <i class='fa-regular fa-envelope'></i>"
      }
   }
   return {status:'pass'};
}

function validatePasswords(password,secondPassword){
   let passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$");

   if(password.length < 8){
      return{
         status:'fail',
         componentID: 'password',
         message:"Passwords must have at least 8 total characters, but no more than 30 <i class='fa-solid fa-key'></i>"
      }
   } else if (passwordTest.test(password) == 0){
      //Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      return{
         status:'fail',
         componentID: 'password',
         message:"Passwords must have at least one special character (@$!%*?&), one digit, 1 uppercase, 1 lowercase, and at least 8 total characters, but no more than 30 <i class='fa-solid fa-key'></i>"
      }
   } else if (password != secondPassword){
      //Passwords must match in case users enters in undesired input for security
      return{
         status:'fail',
         componentID: 'additionalPassword',
         message:"Passwords do not match <i class='fa-solid fa-lock'></i>"
      }
   }
}

function editUserValidation(username,email){
   let userNameCheck = validateUsername(username);
   let emailCheck = validateEmail(email);

   if (userNameCheck.status !== 'pass') return userNameCheck;
   if (emailCheck !== 'pass') return emailCheck;
   return {status:'pass'};
}

function signUpFormValidation(username,password,additionalPassword,email){
   let userNameCheck = validateUsername(username);
   let passwordCheck = validatePasswords(password, additionalPassword);
   let emailCheck = validateEmail(email);


   if (userNameCheck.status !== 'pass') return userNameCheck;
   if (passwordCheck.status !== 'pass') return passwordCheck;
   if (emailCheck !== 'pass') return emailCheck;

   return {status:'pass'};
}

module.exports = {signUpFormValidation,editUserValidation};