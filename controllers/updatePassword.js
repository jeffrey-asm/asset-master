const asyncHandler = require("express-async-handler");
const hash = require('../database/hash.js');
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');

exports.updatePassword = asyncHandler(async(request,result,next)=>{
   let trimmedInputs = validation.trimInputs(result,request.body);

   //Validate form first
   let newPasswordValidation = validation.validatePasswords(result,trimmedInputs.password, trimmedInputs.additionalPassword);

   if(newPasswordValidation.status != 'pass'){
      return;
   }

   try{
      //Attempt to compare current password with input
      let oldPasswordHash = hash(trimmedInputs.oldPassword);
      let newPasswordHash = hash(trimmedInputs.password);


      let savedPasswordHash = await query.runQuery('SELECT PasswordHash FROM Users WHERE UserID = ?',[request.session.UserID]);

      if(savedPasswordHash.hasOwnProperty('error')){
         throw error;
      }

      if(savedPasswordHash[0].PasswordHash != oldPasswordHash){
         sharedReturn.sendError(result,'oldPassword',`Incorrect password <i class='fa-solid fa-lock'></i>`);
         return;
      } else if(savedPasswordHash[0].PasswordHash == newPasswordHash){
         sharedReturn.sendError(result,'password',`New Password must be not be the same as current password <i class='fa-solid fa-lock'></i>`);
         return;
      }

      await query.runQuery('UPDATE Users SET PasswordHash = ? WHERE UserID = ?;',[newPasswordHash,request.session.UserID]);

      sharedReturn.sendSuccess(result,`Password successfully changed <i class="fa-solid fa-lock"></i>`);
      return;
   } catch (error){
      sharedReturn.sendError(result,'oldPassword',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }


});

