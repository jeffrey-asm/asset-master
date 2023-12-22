const asyncHandler = require("express-async-handler");
const runQuery = require('../database/query.js');
const hash = require('../database/hash.js');

exports.updateUser = asyncHandler(async(request,result,next)=>{
   //First check if if properly returns
   if(request.session.Username != request.body.username){
      //Attempt to see if new username is unique
      try{
         let usernameCheck = await runQuery(`SELECT * FROM Users WHERE UserID=?`,[request.body.username]);

         if(usernameCheck.length >= 1){
            throw error;
         }
      } catch(error){
         result.json({
            error: "Username already taken"
         });
         return;
      }
   }

   let newEmail = false;


});

