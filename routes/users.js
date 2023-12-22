var express = require('express');
var router = express.Router();

const usersController = require("../controllers/users.js");
const updateUserController = require("../controllers/updateUser.js");

/* GET users listing. */
router.get('/', usersController.redirect);

// Handle home page routing
router.get('/home', usersController.home);

// Handle budget page routing
router.get('/budget', usersController.budget);

// Handle accounts page routing
router.get('/accounts', usersController.accounts);

// Handle settings page routing
router.get('/profile', usersController.profile);

// Get user information essential for settings page
router.get('/getUserInfo', usersController.userInformation);

// Update user information essential for settings page
router.post('/updateUser', updateUserController.updateUser);

// Logout method using express-session
router.get('/logout', usersController.logout);

module.exports = router;
