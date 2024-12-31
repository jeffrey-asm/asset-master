const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const sharedReturn = require("./message.js");

exports.updateUser = asyncHandler(async(request, result) => {
   const trimmedInputs = validation.trimInputs(result, request.body);

   // Validate form first
   const usernameValidation = validation.validateUsername(result, trimmedInputs.username);
   if (usernameValidation.status !== "pass")  return;

   const emailValidation = validation.validateEmail(result, trimmedInputs.email);
   if (emailValidation.status !== "pass") return;

   let changedUsername = false;
   let changedEmail = false;

   // First check if if properly returns
   if (request.session.username != trimmedInputs.username) {
      // Attempt to see if new username is unique
      changedUsername = true;
      const duplicateCheck = await query.searchDuplicates(result, "SELECT * FROM users WHERE username = ?;", [trimmedInputs.username], "username", "Username already taken <i class='fa-solid fa-database'></i>");
      if (duplicateCheck) return;
   }

   if (request.session.email != trimmedInputs.email) {
      changedEmail = true;
      const duplicateCheck = await query.searchDuplicates(result, "SELECT * FROM users WHERE email = ?;", [trimmedInputs.email], "email", "Email already taken <i class='fa-solid fa-database'></i>");

      if (duplicateCheck) return;
   }

   // Attempt to update database
   try {
      if (changedUsername && !changedEmail) {
         // Only update username column
         await query.updateDatabase(result, "UPDATE users SET username = ? WHERE user_id = ?;", [trimmedInputs.username, request.session.user_id]);
         request.session.username = trimmedInputs.username;
         await request.session.save();
      } else if (changedEmail && !changedUsername) {
         // New email implies no longer verified if already applied
         await query.updateDatabase(result, "UPDATE users SET email=?, verified=? WHERE user_id=?;", [trimmedInputs.email, false, request.session.user_id]);
         request.session.email = trimmedInputs.email;
         request.session.verified = false;
         await request.session.save();
      } else if (changedUsername && changedEmail) {
         // Update all essential columns
         await query.updateDatabase(result, "UPDATE users SET username = ?, email = ?, verified = ? WHERE user_id = ?;",
            [trimmedInputs.username, trimmedInputs.email, false, request.session.user_id]);

         request.session.username = trimmedInputs.username;
         request.session.email = trimmedInputs.email;
         request.session.verified = false;
         await request.session.save();
      } else {
         // In case user did not change any values, don't bother writing an update query
         sharedReturn.sendSuccess(result, "No changes <i class=\"fa-solid fa-circle-info\"></i>");
         return;
      }
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

exports.updatePassword = asyncHandler(async(request, result) => {
   const trimmedInputs = validation.trimInputs(result, request.body);

   // Validate form first
   const newPasswordValidation = validation.validatePasswords(result, trimmedInputs.password, trimmedInputs.additionalPassword);

   if (newPasswordValidation.status != "pass") return;

   try {
      // Attempt to compare current password with input
      const oldPassword = query.hash(trimmedInputs.oldPassword);
      const newPassword = query.hash(trimmedInputs.password);

      const savedPassword = await query.runQuery("SELECT password FROM users WHERE user_id = ?", [request.session.user_id]);

      if (savedPassword.hasOwnProperty("error")) throw new Error("");

      if (savedPassword[0].password != oldPassword) {
         sharedReturn.sendError(result, 400, "oldPassword", "Incorrect password <i class='fa-solid fa-lock'></i>");
         return;
      } else if (savedPassword[0].password == newPassword) {
         sharedReturn.sendError(result, 400, "password", "New password must be not be the same as current password <i class='fa-solid fa-lock'></i>");
         return;
      }

      await query.runQuery("UPDATE users SET password = ? WHERE user_id = ?;", [newPassword, request.session.user_id]);
      sharedReturn.sendSuccess(result, "Password successfully changed <i class=\"fa-solid fa-lock\"></i>");
      return;
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "oldPassword", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});

exports.deleteAccount = asyncHandler(async(request, result) => {
   const trimmedInputs = validation.trimInputs(result, request.body);

   if (trimmedInputs.message !== `sudo deluser ${request.session.username}`) {
      sharedReturn.sendError(result, 400, "message", "Incorrect deletion message <i class=\"fa-regular fa-message\"></i>");
      return;
   }

   try {
      const removeUserQuery = "DELETE FROM users WHERE user_id = ?;";

      await query.runQuery(removeUserQuery, [request.session.user_id]);
      sharedReturn.sendSuccess(result, "Successfully removed account <i class=\"fa-solid fa-trash\"></i>");
      return;
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "message", "Could not successfully process request <i class='fa-solid fa-database'></i>");
      return;
   }
});