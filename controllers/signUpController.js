const asyncHandler = require("express-async-handler");
const validation = require('../database/validation.js');
const randomIdentification = require('../database/ID.js');
const runQuery = require('../database/query.js');
const hash = require('../database/hash.js');

exports.signup = asyncHandler(async(request,result,next)=>{
   if(request.session.UserID !== undefined){
      result.redirect('/users/home');
    } else{
      result.sendFile(path.join(__dirname,'../components','signup.html'));
   }

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

    //Store UserID in current express session to have a reference for loading user specific data on front end
    // Store Username and Email to display in user settings to not always run a Query to database
    request.session.UserID = randomID;
    request.session.Username = request.body.username;
    request.session.Email = request.body.email;

    result.json({ result: queryResult });
  } catch (error){
    result.json({error:`Could not successfully process request: ${error};`});
  }

});