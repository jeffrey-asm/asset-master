const asyncHandler = require("express-async-handler");
const validation = require("@/database/validation.js");
const query = require("@/database/query.js");
const responseHandler = require("@/controllers/message.js");

exports.signup = asyncHandler(async(request, result) => {
   const normalizedInputs = validation.normalizeInputs(result, request.body);
   const { username, password, email, additionalPassword } = normalizedInputs;

   // Define validation rules and their corresponding parameters for each user input
   const fields = [
      { method: validation.validateUsername, params: [username] },
      { method: validation.validatePasswords, params: [password, additionalPassword] },
      { method: validation.validateEmail, params: [email] }
   ];

   // Perform all field validations
   for (const { method, params } of fields) {
      const validationResult = method(result, ...params);

      if (validationResult.status === "Error") return;
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

      const insertQuery = "INSERT INTO users (username, password, email, verified) VALUES (?, ?, ?, ?);";
      const user = await query.runQuery(insertQuery, [username, hashedPassword, email, false]);

      const user_id = user.insertId;

      // Cache user data in session object for future requests
      request.session.user_id = user_id;
      request.session.username = username;
      request.session.email = email;
      request.session.verified = false;

      result.cookie("user_id", user_id, { httpOnly: true });
      request.session.save();

      responseHandler.sendSuccess(result, "Welcome");
   } catch (error) {
      console.error(error);

      responseHandler.sendError(result, 500, "email", "Could not successfully process request");
   }
});