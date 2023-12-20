const path = require('path')
require("dotenv").config();

const config =  {
   user:process.env.USERNAME,
   password:process.env.PASSWORD,
   server:process.env.SERVER,
   port:parseInt(process.env.PORT),
   database:process.env.DATABASE,
   authentication: {
      type: process.env.AUTHENTICATIONTYPE
   },
   options: {
      encrypt: true,
  }

}

module.exports = config;