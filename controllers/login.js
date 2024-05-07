const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const sharedReturn = require("./message.js");

exports.login = asyncHandler(async (request, result, next) => {
   try {
      const passwordHash = query.hash(request.body.password);
      const credentialsCheck = await query.runQuery("SELECT * FROM Users WHERE Username = ?;", [request.body.username]);

      if (credentialsCheck.length != 1 || passwordHash !== credentialsCheck[0].Password) {
         // Compare hashed passwords to ensure this is a valid login
         sharedReturn.sendError(result, 401, "username", "Invalid Credentials <i class='fa-solid fa-database'></i>");
         return;
      } else {
         request.session.UserID = credentialsCheck[0].UserID;
         request.session.Username = credentialsCheck[0].Username;
         request.session.Email = credentialsCheck[0].Email;
         request.session.Verified = credentialsCheck[0].Verified;

         const userID = credentialsCheck[0].UserID;
         result.cookie("userID", userID, { httpOnly: true });

         await request.session.save();
         sharedReturn.sendSuccess(result, "Welcome <i class=\"fa-solid fa-lock-open\"></i>");
         return;
      }
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "username", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

