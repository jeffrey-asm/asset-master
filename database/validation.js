const Decimal = require("decimal.js");
const responseHandler = require("@/controllers/message");

exports.validateUsername = function(result, username) {
   if (username.length == 0 || username.length > 30) {
      responseHandler.sendError(result, 400, "username", "Username must be between 1 and 30 characters");

      return { status: "Error" };
   }

   return { status: "Success" };
};

exports.validateEmail = function(result, email) {
   const emailTest = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

   if (emailTest.test(email) == 0) {
      // Ensure valid email for security of account
      responseHandler.sendError(result, 400, "email", "Invalid email address");
      return { status: "Error" };
   }

   return { status: "Success" };
};

exports.validatePasswords = function(result, password, secondPassword) {
   const passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");
   if (passwordTest.test(password) == 0) {
      // Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      responseHandler.sendError(result, 400, "password", "Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters");
      return { status: "Error" };
   } else if (password != secondPassword) {
      // Passwords must match in case users enters in undesired input for security
      responseHandler.sendError(result, 400, "additionalPassword", "Passwords do not match");
      return { status: "Error" };
   }
   return { status: "Success" };
};

exports.normalizeInputs = function(result, inputs = {}, decimalID = "amount", dateID = "date") {
   const keys = Object.keys(inputs);
   const normalizedInputs = {};

   for (const key of keys) {
      // Only trim inputs of type string
      if (key == "amount" || key == "balance") {
         // Amount inputs all have names of amount in request.body
         try {
            normalizedInputs[key] = new Decimal(parseFloat(inputs[key]).toFixed(2));

            if (isNaN(normalizedInputs[key])) {
               throw new Error("Amount must be greater than $0.00, but less than $99,999,999,999.99");
            };

            const highLimit = new Decimal("99999999999.99");
            const lowLimit = new Decimal("0.00");

            if (normalizedInputs[key].gt(highLimit) ||  normalizedInputs[key].lessThanOrEqualTo(lowLimit)) {
               throw new Error("Amount must be greater than $0.00, but less than $99,999,999,999.99");
            }
         } catch (error) {
            responseHandler.sendError(result, 400, decimalID, error.message);
            return { status: "Error" };
         }
      } else if (key == "date") {
         try {
            normalizedInputs[key] = inputs[key].trim();
            const parts = inputs[key].split("-");

            if (parts.length !== 3) {
               throw new Error("Invalid date");
            }

            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);

            const inputDate = new Date(year, month, day);

            if (isNaN(inputDate)) {
               throw new Error("Invalid date");
            } else {
               const currentDate = new Date();
               currentDate.setHours(0, 0, 0, 0);

               if (inputDate > currentDate) {
                  throw new Error("Date cannot be in the future");
               }
            }
         } catch (error) {
            responseHandler.sendError(result, 400, dateID, error.message);
            return { status: "Error" };
         }

      } else if (typeof inputs[key] == "string") {
         normalizedInputs[key] = inputs[key].trim();
      }
   };

   return normalizedInputs;
};

exports.validateBudgetForm = function(result, name, nameID, type, typeID, editingMainCategory = false) {
   if (name.length == 0 || name.length > 30) {
      responseHandler.sendError(result, 400, nameID, "Category names must be between 1 and 30 characters");
      return { status: "Error" };
   } else if (!editingMainCategory && (name == "Income" || name == "Expenses")) {
      responseHandler.sendError(result, 400, typeID, "Category cannot be 'Income' or 'Expenses'");
      return { status: "Error" };
   } else if (type != "Income" && type != "Expenses") {
      // Rare case that user edits frontend form to return a type not supported by database
      responseHandler.sendError(result, 400, typeID, "Category type must be Income or Expenses");
      return { status: "Error" };
   }

   // Amount is validated via normalizeInputs function
   return { status: "Success" };
};

exports.validateAccountForm = function(result, name, nameID, type, typeID) {
   const options = {
      "Checking": 1,
      "Savings": 1,
      "Credit Card": 1,
      "Retirement": 1,
      "Investment": 1,
      "Loan": 1,
      "Property": 1,
      "Other": 1
   };

   if (name.length == 0 || name.length > 30) {
      responseHandler.sendError(result, 400, nameID, "Account names must be between 1 and 30 characters");
      return { status: "Error" };
   } else if (!options[type]) {
      responseHandler.sendError(result, 400, typeID, "Invalid account type");
      return { status: "Error" };
   }

   return { status: "Success" };
};

exports.validateTransactionForm = function(request, result, account, accountID, title, titleID, category, categoryID) {
   // Test that ID's exist within request
   // Amount and date is validated in the trim inputs function
   if (title.length == 0 || title.length > 50) {
      responseHandler.sendError(result, 400, titleID, "Transaction title's must be between 1 and 50 characters");
      return { status: "Error" };
   } else if (account != null && !request.session.accounts[account]) {
      // Always test for a valid request using current cache for altering of form on frontend
      responseHandler.sendError(result, 400, accountID, "Invalid account");
      return { status: "Error" };
   } else if ((category != "Income" && category != "Expenses") && !request.session.budget.categories[category]) {
      responseHandler.sendError(result, 400, categoryID, "Invalid category");
      return { status: "Error" };
   }

   return { status: "Success" };
};