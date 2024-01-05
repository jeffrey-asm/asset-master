const asyncHandler = require("express-async-handler");
const fs = require('fs');
const sharedReturn = require('./message.js');
const axios = require('axios');
const { parseString } = require('xml2js');

async function fetchStories() {
   try {
     const response = await axios.get('https://feeds.content.dowjones.io/public/rss/mw_topstories');
     const data = await parseXML(response.data);
     return data;
   } catch (error) {
     // Use backup XML Feed
     const xmlBackup = await fs.readFile('resources/home/backup.xml', 'utf8');
     const data = await parseXML(xmlBackup);
     return data;
   }
}

function parseXML(xmlData) {
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


async function fetchStocks(){
   //https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo
   const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN','TSLA'];
}

exports.fetchHomeData = asyncHandler(async(request,result,next)=>{
   try{
      let stories = await fetchStories();
      let stocks = 'TODO';
      console.log(stories);
      result.status(200);
      result.json(stories);
   } catch(error){
      result.status(500);
      sharedReturn.sendError(result,'email',`Could not successfully process request <i class='fa-solid fa-database'></i>`);
   }

});

