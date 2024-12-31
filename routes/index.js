const express = require("express");
const router = express.Router();

const indexController = require("../controllers/index.js");
const logInController = require("../controllers/login.js");
const signUpController = require("../controllers/signup.js");

// Landing Page
router.get("/", indexController.landing);

// Login Page
router.get("/login", indexController.login);

// Signup Page
router.get("/signup", indexController.signup);

// Handling Register POST Request
router.post("/registerUser", signUpController.signup);

// Handling Register POST Request
router.post("/loginUser", logInController.login);

module.exports = router;