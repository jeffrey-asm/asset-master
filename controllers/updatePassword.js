const asyncHandler = require("express-async-handler");
const hash = require('../database/hash.js');
const runQuery = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');

exports.updatePassword = asyncHandler(async(request,result,next)=>{
   let trimmedInputs = validation.trimInputs(request.body);

   //Validate form first
   let newPasswordValidation = validation.validatePasswords(trimmedInputs.password, trimmedInputs.additionalPassword);

   if(newPasswordValidation.status != 'pass'){
      result.json(newPasswordValidation);
      return;
   }

   try{
      //Attempt to compare current password with input
      let oldPasswordHash = hash(trimmedInputs.oldPassword);
      let newPasswordHash = hash(trimmedInputs.password);


      let savedPasswordHash = await runQuery('SELECT PasswordHash FROM Users WHERE UserID = ?',[request.session.UserID]);

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

      await runQuery('UPDATE Users SET PasswordHash = ? WHERE UserID = ?;',[newPasswordHash,request.session.UserID]);

      sharedReturn.sendSuccess(result,`Password successfully changed <i class="fa-solid fa-lock"></i>`);
      return;
   } catch (error){
      sharedReturn.sendError(result,'oldPassword',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }


});

