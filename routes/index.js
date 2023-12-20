var express = require('express');
var router = express.Router();
var path = require('path');
const sql = require("mssql");
const config = require('../database/connection.js');
const hash = require('../database/hash.js');
const randomIdentification = require('../database/ID.js');

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
  let poolConnection;

  try{
    poolConnection = await sql.connect(config);

    let passwordHash = hash(request.body.password);

    let usernameCheck = await poolConnection.request()
      .input('Username',sql.VarChar,request.body.username)
      .query(`SELECT * FROM Users WHERE Username = @Username;`);

    if(usernameCheck.recordset.length >= 1){
      result.send({error:"Username already taken!"});
      return;
    }

    let emailCheck = await poolConnection.request()
      .input('Email',sql.VarChar,request.body.email)
      .query(`SELECT * FROM Users WHERE Email = @Email;`);

    if(emailCheck.recordset.length >= 1){
      result.send({error:"Email already taken!"});
      return;
    }

    let randomID = randomIdentification();

    let randomIDCheck = await poolConnection.request()
      .input('UserID',sql.VarChar,randomID)
      .query(`SELECT * FROM Users WHERE UserID = @UserID;`);

    while(randomIDCheck.recordset.length != 0){
      //Ensure all ID's are unique
      randomID = randomIdentification();
    }

    const query = `INSERT INTO Users (UserID,Username,PasswordHash, Email)
    VALUES (
       @UserID,
       @Username,
       @PasswordHash,
       @Email
    );`;

    let queryResult = await poolConnection.request()
      .input('UserID',sql.VarChar,randomID)
      .input('Username',sql.VarChar,request.body.username)
      .input('PasswordHash',sql.VarChar,passwordHash)
      .input('email',sql.VarChar,request.body.email)
      .query(query);

    result.json({ result: queryResult });
  } catch (error){
    result.json({error:'Could not successfully connect to database;'});
  } finally {
    //Always break pool connection from server, regardless if successful or error appears
    if (poolConnection) {
      await poolConnection.close();
    }
  }
});

//Handling Register POST Request
router.post('/login_user', async (request,result) => {
  let poolConnection;

  try{
    poolConnection = await sql.connect(config);

    let passwordHash = hash(request.body.password);

    let credentialsCheck = await poolConnection.request()
      .input('Username',sql.VarChar,request.body.username)
      .query(`SELECT Username,PasswordHash FROM Users WHERE Username = @Username;`);

    if(credentialsCheck.recordset.length != 1){
      result.send({error:'Invalid Credentials'});
      return;
    } else{
      //Compare hashed passwords
      if(passwordHash === credentialsCheck.recordset[0].PasswordHash){
        result.send({success:true});
      } else{
        result.send({error:'Invalid Credentials'});
      }
    }
  } catch (error){
    result.json({error:'Could not successfully connect to database;'});
  } finally {
    //Always break pool connection from server, regardless if successful or error appears
    if (poolConnection) {
      await poolConnection.close();
    }
  }
});

module.exports = router;
