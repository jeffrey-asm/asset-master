var express = require('express');
var router = express.Router();
var path = require('path');
const hash = require('../database/hash.js');
const randomIdentification = require('../database/ID.js');
const runQuery = require('../database/query.js');
const validation = require('../database/validation.js');

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
router.post('/register_user', async (request,result) => {
  //First validate all form input on backend for safety of structured information on current database
  let formValidation = validation.signUpFormValidation(...Object.values(request.body));
  if(formValidation['status'] === 'fail'){
    result.send(formValidation);
    return;
  }

  try{
    let passwordHash = hash(request.body.password);

    let usernameCheck = await runQuery(`SELECT * FROM Users WHERE Username = ?;`,[request.body.username])

    if(usernameCheck.length >= 1){
      result.send({error:"Username already taken!"});
      return;
    }

    let emailCheck =  await runQuery(`SELECT * FROM Users WHERE Email = ?;`,[request.body.email])

    if(emailCheck.length >= 1){
      result.send({error:"Email already taken!"});
      return;
    }

    let randomID = randomIdentification();

    let randomIDCheck =  await runQuery(`SELECT * FROM Users WHERE UserID = ?;`,[randomID]);

    while(randomIDCheck.length != 0){
      //Ensure all ID's are unique
      randomID = randomIdentification();
    }

    const query = `INSERT INTO Users (UserID,Username,PasswordHash,Email) VALUES (?,?,?,?);`;

    let queryResult = await runQuery(query,[randomID,request.body.username,passwordHash,request.body.email]);

    result.json({ result: queryResult });
  } catch (error){
    result.json({error:`Could not successfully connect to database: ${error};`});
  }
});

//Handling Register POST Request
router.post('/login_user', async (request,result) => {
  //Validation?: no login in form validation given we match credentials using username and password hash
  try{
    let passwordHash = hash(request.body.password);

    let credentialsCheck = await runQuery(`SELECT Username,PasswordHash FROM Users WHERE Username = ?;`,[request.body.username]);

    if(credentialsCheck.length != 1){
      result.send({error:'Invalid Credentials'});
      return;
    } else{
      //Compare hashed passwords
      if(passwordHash === credentialsCheck[0].PasswordHash){
        result.send({success:true});
      } else{
        result.send({error:'Invalid Credentials'});
      }
    }
  } catch (error){
    result.json({error:'Could not successfully connect to database;'});
  }
});

module.exports = router;
