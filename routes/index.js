var express = require('express');
var router = express.Router();
var path = require('path');

//Landing Page
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname,'../components','landing.html'));
});

//Login Page
router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname,'../components','login.html'));
});

//Signup Page
router.get('/signup', function(req, res, next) {
  res.sendFile(path.join(__dirname,'../components','signup.html'));
});

//Handling Register POST Request
router.post('/registerUser', function(request,result) {
  console.log(request.body);
  result.send({'success':true});
});

module.exports = router;
