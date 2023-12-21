var express = require('express');
var router = express.Router();

const landingController = require("../controllers/landingController.js");
const logInController = require("../controllers/logInController.js");
const signUpController = require("../controllers/signUpController.js");

//Landing Page
router.get('/', landingController.landing);

//Login Page
router.get('/login', landingController.login);

//Signup Page
router.get('/signup', landingController.signup);

//Handling Register POST Request
router.post('/register_user', signUpController.signup);

//Handling Register POST Request
router.post('/login_user', logInController.login);

module.exports = router;
