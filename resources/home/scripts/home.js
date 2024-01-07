import {openNotification}  from "../../shared/scripts/shared.js";


function constructStories(stories){
   let storiesContainer = document.getElementById('stories');
   let storiesItems = stories.rss.channel[0].item;

   for(let i = 0; i < storiesItems.length; i++){

      let story = document.createElement('div');
      story.className = 'story';

      let possibleImageURL = ``;
      let possibleImageType = ``;
      let possibleURL = storiesItems[i]['media:content']?.[0]?.['$'] || storiesItems[i]['image'] || 0;

      if(possibleURL != '' && possibleURL.url && possibleURL.url.includes('https://images.mktw.net')){
         //https://images.mktw.net is only allowed domain for images
         possibleImageURL = possibleURL.url;
         possibleImageType = possibleURL.type;
      } else{
         possibleImageURL = '../resources/home/images/backup.jpg';
         possibleImageType = 'text/jpeg';
      }

      story.innerHTML = `
         <div class = 'imageContainer'>
            <img src="${possibleImageURL}" alt="story-image" type="${possibleImageType}">
         </div>
         <div class = 'storyText'>
            <h2><a href = '${storiesItems[i].link}'>${storiesItems[i].title[0]}</a></h2>
            <p>${storiesItems[i].description[0]}</p>
            <h3>${storiesItems[i].author[0]}</h3>
            <h3>${storiesItems[i].pubDate[0]}</h3>
         </div>
      `
      storiesContainer.append(story);
   }
}

let charts = []

function constructGraph(graphType,graphData,graphOptions,text,container){
   let graphContainer = document.createElement('div');
   graphContainer.className = `graphContainer`;
   graphContainer.innerHTML = `
      <div>
        ${text}
      </div>
      <div>
         <canvas></canvas>
      </div>
    `;

   container.append(graphContainer);

   let chart = graphContainer.querySelector('canvas').getContext('2d');

   charts.push(new Chart(chart, {
      type: graphType,
      data: graphData,
      options: graphOptions
   }));
}

function constructStocks(stocks){
   let allStocks = Object.values(stocks);
   const stockNames = {
      "VT":"Vanguard Total World Stock Index Fund ETF",
      "VTI":"Vanguard Total Stock Market Index Fund ETF",
      "SPY":"SPDR S&P 500 ETF Trust",
      "QQQ":"Invesco QQQ Trust Series 1",
      "BITW":"Bitwise 10 Crypto Index Units Beneficial Interest"
   }


   for(let i = 0; i < allStocks.length; i++){
      let symbol = allStocks[i]['Meta Data']['2. Symbol'];

      let stockData = allStocks[i]['Time Series (Daily)']
      let times = Object.keys(stockData);

      let graphDates = [];
      let graphPrices = [];

      //Get previous month worth of stock data
      for(let i = times.length - 30; i < times.length; i++){
         graphDates.push(times[i].split(' ')[0]);
         graphPrices.push(parseFloat(stockData[times[i]]['1. open']))
      }

      let stockColor = graphPrices[times.length - 1] < graphPrices[times.length - 31] ? 'red' : '#07EA3A';

      let data = {
         labels: graphDates,
         datasets: [{
            borderColor: stockColor,
            backgroundColor: stockColor,
            data: graphPrices,
            pointRadius: 5,
            pointBackgroundColor: stockColor,
            pointBorderColor: stockColor,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: stockColor,
            pointHoverBorderColor: stockColor,
            pointHitRadius: 10,
            pointBorderWidth: 2,
            tension: 0.2
         }],
      };

      let options = {
         responsive: true,
         maintainAspectRatio: true,
         plugins:{
            legend: {
               display: false
            }
         }
       };

      constructGraph('line',data,options,`<h2><a href = 'https://www.google.com/search?q=${symbol}'>${stockNames[symbol]}</a></h2>`,document.getElementById('markets'));
   }
}

