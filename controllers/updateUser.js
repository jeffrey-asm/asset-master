const asyncHandler = require("express-async-handler");
const runQuery = require('../database/query.js');
const validation = require("../database/validation.js");

function sendError(result,component,text){
   result.json({
      status:'fail',
      componentID: `${component}`,
      message: `${text}`
   });
}

async function searchDuplicates(result,query,itemID,item,message){
   try{
      let duplicateCheck = await runQuery(query,[item]);
      if(duplicateCheck.length >= 1){
         sendError(result,itemID,message);
         return true;
      }

      return false;
   } catch(error){
      sendError(result,itemID,`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return true;
   }
}

async function updateDatabase(result,query='',items=[]){
   let updateQuery = await runQuery(query,items);
   result.send({
      changes:true
   });
}

exports.updateUser = asyncHandler(async(request,result,next)=>{
   //Validate form first
   let usernameAndEmailCheck = validation.editUserValidation(request.body.username, request.body.email);

   if(usernameAndEmailCheck.status != 'pass'){
      result.send(usernameAndEmailCheck);
      return;
   }

   let changedUsername = false;
   let changedEmail = false;

   //First check if if properly returns
   if(request.session.Username != request.body.username){
      //Attempt to see if new username is unique
      changedUsername = true;
      let duplicateCheck = await searchDuplicates(result,`SELECT * FROM Users WHERE Username = ?;`, 'username', request.body.username, `Username already taken <i class='fa-solid fa-database'></i>`);
      if(duplicateCheck){
         return;
      }
   }

   if(request.session.Email != request.body.email){
      changedEmail = true;
      let duplicateCheck = await searchDuplicates(result,`SELECT * FROM Users WHERE Email = ?;`, 'email', request.body.email, `Email already taken <i class='fa-solid fa-database'></i>`);
      if(duplicateCheck){
         return;
      }
   }

   //Attempt to update database
   try{
      if(changedUsername && !changedEmail){
         //Only update username column
         await updateDatabase(result,'UPDATE Users SET Username = ? WHERE UserID = ?;',[request.body.username,request.session.UserID]);
         request.session.Username = request.body.username;
      } else if(changedEmail && !changedUsername){
         //New email implies no longer verified if already applied ('F')
         await updateDatabase(result,'UPDATE Users SET Email=?, Verified=? WHERE UserID=?;',[request.body.email,'F',request.session.UserID]);
         request.session.Email = request.body.email;
         request.session.Verified = 'F';
      } else if(changedUsername && changedEmail){
         //Update all essential columns
         await updateDatabase(result,'UPDATE Users SET Username = ?, Email = ?, Verified = ? WHERE UserID = ?;',[request.body.username,request.body.email,'F',request.session.UserID]);
         request.session.Username = request.body.username;
         request.session.Email = request.body.email;
         request.session.Verified = 'F';
      } else{
         //In case user did not change any values, don't bother writing an update query
         result.send({
            changes:false
         });
      }
   } catch(error){
      sendError(result,'email',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return;
   } finally{
      //Ensure variables are properly saved
      await request.session.save();
      return;
   }
});

