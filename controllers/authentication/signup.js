const asyncHandler = require("express-async-handler");
const validation = require("@/database/validation.js");
const query = require("@/database/query.js");
const sharedReturn = require("@/controllers/message.js");

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

      if (validationResult.status === "Failure") return;
   }

   try {
      const hashedPassword = query.hash(password);
      const conflictQuery = "SELECT * FROM users WHERE username = ? OR email = ?;";
      const conflict = await query.runQuery(conflictQuery, [username, email]);

      if (conflict.length >= 1) {
         // Check which input field caused the conflict
         const field = conflict[0].username === username ? "username" : "email";

         const message = field === "username"
            ? "Username already taken! <i class='fa-solid fa-database'></i>"
            : "Email already taken! <i class='fa-solid fa-database'></i>";

         sharedReturn.sendError(result, 409, field, message);
         return;
      }

      const insertQuery = "INSERT INTO users (username, password, email, verified) VALUES (?, ?, ?, ?);";
      const user = await query.runQuery(insertQuery, [username, hashedPassword, email, false]);

      const user_id = user.insertId;

      // After adding a user, a budget instance must be created
      const currentMonth = query.getCurrentMonth();
      await query.runQuery(
         "INSERT INTO budgets (income_total, expenses_total, income_current, expenses_current, month, user_id) VALUES (?, ?, ?, ?, ?, ?);",
         [1600.00, 500.00, 0.00, 0.00, currentMonth, user_id]
      );

      // Cache user data in session object for future requests
      request.session.user_id = user_id;
      request.session.username = username;
      request.session.email = email;
      request.session.verified = false;

      result.cookie("user_id", user_id, { httpOnly: true });
      request.session.save();

      sharedReturn.sendSuccess(result, "Welcome <i class=\"fa-solid fa-door-open\"></i>");
   } catch (error) {
      console.error(error);

      sharedReturn.sendError(result, 500, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});