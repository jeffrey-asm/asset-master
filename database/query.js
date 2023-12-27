require("dotenv").config();
const mysql = require('mysql2');
const util = require('util');
const cryptoJS = require('crypto-js');
const sharedReturn = require('../controllers/message.js');

async function runQuery(query='',inputs=[]){
   //Establish a connection to database and await for a Promise return to work on valid result rows from a given table(s)
   const connection = mysql.createConnection(process.env.SERVER);
   const asyncQuery = util.promisify(connection.query).bind(connection);

   try{
      const results = await asyncQuery(query,inputs);
      return results;
   } catch (error){
      console.log(error);
      throw error;
   } finally{
      connection.end();
   }
}

async function updateDatabase(result,query='',items=[]){
   await runQuery(query,items);
   result.status(200);
   sharedReturn.sendSuccess(result,`Changes saved <i class="fa-solid fa-check"></i>`);
}

async function searchDuplicates(result,query,items,componentID,message){
   try{
      let duplicateCheck = await runQuery(query,items);
      if(duplicateCheck.length >= 1){
         result.status(409);
         sharedReturn.sendError(result,componentID,message);
         return true;
      }

      return false;
   } catch(error){
      result.status(500);
      sharedReturn.sendError(result,componentID,`Could not successfully process request <i class='fa-solid fa-database'></i>`);
      return true;
   }
}

function randomIdentification() {
   //Create random id for a transaction using both chars and ints from current date
   let randomID = Math.random().toString(36).replace(/[^a-z]+/g, '') + Date.now();
   return randomID.substring(0,30);
}

async function retrieveRandomID(query){
   let randomID = randomIdentification();
   //Assume query maintains structure of SELECT * FROM X WHERE Y = ?
   let randomIDCheck =  await runQuery(query,[randomID]);

   while(randomIDCheck.length != 0){
     //Ensure all ID's are unique
     randomID = randomIdentification();
     randomIDCheck =  await runQuery(query,inputs);
   }

   return randomID;
}

function getCurrentDate(){
   let currentDate = new Date();
   let year = currentDate.getFullYear();
   let month = (currentDate.getMonth() + 1).toString().padStart(2,'0');
   let day = (currentDate.getDay()).toString().padStart(2,'0');
   return year + '-' + month + '-' + day;
}

function hash(password){
   //Simple Hash Function provided by crypto-js for consistent hashes and safety of user sensitive info
   return cryptoJS.SHA256(password).toString(cryptoJS.enc.Hex);
}


module.exports = {runQuery,retrieveRandomID,getCurrentDate,searchDuplicates,updateDatabase,hash};