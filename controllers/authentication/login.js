const asyncHandler = require("express-async-handler");
const query = require("@/database/query.js");
const responseHandler = require("@/controllers/message.js");

exports.login = asyncHandler(async(request, result) => {
   try {
      const { username, password } = request.body;

      const hashedPassword = query.hash(password);
      const user = await query.runQuery("SELECT * FROM users WHERE username = ?;", [username]);

      if (user.length !== 1 || hashedPassword !== user[0].password) {
         // Invalid credentials
         responseHandler.sendError(result, 401, "username", "Invalid Credentials");
      } else {
         const { user_id, username, email, verified } = user[0];

         // Cache user data in session object for future requests
         request.session.user_id = user_id;
         request.session.username = username;
         request.session.email = email;
         request.session.verified = verified;

         result.cookie("user_id", user_id, { httpOnly: true });

         request.session.save();
         responseHandler.sendSuccess(result, "Welcome");
      }
   } catch (error) {
      console.error(error);

      responseHandler.sendError(result, 500, "username", "Could not successfully process request");
   }
});