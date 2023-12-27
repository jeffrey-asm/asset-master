const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const validation = require("../database/validation.js");
const sharedReturn = require('./message.js');


exports.updateUser = asyncHandler(async(request,result,next)=>{
   let trimmedInputs = validation.trimInputs(result,request.body);

   //Validate form first
   let usernameValidation = validation.validateUsername(result,trimmedInputs.username);
   if (usernameValidation.status !== 'pass')  return;

   let emailValidation = validation.validateEmail(result,trimmedInputs.email);
   if (emailValidation.status !== 'pass') return;

   let changedUsername = false;
   let changedEmail = false;

   //First check if if properly returns
   if(request.session.Username != trimmedInputs.username){
      //Attempt to see if new username is unique
      changedUsername = true;
      let duplicateCheck = await query.searchDuplicates(result,`SELECT * FROM Users WHERE Username = ?;`, [trimmedInputs.username], 'username', `Username already taken <i class='fa-solid fa-database'></i>`);
      if(duplicateCheck) return;
   }

   if(request.session.Email != trimmedInputs.email){
      changedEmail = true;
      let duplicateCheck = await query.searchDuplicates(result,`SELECT * FROM Users WHERE Email = ?;`, [trimmedInputs.email], 'email', `Email already taken <i class='fa-solid fa-database'></i>`);

      if(duplicateCheck) return;
   }

   //Attempt to update database
   try{
      if(changedUsername && !changedEmail){
         //Only update username column
         await query.updateDatabase(result,'UPDATE Users SET Username = ? WHERE UserID = ?;',[trimmedInputs.username,request.session.UserID]);
         request.session.Username = trimmedInputs.username;
      } else if(changedEmail && !changedUsername){
         //New email implies no longer verified if already applied ('F')
         await query.updateDatabase(result,'UPDATE Users SET Email=?, Verified=? WHERE UserID=?;',[trimmedInputs.email,'F',request.session.UserID]);
         request.session.Email = trimmedInputs.email;
         request.session.Verified = 'F';
      } else if(changedUsername && changedEmail){
         //Update all essential columns
      await query.updateDatabase(result,'UPDATE Users SET Username = ?, Email = ?, Verified = ? WHERE UserID = ?;',[trimmedInputs.username,trimmedInputs.email,'F',request.session.UserID]);
         request.session.Username = trimmedInputs.username;
         request.session.Email = trimmedInputs.email;
         request.session.Verified = 'F';
      } else{
         //In case user did not change any values, don't bother writing an update query
         result.status(200);
         sharedReturn.sendSuccess(result,`No changes <i class="fa-solid fa-circle-info"></i>`);
         return;
      }
   } catch(error){
      result.status(500);
      sharedReturn.sendError(result,'email',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   } finally{
      //Ensure variables are properly saved
      await request.session.save();
      return;
   }
});

