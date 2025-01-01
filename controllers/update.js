const asyncHandler = require("express-async-handler");
const query = require("../database/query.js");
const validation = require("../database/validation.js");
const responseHandler = require("./message.js");

exports.updateUser = asyncHandler(async(request, result) => {
   const normalizedInputs = validation.normalizeInputs(result, request.body);

   // Validate form first
   const usernameValidation = validation.validateUsername(result, normalizedInputs.username);
   if (usernameValidation.status !== "Success")  return;

   const emailValidation = validation.validateEmail(result, normalizedInputs.email);
   if (emailValidation.status !== "Success") return;

   let changedUsername = false;
   let changedEmail = false;

   // First check if if properly returns
   if (request.session.username != normalizedInputs.username) {
      // Attempt to see if new username is unique
      changedUsername = true;
      const duplicateCheck = await query.searchDuplicates(result, "SELECT * FROM users WHERE username = ?;", [normalizedInputs.username], "username", "Username already taken");
      if (duplicateCheck) return;
   }

   if (request.session.email != normalizedInputs.email) {
      changedEmail = true;
      const duplicateCheck = await query.searchDuplicates(result, "SELECT * FROM users WHERE email = ?;", [normalizedInputs.email], "email", "Email already taken");

      if (duplicateCheck) return;
   }

   // Attempt to update database
   try {
      if (changedUsername && !changedEmail) {
         // Only update username column
         await query.updateDatabase(result, "UPDATE users SET username = ? WHERE user_id = ?;", [normalizedInputs.username, request.session.user_id]);
         request.session.username = normalizedInputs.username;
         await request.session.save();
      } else if (changedEmail && !changedUsername) {
         // New email implies no longer verified if already applied
         await query.updateDatabase(result, "UPDATE users SET email=?, verified=? WHERE user_id=?;", [normalizedInputs.email, false, request.session.user_id]);
         request.session.email = normalizedInputs.email;
         request.session.verified = false;
         await request.session.save();
      } else if (changedUsername && changedEmail) {
         // Update all essential columns
         await query.updateDatabase(result, "UPDATE users SET username = ?, email = ?, verified = ? WHERE user_id = ?;",
            [normalizedInputs.username, normalizedInputs.email, false, request.session.user_id]);

         request.session.username = normalizedInputs.username;
         request.session.email = normalizedInputs.email;
         request.session.verified = false;
         await request.session.save();
      } else {
         // In case user did not change any values, don't bother writing an update query
         responseHandler.sendSuccess(result, "No changes");
         return;
      }
   } catch (error) {
      console.error(error);
      responseHandler.sendError(result, 500, "email", "Could not successfully process request");
      return;
   }
});

exports.updatePassword = asyncHandler(async(request, result) => {
   const normalizedInputs = validation.normalizeInputs(result, request.body);

   // Validate form first
   const newPasswordValidation = validation.validatePasswords(result, normalizedInputs.password, normalizedInputs.additionalPassword);

   if (newPasswordValidation.status != "Success") return;

   try {
      // Attempt to compare current password with input
      const oldPassword = query.hash(normalizedInputs.oldPassword);
      const newPassword = query.hash(normalizedInputs.password);

      const savedPassword = await query.runQuery("SELECT password FROM users WHERE user_id = ?", [request.session.user_id]);

      if (savedPassword.hasOwnProperty("error")) throw new Error("");

      if (savedPassword[0].password != oldPassword) {
         responseHandler.sendError(result, 400, "oldPassword", "Incorrect password");
         return;
      } else if (savedPassword[0].password == newPassword) {
         responseHandler.sendError(result, 400, "password", "New password must be not be the same as current password");
         return;
      }

      await query.runQuery("UPDATE users SET password = ? WHERE user_id = ?;", [newPassword, request.session.user_id]);
      responseHandler.sendSuccess(result, "Password successfully changed");
      return;
   } catch (error) {
      console.error(error);
      responseHandler.sendError(result, 500, "oldPassword", "Could not successfully process request");
      return;
   }
});

exports.deleteAccount = asyncHandler(async(request, result) => {
   const normalizedInputs = validation.normalizeInputs(result, request.body);

   if (normalizedInputs.message !== `sudo deluser ${request.session.username}`) {
      responseHandler.sendError(result, 400, "message", "Incorrect deletion message");
      return;
   }

   try {
      const removeUserQuery = "DELETE FROM users WHERE user_id = ?;";

      await query.runQuery(removeUserQuery, [request.session.user_id]);
      responseHandler.sendSuccess(result, "Successfully removed account");
      return;
   } catch (error) {
      console.error(error);
      responseHandler.sendError(result, 500, "message", "Could not successfully process request");
      return;
   }
});