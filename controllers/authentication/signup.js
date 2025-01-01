const asyncHandler = require("express-async-handler");
const validation = require("@/database/validation.js");
const query = require("@/database/query.js");
const userModal = require("@/modal/users.js");
const responseHandler = require("@/controllers/response/message.js");

exports.signup = asyncHandler(async(request, result) => {
   const normalizedInputs = validation.normalizeInputs(request.body);
   const { username, password, email, confirmPassword } = normalizedInputs;

   // Define validation rules and their corresponding parameters for each user input
   const fields = [
      { method: validation.validateUsername, params: [username] },
      { method: validation.validatePasswords, params: [password, confirmPassword] },
      { method: validation.validateEmail, params: [email] }
   ];

   // Perform all field validations
   for (const { method, params } of fields) {
      const validationResult = method(...params);
      console.log(params, validationResult);

      if (validationResult.status !== "Success") {
         responseHandler.sendError(result, 400, validationResult.id, validationResult.message);
         return;
      };
   }

   try {
      const hashedPassword = query.hash(password);
      const conflictQuery = "SELECT * FROM users WHERE username = ? OR email = ?;";
      const conflict = await query.runQuery(conflictQuery, [username, email]);

      if (conflict.length >= 1) {
         // Check which input field caused the conflict
         const field = conflict[0].username === username ? "username" : "email";

         const message = field === "username"
            ? "Username already taken!"
            : "Email already taken!";

         responseHandler.sendError(result, 409, field, message);
         return;
      }

      const user = await userModal.createUser({ username, email, hashedPassword });

      const user_id = user.insertId;

      // Cache user data in session object for future requests
      request.session.user_id = user_id;
      request.session.username = username;
      request.session.email = email;
      request.session.verified = false;

      result.cookie("user_id", user_id, { httpOnly: true });
      request.session.save();

      responseHandler.sendSuccess(result, "Welcome");
      return;
   } catch (error) {
      console.error(error);

      responseHandler.sendError(result, 500, "email", "Could not successfully process request");
      return;
   }
});