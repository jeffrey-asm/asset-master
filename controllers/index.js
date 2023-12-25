const asyncHandler = require("express-async-handler");
const path = require('path');

function renderOrRedirect(request,result,file){
  //Share function for various get requests to send logged in users to users space or direct to requested page
  if(request.session.UserID !== undefined){
    result.redirect('/users/home');
  } else{
    result.sendFile(path.join(__dirname,'../views',`${file}`));
  }
}

// Remove for deployment
function developmentTest(request){
  request.session.UserID = 'qeaeomr1703376705615';
  request.session.Username = 'root';
  request.session.Email = 'jeffrey@gmail.com';
  request.session.Verified = 'F';
}

exports.landing = asyncHandler(async(request,result,next)=>{
   developmentTest(request);
   renderOrRedirect(request, result, 'landing.html')
});

exports.login = asyncHandler(async(request,result,next)=>{
  developmentTest(request);
  renderOrRedirect(request, result, 'login.html')
});

exports.signup = asyncHandler(async(request,result,next)=>{
  developmentTest(request);
  renderOrRedirect(request, result, 'signup.html')
});