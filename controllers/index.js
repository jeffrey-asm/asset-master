
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

//TODO remove in deployement
function developmentTest(request){
  // request.session.UserID = 'kqdkjzyyk1703200713376';
  // request.session.Username = 'root';
  // request.session.Email = 'cordej2@rpi.edu';
  // request.session.Verified = 'F';
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