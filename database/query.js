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

module.exports = runQuery;