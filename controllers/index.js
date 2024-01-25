const asyncHandler = require("express-async-handler");
const path = require('path');

function renderOrRedirect(request,result,file){
  //Share function for various get requests to send logged in users to users space or direct to requested page
  if(request.session.UserID !== undefined){
    result.redirect('/users/home');
  } else{
    result.status(200);
    result.sendFile(path.join(__dirname,'../views',`${file}`));
  }
}

exports.landing = asyncHandler(async(request,result,next)=>{
   await request.session.save();
   renderOrRedirect(request, result, 'landing.html');
});

exports.login = asyncHandler(async(request,result,next)=>{
  await request.session.save();
  renderOrRedirect(request, result, 'login.html');
});

exports.signup = asyncHandler(async(request,result,next)=>{
  await request.session.save();
  renderOrRedirect(request, result, 'signup.html');
});