const Decimal = require("decimal.js");
const sharedReturn = require("../controllers/message");

exports.validateUsername = function(result, username) {
   if (username.length == 0 || username.length > 30) {
      sharedReturn.sendError(result, 400, "username", "Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: "fail" };
   }

   return { status: "pass" };
};

exports.validateEmail = function(result, email) {
   const emailTest = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

   if (emailTest.test(email) == 0) {
      // Ensure valid email for security of account
      sharedReturn.sendError(result, 400, "email", "Invalid email address <i class='fa-regular fa-envelope'></i>");
      return { status: "fail" };
   }

   return { status: "pass" };
};

exports.validatePasswords = function(result, password, secondPassword) {
   const passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");
   if (passwordTest.test(password) == 0) {
      // Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      sharedReturn.sendError(result, 400, "password", "Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters <i class='fa-solid fa-key'></i>");
      return { status: "fail" };
   } else if (password != secondPassword) {
      // Passwords must match in case users enters in undesired input for security
      sharedReturn.sendError(result, 400, "additionalPassword", "Passwords do not match <i class='fa-solid fa-lock'></i>");
      return { status: "fail" };
   }
   return { status: "pass" };
};

exports.trimInputs = function(result, inputs = {}, decimalComponentID = "amount", dateComponentID = "date") {
   const keys = Object.keys(inputs);
   const trimmedInputs = {};

   for (const key of keys) {
      // Only trim inputs of type string
      if (key == "amount" || key == "balance") {
         // Amount inputs all have names of amount in request.body
         try {
            trimmedInputs[key] = new Decimal(parseFloat(inputs[key]).toFixed(2));

            if (isNaN(trimmedInputs[key])) {
               throw new Error("Amount must be greater than $0.00, but less than $99,999,999,999.99 <i class='fa-brands fa-stack-overflow;'></i>");
            };

            const highLimit = new Decimal("99999999999.99");
            const lowLimit = new Decimal("0.00");

            if (trimmedInputs[key].gt(highLimit) ||  trimmedInputs[key].lessThanOrEqualTo(lowLimit)) {
               throw new Error("Amount must be greater than $0.00, but less than $99,999,999,999.99 <i class='fa-brands fa-stack-overflow;'></i>");
            }
         } catch (error) {
            sharedReturn.sendError(result, 400, decimalComponentID, error.message);
            return { status: "fail" };
         }
      } else if (key == "date") {
         try {
            trimmedInputs[key] = inputs[key].trim();
            const parts = inputs[key].split("-");

            if (parts.length !== 3) {
               throw new Error("Invalid date <i class='fa-solid fa-calendar-days'></i>");
            }

            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);

            const inputDate = new Date(year, month, day);

            if (isNaN(inputDate)) {
               throw new Error("Invalid date <i class='fa-solid fa-calendar-days'></i>");
            } else {
               const currentDate = new Date();
               currentDate.setHours(0, 0, 0, 0);

               if (inputDate > currentDate) {
                  throw new Error("Date cannot be in the future <i class='fa-solid fa-calendar-days'></i>");
               }
            }
         } catch (error) {
            sharedReturn.sendError(result, 400, dateComponentID, error.message);
            return { status: "fail" };
         }

      } else if (typeof inputs[key] == "string") {
         trimmedInputs[key] = inputs[key].trim();
      }
   };

   return trimmedInputs;
};

exports.validateBudgetForm = function(result, name, nameComponentID, type, typeComponentID, editingMainCategory = false) {
   if (name.length == 0 || name.length > 30) {
      sharedReturn.sendError(result, 400, nameComponentID, "Category names must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: "fail" };
   } else if (!editingMainCategory && (name == "Income" || name == "Expenses")) {
      sharedReturn.sendError(result, 400, typeComponentID, "Category cannot be 'Income' or 'Expenses' <i class='fa-solid fa-signature'></i>");
      return { status: "fail" };
   } else if (type != "Income" && type != "Expenses") {
      // Rare case that user edits frontend form to return a type not supported by database
      sharedReturn.sendError(result, 400, typeComponentID, "Category type must be Income or Expenses<i class='fa-solid fa-coins'></i>");
      return { status: "fail" };
   }

   // Amount is validated via trimInputs function
   return { status: "pass" };
};

exports.validateAccountForm = function(result, name, nameComponentID, type, typeComponentID) {
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
      sharedReturn.sendError(result, 400, nameComponentID, "Account names must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
      return { status: "fail" };
   } else if (!options[type]) {
      sharedReturn.sendError(result, 400, typeComponentID, "Invalid account type <i class='fa-solid fa-building-columns'></i>");
      return { status: "fail" };
   }

   return { status: "pass" };
};

exports.validateTransactionForm = function(request, result, account, accountComponentID, title, titleComponentID, category, categoryComponentID) {
   // Test that ID's exist within request
   // Amount and date is validated in the trim inputs function
   if (title.length == 0 || title.length > 50) {
      sharedReturn.sendError(result, 400, titleComponentID, "Transaction title's must be between 1 and 50 characters <i class='fa-solid fa-signature'></i>");
      return { status: "fail" };
   } else if (account != null && !request.session.accounts[account]) {
      // Always test for a valid request using current cache for altering of form on frontend
      sharedReturn.sendError(result, 400, accountComponentID, "Invalid account <i class='fa-solid fa-building-columns'></i>");
      return { status: "fail" };
   } else if ((category != "Income" && category != "Expenses") && !request.session.budget.categories[category]) {
      sharedReturn.sendError(result, 400, categoryComponentID, "Invalid category <i class='fa-solid fa-building-columns'></i>");
      return { status: "fail" };
   }

   return { status: "pass" };
};