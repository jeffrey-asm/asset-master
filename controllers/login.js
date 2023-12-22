const asyncHandler = require("express-async-handler");
const runQuery = require('../database/query.js');
const hash = require('../database/hash.js');

exports.login = asyncHandler(async(request,result,next)=>{
   //Validation?: no login in form validation given we match credentials using username and password hash
   try{
      let passwordHash = hash(request.body.password);

      let credentialsCheck = await runQuery(`SELECT * FROM Users WHERE Username = ?;`,[request.body.username]);

      if(credentialsCheck.length != 1){
         result.json({
            status:'fail',
            message:"Invalid Credentials <i class='fa-solid fa-database'></i>"
          });
      return;
      } else{
      //Compare hashed passwords
      if(passwordHash === credentialsCheck[0].PasswordHash){
         request.session.UserID = credentialsCheck[0].UserID;
         request.session.Username = credentialsCheck[0].Username;
         request.session.Email = credentialsCheck[0].Email;
         request.session.Verified = credentialsCheck[0].Verified;

         result.send({success:true});
      } else{
         result.json({
            status:'fail',
            message:"Invalid Credentials <i class='fa-solid fa-database'></i>"
          });
      }
      }
   } catch (error){
      result.json({
         status:'fail',
         message:`Could not successfully process request <i class='fa-solid fa-database'></i>`});
   }
});

