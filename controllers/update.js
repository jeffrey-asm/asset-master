const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const sharedReturn = require("./message.js");

exports.updateUser = asyncHandler(async (request, result, next) => {
   let trimmedInputs = validation.trimInputs(result, request.body);

   // Validate form first
   let usernameValidation = validation.validateUsername(result, trimmedInputs.username);
   if (usernameValidation.status !== "pass")  return;

   let emailValidation = validation.validateEmail(result, trimmedInputs.email);
   if (emailValidation.status !== "pass") return;

   let changedUsername = false;
   let changedEmail = false;

   // First check if if properly returns
   if(request.session.Username != trimmedInputs.username){
      // Attempt to see if new username is unique
      changedUsername = true;
      let duplicateCheck = await query.searchDuplicates(result, "SELECT * FROM Users WHERE Username = ?;", [trimmedInputs.username], "username", "Username already taken <i class='fa-solid fa-database'></i>");
      if(duplicateCheck) return;
   }

   if(request.session.Email != trimmedInputs.email){
      changedEmail = true;
      let duplicateCheck = await query.searchDuplicates(result, "SELECT * FROM Users WHERE Email = ?;", [trimmedInputs.email], "email", "Email already taken <i class='fa-solid fa-database'></i>");

      if(duplicateCheck) return;
   }

   // Attempt to update database
   try{
      if(changedUsername && !changedEmail){
         // Only update username column
         await query.updateDatabase(result, "UPDATE Users SET Username = ? WHERE UserID = ?;", [trimmedInputs.username, request.session.UserID]);
         request.session.Username = trimmedInputs.username;
         await request.session.save();
      } else if(changedEmail && !changedUsername){
         // New email implies no longer verified if already applied ('F')
         await query.updateDatabase(result, "UPDATE Users SET Email=?, Verified=? WHERE UserID=?;", [trimmedInputs.email, "F", request.session.UserID]);
         request.session.Email = trimmedInputs.email;
         request.session.Verified = false;
         await request.session.save();
      } else if(changedUsername && changedEmail){
         // Update all essential columns
         await query.updateDatabase(result, "UPDATE Users SET Username = ?, Email = ?, Verified = ? WHERE UserID = ?;",
            [trimmedInputs.username, trimmedInputs.email, "F", request.session.UserID]);

         request.session.Username = trimmedInputs.username;
         request.session.Email = trimmedInputs.email;
         request.session.Verified = false;
         await request.session.save();
      } else{
         // In case user did not change any values, don't bother writing an update query
         result.status(200);
         sharedReturn.sendSuccess(result, "No changes <i class=\"fa-solid fa-circle-info\"></i>");
         return;
      }
   } catch(error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

exports.updatePassword = asyncHandler(async (request, result, next) => {
   let trimmedInputs = validation.trimInputs(result, request.body);

   // Validate form first
   let newPasswordValidation = validation.validatePasswords(result, trimmedInputs.password, trimmedInputs.additionalPassword);

   if(newPasswordValidation.status != "pass") return;

   try{
      // Attempt to compare current password with input
      let oldPassword = query.hash(trimmedInputs.oldPassword);
      let newPassword = query.hash(trimmedInputs.password);

      let savedPassword = await query.runQuery("SELECT Password FROM Users WHERE UserID = ?", [request.session.UserID]);

      if(savedPassword.hasOwnProperty("error")) throw new Error("");

      if(savedPassword[0].Password != oldPassword){
         result.status(400);
         sharedReturn.sendError(result, "oldPassword", "Incorrect password <i class='fa-solid fa-lock'></i>");
         return;
      } else if(savedPassword[0].Password == newPassword){
         result.status(400);
         sharedReturn.sendError(result, "password", "New Password must be not be the same as current password <i class='fa-solid fa-lock'></i>");
         return;
      }

      await query.runQuery("UPDATE Users SET Password = ? WHERE UserID = ?;", [newPassword, request.session.UserID]);
      result.status(200);
      sharedReturn.sendSuccess(result, "Password successfully changed <i class=\"fa-solid fa-lock\"></i>");
      return;
   } catch (error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result, "oldPassword", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

exports.deleteAccount = asyncHandler(async (request, result, next) => {
   let trimmedInputs = validation.trimInputs(result, request.body);

   if(trimmedInputs.message !== `sudo deluser ${request.session.Username}`){
      result.status(400);
      sharedReturn.sendError(result, "message", "Incorrect deletion message <i class=\"fa-regular fa-message\"></i>");
      return;
   }

   try{
      const removeUserQuery = `
         DELETE Users, Accounts, Budgets, Transactions, Categories
         FROM Users
         LEFT JOIN Accounts ON Accounts.UserID = Users.UserID
         LEFT JOIN Budgets ON Budgets.UserID = Users.UserID
         LEFT JOIN Transactions ON Transactions.UserID = Users.UserID
         LEFT JOIN Categories ON Categories.UserID = Users.UserID
         WHERE Users.UserID = ?;
      `;

      await query.runQuery(removeUserQuery, [request.session.UserID]);
      result.status(200);
      sharedReturn.sendSuccess(result, "Successfully removed account <i class=\"fa-solid fa-trash\"></i>");
      return;
   } catch(error){
      console.log(error);
      result.status(500);
      sharedReturn.sendError(result, "message", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});