const asyncHandler = require("express-async-handler");
const validation = require("../database/validation.js");
const query = require("../database/query.js");
const sharedReturn = require("./message.js");

exports.signup = asyncHandler(async (request, result, next) => {
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

      const randomID = await query.retrieveRandomID("SELECT * FROM users WHERE user_id = ?;");
      const verified = false;
      const insertQuery = "INSERT INTO users (user_id,username,password,email,verified) VALUES (?,?,?,?,?);";
      await query.runQuery(insertQuery, [randomID, trimmedInputs.username, passwordHash, trimmedInputs.email, verified]);

      // After adding a user, a budget instance must be created
      const currentMonth = query.getCurrentMonth();
      await query.runQuery("INSERT INTO budgets (user_id,income_current,income_total,expenses_current,expenses_total,month) VALUES (?,?,?,?,?,?);", [randomID, 0.00, 1600.00, 0.00, 500.00, currentMonth]);

      // Cache user data in session for further requests
      request.session.user_id = randomID;
      request.session.username = trimmedInputs.username;
      request.session.email = trimmedInputs.email;
      request.session.verified = verified;

      const userID = randomID;
      result.cookie("userID", userID, { httpOnly: true });

      await request.session.save();
      sharedReturn.sendSuccess(result, "Welcome <i class=\"fa-solid fa-door-open\"></i>");
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});