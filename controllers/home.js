require("dotenv").config();
const asyncHandler = require("express-async-handler");
const fs = require("fs").promises;
const sharedReturn = require("./message.js");
const query = require("../database/query.js");
const axios = require("axios");
const { parseString } = require("xml2js");
const accountController = require("./accounts.js");
const { grabUserData } = require("./accounts.js");

async function fetchStories () {
   try {
      const response = await axios.get("https://feeds.content.dowjones.io/public/rss/mw_topstories");
      const data = await parseXML(response.data);
      return data;
   } catch (error) {
      console.log(error);
      // Use backup XML Feed
      const xmlBackup = await fs.readFile("resources/home/backup.xml", "utf8");
      const data = await parseXML(xmlBackup);
      return data;
   }
}

function parseXML (xmlData) {
   return new Promise((resolve, reject) => {
      parseString(xmlData, (error, data) => {
         if (error) {
            reject(error);
         } else {
            resolve(data);
         }
      });
   });
}


async function fetchStocks (request, dateAndHour) {
   const possibleData = await query.runQuery("SELECT * FROM Stocks", []);
   let initializeData = false;

   let stocks = {};
   const symbols = ["VT", "VTI", "SPY", "QQQ", "BITW"];

   if (possibleData.length == 0) {
      initializeData = true;
   } else if (possibleData[0].DateAndHour != dateAndHour) {
      initializeData = true;
   } else {
      // In case user session drops out, set up cache stock data
      request.session.dateAndHour = possibleData[0].DateAndHour;
      stocks = JSON.parse(JSON.stringify(possibleData[0].Stocks));
      request.session.stocks = stocks;

      await request.session.save();
      return stocks;
   }


   const options = {
      method: "GET",
      url: "https://alpha-vantage.p.rapidapi.com/query",
      params: {
         function: "TIME_SERIES_DAILY",
         symbol: "VT",
         outputsize: "compact",
         datatype: "json"
      },
      headers: {
         "X-RapidAPI-Key": process.env.XRapidAPIKey,
         "X-RapidAPI-Host": process.env.XRapidAPIHost,
      }
   };

   for (const symbol of symbols) {
      try {
         options.symbol = symbol;

         const response = await axios.request(options);

         if (!response.data["Meta Data"] ) {
            throw new Error("Invalid API format");
         }

         stocks[symbol] = await response.data;
      }  catch (error) {
         console.log(error);
         const jsonBackup = await fs.readFile("resources/home/backup.json", "utf8");
         const data = await JSON.parse(jsonBackup);
         stocks =  data;
      }
   };

   if (initializeData) {
      await query.runQuery("DELETE FROM Stocks");
      await query.runQuery("INSERT INTO Stocks (DateAndHour,Stocks) VALUES(?,?)", [dateAndHour, JSON.stringify(stocks)]);
   }

   request.session.stocks = stocks;
   await request.session.save();

   return stocks;
}

exports.fetchHomeData = asyncHandler(async (request, result, next) => {
   try {
      const data = {};

      data.stories = await fetchStories();

      // Assume for YY-MM-DD-HR
      const currentDate = new Date();
      const dateAndHour = `${currentDate.getUTCFullYear()}-${(currentDate.getUTCMonth() + 1)}-${currentDate.getUTCDate()}-${currentDate.getUTCHours()}`;

      if (request.session.dateAndHour && request.session.dateAndHour == dateAndHour) {
         data.stocks = request.session.stocks;
      } else {
         data.stocks = await fetchStocks(request, dateAndHour);
      }

      if (!request.session.accounts) {
         data.userData = await accountController.setUpAccountsCache(request);
      } else {
         const userData = request.session.accounts && request.session.transactions && request.session.budget ? request.session : grabUserData(request);

         data.userData = {
            accounts : userData.accounts,
            transactions : userData.transactions,
            budget : userData.budget
         };
      }

      sharedReturn.sendSuccess(result, "Successfully fetched home data <i class='fa-solid fa-database'></i>", data);
   } catch (error) {
      console.log(error);
      sharedReturn.sendError(result, 500, "email", "Could not successfully process request <i class='fa-solid fa-database'></i>");
   }
});

