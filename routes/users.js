var express = require('express');
var router = express.Router();
const path = require('path');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.redirect('/users/home');
});

router.get('/home', function(req, res, next) {
  // const path = path.join(__dirname,'../components','home.html');
  res.sendFile(path.join(__dirname,'../components','home.html'));
});


module.exports = router;
