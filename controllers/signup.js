const asyncHandler = require("express-async-handler");
const validation = require("../database/validation.js");
const query = require("../database/query.js");
const sharedReturn = require("./message.js");

exports.signup = asyncHandler(async (request, result, next) => {
   let trimmedInputs = validation.trimInputs(result, request.body);

   // First validate all form input on backend for safety of structured information on current database
   let usernameValidation = validation.validateUsername(result, trimmedInputs.username);
   if (usernameValidation.status !== "pass") return;

   let passwordValidation = validation.validatePasswords(result, trimmedInputs.password, trimmedInputs.additionalPassword);
   if (passwordValidation.status !== "pass") return;

   let emailValidation = validation.validateEmail(result, trimmedInputs.email);
   if (emailValidation.status !== "pass") return;

   try{
      let passwordHash = query.hash(trimmedInputs.password);
      let usernameCheck = await query.runQuery("SELECT * FROM Users WHERE Username = ?;", [trimmedInputs.username]);

      // Following tests are for conflicts in current database ==> 409 Status Code
      if(usernameCheck.length >= 1){
         result.status(409);
         sharedReturn.sendError(result, "username", "Username already taken! <i class='fa-solid fa-database'></i>");
         return;
      }

      let emailCheck =  await query.runQuery("SELECT * FROM Users WHERE Email = ?;", [trimmedInputs.email]);

      if(emailCheck.length >= 1){
         result.status(409);
         sharedReturn.sendError(result, "email", "Email already taken! <i class='fa-solid fa-database'></i>");
         return;
      }

      let randomID = await query.retrieveRandomID("SELECT * FROM Users WHERE UserID = ?;");

      const verified = false;
      const insertQuery = "INSERT INTO Users (UserID,Username,Password,Email,Verified) VALUES (?,?,?,?,?);";

      // Must add to users account, then add instances for the budget
      await query.runQuery(insertQuery, [randomID, trimmedInputs.username, passwordHash, trimmedInputs.email, verified]);

      let currentMonth = query.getCurrentMonth();

      // Create a income and expenses budget for user
      await query.runQuery("INSERT INTO Budgets (UserID,IncomeCurrent,IncomeTotal,ExpensesCurrent,ExpensesTotal,Month) VALUES (?,?,?,?,?,?);", [randomID, 0.00, 1600.00, 0.00, 500.00, currentMonth]);

      // Store UserID in current express session to have a reference for loading user specific data on front end
      // Store Username and Email to display in user settings to not always run a Query to database
      request.session.UserID = randomID;
      request.session.Username = trimmedInputs.username;
      request.session.Email = trimmedInputs.email;
      request.session.Verified = verified;

      const sessionID = randomID;
      result.cookie("sessionID", sessionID, { httpOnly: true });

      await request.session.save();

      result.status(200);
      sharedReturn.sendSuccess(result, "Welcome <i class=\"fa-solid fa-door-open\"></i>");
   } catch (error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});