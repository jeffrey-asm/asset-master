var express = require('express');
var router = express.Router();

const usersController = require("../controllers/users.js");
const updateController = require("../controllers/update.js");
const budgetController = require("../controllers/budget.js");
const accountsController = require("../controllers/accounts.js");

/* GET users listing. */
router.get('/', usersController.redirect);

// Handle home page routing
router.get('/home', usersController.home);

// Handle budget page routing
router.get('/budget', usersController.budget);

router.get('/getUserBudget',budgetController.getUserBudget);

router.post('/addCategory',budgetController.addCategory);

router.post('/updateCategory',budgetController.updateCategory);

router.post('/resetBudget',budgetController.resetBudget);

// Handle accounts page routing
router.get('/accounts', usersController.accounts);

router.get('/getUserAccounts', accountsController.getUserAccounts);

router.post('/addAccount', accountsController.addAccount);

router.post('/editAccount', accountsController.editAccount);

router.post('/addTransaction', accountsController.addTransaction);

router.post('/editTransaction', accountsController.editTransaction);

// Handle settings page routing
router.get('/settings', usersController.settings);

// Get user information essential for settings page
router.get('/getUserInfo', usersController.userInformation);

// Update user information essential for settings page
router.post('/updateUser', updateController.updateUser);

//Update user password
router.post('/updatePassword',updateController.updatePassword);

// Logout method using express-session
router.get('/logout', usersController.logout);

module.exports = router;
