
const asyncHandler = require("express-async-handler");
const path = require("path");
const query = require("../database/query.js");

async function renderOrRedirect (request, result, file) {
   // Share function for various get requests to send signed out in users to landing page or direct to requested page
   const userID = request.cookies["userID"];

   if (userID === undefined) {
      result.redirect("../");
      return;
   } else {
      // In case that ID no longer cached, retrieve from database
      if (!request.session.user_id) {
         const userData = await query.runQuery("SELECT * FROM users WHERE user_id = ?", [userID]);

         if (userData.length === 0) {
            delete request.session.user_id;
            result.clearCookie("userID");
            result.redirect("../");
            return;
         }

         request.session.user_id = userData[0].user_id;
         request.session.username = userData[0].username;
         request.session.email = userData[0].email;
         request.session.verified = userData[0].verified;
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
   const userID = request.cookies["userID"];

   if (userID === undefined) {
      return result.redirect("../");
   } else {
      result.send({
         username:request.session.username,
         email:request.session.email,
         verified:request.session.verified
      });
   }
});

exports.logout = asyncHandler(async (request, result, next) => {
   result.clearCookie("userID");

   request.session.destroy((error) => {
      if (error) {
         result.status(500);
         result.json({ error:true });
      }
   });
   return result.redirect("/");
});