require("dotenv").config();
const mysql = require('mysql2');
const util = require('util');
const cryptoJS = require('crypto-js');
const sharedReturn = require('../controllers/message.js');
const { request } = require("http");

exports.runQuery = async function(query='',inputs=[]){
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

exports.updateDatabase = async function(result,query='',items=[],returnInfo={}){
   await exports.runQuery(query,items);
   result.status(200);
   sharedReturn.sendSuccess(result,`Changes saved <i class="fa-solid fa-check"></i>`,returnInfo);
}

exports.searchDuplicates = async function(result,query,items,componentID,message){
   try{
      const duplicateCheck = await exports.runQuery(query,items);

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

exports.randomIdentification = function() {
   //Create random id for a transaction using both chars and ints from current date
   const randomID = cryptoJS.lib.WordArray.random(30);
   let hexString = cryptoJS.enc.Hex.stringify(randomID);

   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   const randomIndex = Math.floor(Math.random() * characters.length);

   //Random character at start to use as identifier in HTML
   return characters[randomIndex] + hexString.substring(0,29).padEnd(29, '0');
}

exports.changesMade = function(inputObject,comparingObject){
   let inputKeys = Object.keys(inputObject);

   //Shared function to check if any changes were made prior to running queries
   for(let i = 0; i < inputKeys.length; i++){
      if(comparingObject.hasOwnProperty(inputKeys[i]) && inputObject[inputKeys[i]] != comparingObject[inputKeys[i]]){
         if(inputKeys[i] == 'date'){
            //Compare using specific date format in database
            const inputDate = new Date(inputObject[inputKeys[i]] + 'T05:00:00.000Z');
            const oldDate = new Date(comparingObject[inputKeys[i]]);

            if(inputDate.getTime() != oldDate.getTime()) return true;
         } else{
            return true;
         }
      }
   }
   return false;
}

exports.retrieveRandomID = async function(query){
   let randomID = exports.randomIdentification();
   //Assume query maintains structure of SELECT * FROM X WHERE Y = ?
   let randomIDCheck =  await exports.runQuery(query,[randomID]);

   while(randomIDCheck.length != 0){
     //Ensure all ID's are unique
     randomID = exports.randomIdentification();
     randomIDCheck =  await exports.runQuery(query,inputs);
   }

   return randomID;
}

exports.getCurrentMonth = function(){
   const currentDate = new Date();
   let year = currentDate.getFullYear();
   let month = (currentDate.getUTCMonth() + 1).toString().padStart(2,'0');
   //Set to one as budgets are reset on the first;
   let day = '01';
   return year + '-' + month + '-' + day;
}

exports.hash = function(password){
   //Simple Hash Function provided by crypto-js for consistent hashes and safety of user sensitive info
   return cryptoJS.SHA256(password).toString(cryptoJS.enc.Hex);
}
