
const asyncHandler = require("express-async-handler");
const path = require('path');

function renderOrRedirect(request,result,file){
  //Share function for various get requests to send signed out in users to landing page or direct to requested page
  if(request.session.UserID === undefined){
    result.redirect('../');
  } else{
    result.status(200);
    result.sendFile(path.join(__dirname,'../views',`${file}`));
  }
}

exports.redirect = asyncHandler(async(request,result,next)=>{
   result.redirect('./home');
});

exports.home = asyncHandler(async(request,result,next)=>{
  renderOrRedirect(request,result,'home.html');
});

exports.budget = asyncHandler(async(request,result,next)=>{
  renderOrRedirect(request,result,'budget.html');
});

exports.accounts = asyncHandler(async(request,result,next)=>{
  renderOrRedirect(request,result,'accounts.html');
});

exports.settings = asyncHandler(async(request,result,next)=>{
  renderOrRedirect(request,result,'settings.html');
});

exports.userInformation = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID === undefined){
      result.redirect('../');
    } else{
      result.send({
        Username:request.session.Username,
        Email:request.session.Email,
        Verified:request.session.Verified
      });
    }
});

exports.logout = asyncHandler(async(request,result,next)=>{
   request.session.destroy((error)=>{
      if(error){
         result.status(500);
         result.json({error:true});
       }
     });
     result.redirect('../');
});