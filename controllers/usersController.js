
const asyncHandler = require("express-async-handler");
const path = require('path');

//TODO make function to not have if-else in every controller!

//Handle main GET requests for user related pages
exports.redirect = asyncHandler(async(request,result,next)=>{
   result.redirect('/users/home');
});

exports.home = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID === undefined){
      result.redirect('/');
    } else{
      result.sendFile(path.join(__dirname,'../components','home.html'));
    }
});

exports.budget = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID === undefined){
      result.redirect('/');
    } else{
      result.sendFile(path.join(__dirname,'../components','budget.html'));
    }
});

exports.accounts = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID === undefined){
      result.redirect('/');
    } else{
      result.sendFile(path.join(__dirname,'../components','accounts.html'));
    }
});

exports.settings = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID === undefined){
      result.redirect('/');
    } else{
      result.sendFile(path.join(__dirname,'../components','settings.html'));
    }
});

exports.userInformation = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID === undefined){
      result.redirect('/');
    } else{
      result.send({
        Username:request.session.Username,
        Email:request.session.Email
      });
    }
});

exports.logout = asyncHandler(async(request,result,next)=>{
   request.session.destroy((error)=>{
      if(error){
         console.error(`Error destroying user session ${error}`);
       }
     });
     result.redirect('/');
});