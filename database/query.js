require("dotenv").config();
const mysql = require('mysql2');
const util = require('util');

async function runQuery(query='',inputs=[]){
   //Establish a connection to database and await for a Promise return to work on valid result rows from a given table(s)
   const connection = mysql.createConnection(process.env.SERVER);
   const asyncQuery = util.promisify(connection.query).bind(connection);

   try{
      const results = await asyncQuery(query,inputs);
      return results;
   } catch (error){
      console.log(error);
      return {error: `Error running sql query: ${error}`};
   } finally{
      connection.end();
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


module.exports = {runQuery,retrieveRandomID,getCurrentDate};