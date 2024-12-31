const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const sharedReturn = require("./message.js");

exports.login = asyncHandler(async(request, result) => {
   try {
      const passwordHash = query.hash(request.body.password);
      const credentialsCheck = await query.runQuery("SELECT * FROM users WHERE username = ?;", [request.body.username]);

      if (credentialsCheck.length != 1 || passwordHash !== credentialsCheck[0].password) {
         // Compare hashed passwords to ensure this is a valid login
         sharedReturn.sendError(result, 401, "username", "Invalid Credentials <i class='fa-solid fa-database'></i>");
         return;
      } else {
         request.session.user_id = credentialsCheck[0].user_id;
         request.session.username = credentialsCheck[0].username;
         request.session.email = credentialsCheck[0].email;
         request.session.verified = credentialsCheck[0].verified;

         const userID = credentialsCheck[0].user_id;
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