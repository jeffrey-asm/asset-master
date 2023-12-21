var express = require('express');
var router = express.Router();

const homeController = require("../controllers/usersController.js");

/* GET users listing. */
router.get('/', homeController.redirect);

// Handle home page routing
router.get('/home', homeController.home);

// Handle budget page routing
router.get('/budget', homeController.budget);

// Handle accounts page routing
router.get('/accounts', homeController.accounts);

// Handle settings page routing
router.get('/settings', homeController.settings);

// Get user information essential for settings page
router.get('/getUserInfo', homeController.userInformation);

// Logout method using express-session
router.get('/logout', homeController.logout);

module.exports = router;
