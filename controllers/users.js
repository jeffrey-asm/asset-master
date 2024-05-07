
const asyncHandler = require("express-async-handler");
const path = require("path");
const query = require("../database/query.js");

async function renderOrRedirect (request, result, file){
   // Share function for various get requests to send signed out in users to landing page or direct to requested page
   const sessionID = request.cookies["sessionID"];
   if(sessionID === undefined){
      return result.render("../");
   } else{
      // In case that ID no longer cached, retrieve from database
      if(!request.session.UserID){
         const userData = await query.runQuery("SELECT * FROM Users WHERE UserID = ?", [sessionID]);

         request.session.UserID = userData[0].UserID;
         request.session.Username = userData[0].Username;
         request.session.Email = userData[0].Email;
         request.session.Verified = userData[0].Verified;
         await request.session.save();
      }

      return result.sendFile(path.join(__dirname, "../views", `${file}`));
   }
}

exports.redirect = asyncHandler(async (request, result, next) => {
   result.redirect("./home");
});

exports.home = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "home.html");
});

exports.budget = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "budget.html");
});

exports.accounts = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "accounts.html");
});

exports.settings = asyncHandler(async (request, result, next) => {
   await renderOrRedirect(request, result, "settings.html");
});

exports.userInformation = asyncHandler(async (request, result, next) => {
   const sessionID = request.cookies["sessionID"];

   if(sessionID === undefined){
      return result.redirect("../");
   } else{
      result.send({
         Username:request.session.Username,
         Email:request.session.Email,
         Verified:request.session.Verified
      });
   }
});

exports.logout = asyncHandler(async (request, result, next) => {
   result.clearCookie("sessionID");

   request.session.destroy((error) => {
      if(error){
         result.status(500);
         result.json({ error:true });
      }
   });
   return result.redirect("../");
});