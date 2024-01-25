let express = require('express');
let router = express.Router();

const usersController = require("../controllers/users.js");
const homeController = require("../controllers/home.js");
const updateController = require("../controllers/update.js");
const budgetController = require("../controllers/budget.js");
const accountsController = require("../controllers/accounts.js");
const transactionsController = require("../controllers/transactions.js");

/* GET users listing. */
router.get('/', usersController.redirect);

// Handle home page routing
router.get('/home', usersController.home);

router.get('/fetchHomeData', homeController.fetchHomeData);

// Handle budget page routing
router.get('/budget', usersController.budget);

router.get('/getUserBudget',budgetController.getUserBudget);

router.post('/addCategory',budgetController.addCategory);

router.post('/updateCategory',budgetController.updateCategory);

// Handle accounts page routing
router.get('/accounts', usersController.accounts);

router.get('/getUserAccounts', accountsController.getUserAccounts);

router.post('/addAccount', accountsController.addAccount);

router.post('/editAccount', accountsController.editAccount);

router.post('/addTransaction', transactionsController.addTransaction);

router.post('/editTransaction', transactionsController.editTransaction);

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

// Delete account method
router.post('/deleteAccount', updateController.deleteAccount);

module.exports = router;
