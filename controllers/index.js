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

// Development purposes
function developmentTest(request){
  request.session.UserID = 't037f667eb42f12f7587fd8739f1d1';
  request.session.Username = 'root';
  request.session.Email = 'root@gmail.com';
  request.session.Verified = 'F';
}

exports.landing = asyncHandler(async(request,result,next)=>{
   developmentTest(request);
   await request.session.save();
   renderOrRedirect(request, result, 'landing.html');
});

exports.login = asyncHandler(async(request,result,next)=>{
  developmentTest(request);
  await request.session.save();
  renderOrRedirect(request, result, 'login.html');
});

exports.signup = asyncHandler(async(request,result,next)=>{
  developmentTest(request);
  await request.session.save();
  renderOrRedirect(request, result, 'signup.html');
});