const Decimal = require("decimal.js");
const responseHandler = require("@/controllers/response/message.js");

const emailRegex = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const passwordRegex = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");

exports.validateUsername = function(username) {
   // Check if username is undefined or null, and safely convert to a string
   const value = username != null ? String(username) : "";

   // Validate username length
   if (value.length <= 3) {
      return {
         status: "Error",
         id: "username",
         message: "Username must be at least 3 characters"
      };
   } else if (value.length > 30) {
      return {
         status: "Error",
         id: "username",
         message: "Username must be less than 30 characters"
      };
   } else {
      return {
         status: "Success"
      };
   }
};


exports.validateEmail = function(email) {
   const value = String(email);

   if (value === undefined || emailRegex.test(value) == 0) {
      return {
         status: "Error",
         id: "email",
         message: "Invalid email"
      }
   } else {
      return {
         status: "Success"
      };
   }
};

exports.validatePasswords = function(password, secondPassword) {
   const value = String(password);

   if (value === undefined || passwordRegex.test(password) == 0) {
      // Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      return {
         status: "Error",
         id: "password",
         message: "Password must contain at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 8 characters"
      };
   } else if (password != secondPassword) {
      // Passwords must match in case users enters in undesired input for security
      return {
         status: "Error",
         id: "confirmPassword",
         message: "Passwords do not match"
      }
   } else {
      return {
         status: "Success"
      }
   }
};

exports.normalizeInputs = function(inputs = {}, decimalID = "amount", dateID = "date") {
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
            responseHandler.sendError(400, decimalID, error.message);
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
            responseHandler.sendError(400, dateID, error.message);
            return { status: "Error" };
         }

      } else if (typeof inputs[key] == "string") {
         normalizedInputs[key] = inputs[key].trim();
      }
   };

   return normalizedInputs;
};

exports.validateBudgetForm = function(name, nameID, type, typeID, editingMainCategory = false) {
   if (name.length == 0 || name.length > 30) {
      responseHandler.sendError(400, nameID, "Category names must be between 1 and 30 characters");
      return { status: "Error" };
   } else if (!editingMainCategory && (name == "Income" || name == "Expenses")) {
      responseHandler.sendError(400, typeID, "Category cannot be 'Income' or 'Expenses'");
      return { status: "Error" };
   } else if (type != "Income" && type != "Expenses") {
      // Rare case that user edits frontend form to return a type not supported by database
      responseHandler.sendError(400, typeID, "Category type must be Income or Expenses");
      return { status: "Error" };
   }

   // Amount is validated via normalizeInputs function
   return { status: "Success" };
};

exports.validateAccountForm = function(name, nameID, type, typeID) {
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
      responseHandler.sendError(400, nameID, "Account names must be between 1 and 30 characters");
      return { status: "Error" };
   } else if (!options[type]) {
      responseHandler.sendError(400, typeID, "Invalid account type");
      return { status: "Error" };
   }

   return { status: "Success" };
};

exports.validateTransactionForm = function(request, account, accountID, title, titleID, category, categoryID) {
   // Test that ID's exist within request
   // Amount and date is validated in the trim inputs function
   if (title.length == 0 || title.length > 50) {
      responseHandler.sendError(400, titleID, "Transaction title's must be between 1 and 50 characters");
      return { status: "Error" };
   } else if (account != null && !request.session.accounts[account]) {
      // Always test for a valid request using current cache for altering of form on frontend
      responseHandler.sendError(400, accountID, "Invalid account");
      return { status: "Error" };
   } else if ((category != "Income" && category != "Expenses") && !request.session.budget.categories[category]) {
      responseHandler.sendError(400, categoryID, "Invalid category");
      return { status: "Error" };
   }

   return { status: "Success" };
};