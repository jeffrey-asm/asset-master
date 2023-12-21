
const asyncHandler = require("express-async-handler");
const path = require('path');

//TODO remove in deployement
function developmentTest(request){
  request.session.UserID = 'qwdrgnq1703164219997';
  request.session.Username = 'root';
  request.session.Email = 'JeffreyCorderoNY@gmail.com';
}

exports.landing = asyncHandler(async(request,result,next)=>{
   developmentTest(request);
   //Redirect all logged out users to landing page
   if(request.session.UserID !== undefined){
      result.redirect('/users/home');
    } else{
      result.sendFile(path.join(__dirname,'../components','landing.html'));
    }
});

exports.login = asyncHandler(async(request,result,next)=>{
  developmentTest(request);
   if(request.session.UserID !== undefined){
      result.redirect('/users/home');
    } else{
      result.sendFile(path.join(__dirname,'../components','login.html'));
    }
});

exports.signup = asyncHandler(async(request,result,next)=>{
  developmentTest(request);
   if(request.session.UserID !== undefined){
      result.redirect('/users/home');
    } else{
      result.sendFile(path.join(__dirname,'../components','signup.html'));
   }
});