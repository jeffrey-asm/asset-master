# finance-tracker
Side project to dive deep into full stack development




# Project Setup
   npm install express --save-dev (Express JS Framework)
   express assetmaster (Skeleton Express Application Setup)

   mv  assetmaster/* .
   rm -rf assetmaster

   npm install
   npm install mysql2 --save-dev (SQL connection)
   npm install --save-dev nodemon (Refresh Development Server on Changes)
      package.json[script] -> "start": "nodemon -L ./bin/www"
   npm install --save-dev express body-parser (Parsing Request Bodies)
   npm install --sav-dev dotenv (Environmental variables for sensitive info)
   npm install --save-dev cors (enables Cross-Origin Resource Sharing)
   npm install --save-dev helmet (sets various HTTP headers for security)

   npm start (Development Stage)