function constructAccountsGraph(accounts,netWorth){
   let accountData = Object.values(accounts);
   let accountNames = [];
   let accountValues = [];


   let backgroundColors = [
      "#FF6384", "#36A2EB", "#FFCE56",
      "#4BC0C0", "#9966FF", "#FF9F40",
      "#FF66CC", "#6699FF", "#FFD966",
      "#45B6FE", "#FF6384", "#4BC0C0",
   ];

   for(let i = 0; i < accountData.length; i++){
      accountNames.push(accountData[i].name);
      accountValues.push(accountData[i].balance);
   }



   let data = {
      labels: accountNames,
      datasets: [{
          label: 'Balance',
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
          data: accountValues,
      }]
   };

   let options = {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
         y: {
             beginAtZero: true
         }
      }
   }

   let innerText = `<h2><a href = './accounts#accounts'>Accounts</h2></a>`;

   if(netWorth < 0) {
      innerText += `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(netWorth)*-1).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
   } else{
      innerText += `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(netWorth).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
   }


   constructGraph('bar',data,options,innerText,document.getElementById('accounts'));
}

function constructFinanceGraph(transactions){
   //Graph showing Income vs Expenses for current year
   let currentYear = new Date().getFullYear();
   const months = ['Jan', 'Feb', 'Mar','Apr.', 'May', 'Jun','Jul', 'Aug', 'Sep','Oct', 'Nov', 'Dec'];

   let transactionData = Object.values(transactions);

   let incomeData = new Array(12).fill(0);
   let expensesData = new Array(12).fill(0);

   for(let i = 0; i < transactionData.length; i++){
      let date = transactionData[i].date.split('-');
      let year = date[0];

      if(year == currentYear){
         //Only construct data for current year
         let monthIndex = date[1] - 1;
         if(transactionData[i].type == 'Income'){
            incomeData[monthIndex] += transactionData[i].amount
         } else{
            expensesData[monthIndex] += transactionData[i].amount
         }
      }
   }

   let data = {
      labels: months,
      datasets: [{
        label: 'Income',
        backgroundColor: '#07EA3A',
        data: incomeData,
      }, {
        label: 'Expenses',
        backgroundColor: 'red',
        data: expensesData,
      }],
    };

    let options = {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
   };

   constructGraph('bar', data, options, `<h2><a href = "./accounts#transactionsSection">Monthly Trends</a></h2><span>${currentYear}</span>`, document.getElementById('finances'));

}

async function fetchData(){
   try {
      const response = await fetch('./fetchHomeData');

      const data = await response.json();

      console.log(data);


      constructStories(data.stories);
      constructStocks(data.stocks);
      constructAccountsGraph(data.userData.accounts,data.userData.netWorth);
      constructFinanceGraph(data.userData.transactions);
      updateChartColors();
      document.querySelector('main').style.opacity = '1';
    } catch (error) {
      console.log(error);
      document.querySelector('main').style.opacity = '1';
      // Handle errors if the request fails
      openNotification("fa-solid fa-layer-group", '<p>Could not successfully process request</p>', 'errorType');
    }
}

function updateChartColors(){
   //Manually set color to current mode on Chart JS graph
   charts.forEach((chart)=>{
      chart.options.scales.x.ticks.color = getComputedStyle(document.body).getPropertyValue('--text-color');
      chart.options.scales.y.ticks.color = getComputedStyle(document.body).getPropertyValue('--text-color');

      // 2.4 rem
      let calculatedFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.4;
      chart.options.scales.x.ticks.fontSize = calculatedFontSize;
      chart.options.scales.y.ticks.fontSize = calculatedFontSize;
      chart.update();
   });
}

document.querySelector("#mode").addEventListener('change', (event)=>{
   updateChartColors();
});

window.addEventListener('resize', function() {
   //Maintain responsiveness of graphs
   console.log(1);
   console.log(2);
   charts.forEach((chart)=>{
      chart.resize();
   });
});

fetchData();
