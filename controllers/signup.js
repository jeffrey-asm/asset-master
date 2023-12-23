const asyncHandler = require("express-async-handler");
const validation = require('../database/validation.js');
const randomIdentification = require('../database/ID.js');
const runQuery = require('../database/query.js');
const hash = require('../database/hash.js');
const sharedReturn = require('./message.js');

exports.signup = asyncHandler(async(request,result,next)=>{
  let trimmedInputs = validation.trimInputs(request.body);

   //First validate all form input on backend for safety of structured information on current database
   let usernameValidation = validation.validateUsername(trimmedInputs.username);
   if (usernameValidation.status !== 'pass') {
    result.json(usernameValidation);
    return;
   }

   let passwordValidation = validation.validatePasswords(trimmedInputs.password,trimmedInputs.additionalPassword);
   if (passwordValidation.status !== 'pass'){
    result.json(passwordValidation);
    return;
   }

   let emailValidation = validation.validateEmail(trimmedInputs.email);
   if (emailValidation.status !== 'pass'){
    result.json(emailValidation);
    return;
   }

  try{
    let passwordHash = hash(trimmedInputs.password);

    let usernameCheck = await runQuery(`SELECT * FROM Users WHERE Username = ?;`,[trimmedInputs.username])

    if(usernameCheck.length >= 1){
      sharedReturn.sendError(result,'username',`Username already taken! <i class='fa-solid fa-database'></i>`);
      return;
    }

    let emailCheck =  await runQuery(`SELECT * FROM Users WHERE Email = ?;`,[trimmedInputs.email])

    if(emailCheck.length >= 1){
      sharedReturn.sendError(result,'email',`Email already taken! <i class='fa-solid fa-database'></i>`);
      return;
    }

    let randomID = randomIdentification();

    let randomIDCheck =  await runQuery(`SELECT * FROM Users WHERE UserID = ?;`,[randomID]);

    while(randomIDCheck.length != 0){
      //Ensure all ID's are unique
      randomID = randomIdentification();
      randomIDCheck =  await runQuery(`SELECT * FROM Users WHERE UserID = ?;`,[randomID]);
    }

    const verifiedChar = 'F';

    const query = `INSERT INTO Users (UserID,Username,PasswordHash,Email,Verified) VALUES (?,?,?,?,?);`;

    let queryResult = await runQuery(query,[randomID,trimmedInputs.username,passwordHash,trimmedInputs.email,verifiedChar]);

    //Store UserID in current express session to have a reference for loading user specific data on front end
    // Store Username and Email to display in user settings to not always run a Query to database
    request.session.UserID = randomID;
    request.session.Username = trimmedInputs.username;
    request.session.Email = trimmedInputs.email;
    request.session.Verified = verifiedChar;

    sharedReturn.sendSuccess(result,`Welcome <i class="fa-solid fa-door-open"></i>`);
    return;
    return;
  } catch (error){
    sharedReturn.sendError(result,'email',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
    return;
  }
});