const asyncHandler = require("express-async-handler");
const query = require('../database/query.js');
const sharedReturn = require('./message.js');

exports.login = asyncHandler(async(request,result,next)=>{
   //No login in form validation given we match credentials using username and password hash
   try{
      let passwordHash = query.hash(request.body.password);

      let credentialsCheck = await query.runQuery(`SELECT * FROM Users WHERE Username = ?;`,[request.body.username]);

      if(credentialsCheck.length != 1 || passwordHash !== credentialsCheck[0].PasswordHash){
         result.status(400);
         sharedReturn.sendError(result,'username',`Invalid Credentials <i class='fa-solid fa-database'></i>`);
         return;
      } else {
         //Compare hashed passwords
         request.session.UserID = credentialsCheck[0].UserID;
         request.session.Username = credentialsCheck[0].Username;
         request.session.Email = credentialsCheck[0].Email;
         request.session.Verified = credentialsCheck[0].Verified;
         await request.session.save();
         result.status(200);
         sharedReturn.sendSuccess(result,`Welcome <i class="fa-solid fa-lock-open"></i>`);
         return;
      }
   } catch (error){
      result.status(500);
      sharedReturn.sendError(result,'username',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   }
});

