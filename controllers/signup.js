const asyncHandler = require("express-async-handler");
const validation = require("../database/validation.js");
const query = require("../database/query.js");
const sharedReturn = require("./message.js");

exports.signup = asyncHandler(async(request, result) => {
   const trimmedInputs = validation.trimInputs(result, request.body);

   // First validate each form input
   const usernameValidation = validation.validateUsername(result, trimmedInputs.username);
   if (usernameValidation.status !== "pass") return;

   const passwordValidation = validation.validatePasswords(result, trimmedInputs.password, trimmedInputs.additionalPassword);
   if (passwordValidation.status !== "pass") return;

   const emailValidation = validation.validateEmail(result, trimmedInputs.email);
   if (emailValidation.status !== "pass") return;

   try {
      const passwordHash = query.hash(trimmedInputs.password);
      const usernameCheck = await query.runQuery("SELECT * FROM users WHERE username = ?;", [trimmedInputs.username]);

      // Following tests are for conflicts in current database
      if (usernameCheck.length >= 1) {
         sharedReturn.sendError(result, 409, "username", "Username already taken! <i class='fa-solid fa-database'></i>");
         return;
      }

      const emailCheck =  await query.runQuery("SELECT * FROM users WHERE email = ?;", [trimmedInputs.email]);

      if (emailCheck.length >= 1) {
         sharedReturn.sendError(result, 409, "email", "Email already taken! <i class='fa-solid fa-database'></i>");
         return;
      }

      const verified = false;
      const insertQuery = "INSERT INTO users (username, password, email, verified) VALUES (?, ?, ?, ?);";
      const user = await query.runQuery(insertQuery, [trimmedInputs.username, passwordHash, trimmedInputs.email, verified]);
      const user_id = user.insertId;

      // After adding a user, a budget instance must be created
      const currentMonth = query.getCurrentMonth();
      await query.runQuery(
         "INSERT INTO budgets (income_total, expenses_total, income_current, expenses_current, month, user_id) VALUES (?, ?, ?, ?, ?, ?);",
         [1600.00, 500.00, 0.00, 0.00, currentMonth, user_id]
      );
      // Cache user data in session for further requests
      request.session.user_id = user_id;
      request.session.username = trimmedInputs.username;
      request.session.email = trimmedInputs.email;
      request.session.verified = verified;

      const userID = user_id;
      result.cookie("userID", userID, { httpOnly: true });

      await request.session.save();
      sharedReturn.sendSuccess(result, "Welcome <i class=\"fa-solid fa-door-open\"></i>");
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});