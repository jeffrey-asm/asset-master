const asyncHandler = require("express-async-handler");
const path = require("path");

async function renderOrRedirect (request, result, file){
   // Share function for various get requests to send logged in users to users space or direct to requested page
   const sessionID = request.cookies["sessionID"];

   if(sessionID !== undefined){
      return result.redirect("/users/home");
   } else{
      return result.sendFile(path.join(__dirname, "../views", `${file}`));
   }
}

exports.landing = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "landing.html");
});

exports.login = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "login.html");
});

exports.signup = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "signup.html");
});