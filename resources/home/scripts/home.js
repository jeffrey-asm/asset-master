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
            <h3><i class="fa-solid fa-at"></i> ${storiesItems[i].author[0]}</h3>
            <h3><i class="fa-solid fa-calendar-days"></i> ${storiesItems[i].pubDate[0]}</h3>
         </div>
      `
      storiesContainer.append(story);
   }
}

let charts = []
Chart.defaults.font.size = 16;
Chart.defaults.font.weight = 'bold';
Chart.defaults.responsive = false;
Chart.defaults.plugins.legend.display = false;

function constructGraph(graphType,graphData,graphOptions,text,container){
   let graphContainer = document.createElement('div');
   graphContainer.className = `graphContainer`;
   graphContainer.innerHTML = `
      <div>
        ${text}
      </div>
      <div>
         <canvas></canvas>
      </div>`;

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

      let options = {};

      constructGraph('line',data,options,`<h2><a href = 'https://www.google.com/search?q=${symbol}'>${stockNames[symbol]}</a></h2>`,document.getElementById('markets'));
   }
}

function constructAccountsGraph(accounts,netWorth){
   let accountData = Object.values(accounts);
   let accountNames = [];
   let accountValues = [];


   let backgroundColors = [
      "#59FD59", "#36A2EB", "#FFCE56",
      "#4BC0C0", "#9966FF", "#FF9F40",
      "#FF35FF", "#6699FF", "#FFD966",
      "#45B6FE", "#FF6384", "#4BC0C0",
   ];

   let accountColors = [];

   for(let i = 0; i < accountData.length; i++){
      accountNames.push(accountData[i].name);
      accountValues.push(accountData[i].balance);

      if(accountData[i].type == 'Loan' || accountData[i].type == 'Credit Card'){
         //Differentiate between negative and positive accounts
         accountColors.push('red');
      } else{
         accountColors.push(backgroundColors[Math.floor(Math.random() * backgroundColors.length)]);
      }
   }

   let data = {
      labels: accountNames,
      datasets: [{
          label: 'Balance',
          backgroundColor: accountColors,
          borderColor: accountColors,
          borderWidth: 1,
          data: accountValues,
      }]
   };

   let options = {
      scales: {
         y: {
             beginAtZero: true,
         }
      },
   }

   let innerText = `<h2><a href = './accounts#accounts'>Accounts</h2></a>`;

   constructGraph('bar',data,options,innerText,document.getElementById('accounts'));
}

function constructFinanceGraph(transactions,budget){
   //Graph showing Income vs Expenses for current year
   let currentYear = new Date().getFullYear();
   const months = ['Jan', 'Feb', 'Mar','Apr.', 'May', 'Jun','Jul', 'Aug', 'Sep','Oct', 'Nov', 'Dec'];

   let transactionData = Object.values(transactions);

   let incomeData = {
      label:"Income",
      data: Array.from({ length: 12 }, () => 0),
      backgroundColor:'rgba(144, 238, 144, 0.7)',
      borderWidth: 1
   }

   let expensesData = {
      label:"Expenses",
      data:Array.from({ length: 12 }, () => 0),
      backgroundColor:'rgba(255, 99, 71, 0.7)',
      borderWidth: 1
   }

   let categoryIndexes = {};

   let incomeCategoriesData = {
      datasets:[]
   }

   let expensesCategoriesData = {
      datasets:[]
   }

   let incomeCategoryIndex = 1;
   let expensesCategoryIndex = 1;

   //General types to be the base of the bar chart
   let incomeGraphClone = {
      label:"General Income",
      data: Array.from({ length: 12 }, () => 0),
      stack:"Income",
      borderWidth: 1
   };

   incomeCategoriesData.datasets.push(incomeGraphClone);

   let expensesGraphClone ={
      label:"General Expenses",
      data: Array.from({ length: 12 }, () => 0),
      stack:"Expenses",
      borderWidth: 1
   };

   expensesCategoriesData.datasets.push(expensesGraphClone);

   let categories = Object.entries(budget.categories);

   //Store specific index
   categories.forEach((category)=>{
      let categoryID = category[0];
      let categoryData = category[1];

      let graphData = {
         label:categoryData.name,
         data: Array.from({ length: 12 }, () => 0),
         stack:categoryData.type
      }

      if(categoryData.type == 'Income'){
         if(!categoryIndexes[categoryID]){
            incomeCategoriesData.datasets.push(graphData);
            categoryIndexes[categoryID] = incomeCategoryIndex++;
         }
      } else{
         if(!categoryIndexes[categoryID]){
            expensesCategoriesData.datasets.push(graphData);
            categoryIndexes[categoryID] = expensesCategoryIndex++;
         }
      }
   });


   for(let i = 0; i < transactionData.length; i++){
      let date = transactionData[i].date.split('-');
      let year = date[0];

      if(year == currentYear){
         //Only construct data for current year
         let monthIndex = date[1] - 1;
         let amount = transactionData[i].amount;
         let categoryIndex = categoryIndexes[transactionData[i].categoryID];

         if(transactionData[i].type == 'Income'){
            if(transactionData[i].categoryID != 'Income'){
               //Categories Object stores index in array of data
               incomeCategoriesData.datasets[categoryIndex].data[monthIndex] += amount;
            } else{
                //First index represents general income/expenses category
                incomeCategoriesData.datasets[0].data[monthIndex] += amount;
            }

            incomeData.data[monthIndex] += amount;
         } else{
            if(transactionData[i].categoryID != 'Expenses'){
               expensesCategoriesData.datasets[categoryIndex].data[monthIndex] += amount;
            } else{
               expensesCategoriesData.datasets[0].data[monthIndex] += amount;
            }

            expensesData.data[monthIndex] += amount
         }
      }
   }


   let incomeExpensesData = {
      labels: months,
      datasets: [incomeData,expensesData],
    };

    let options = {
      scales: {
         y: {
            minBarLength: 2,
            beginAtZero: true,
            ticks: {
               beginAtZero:true,
            }
         }
      },
   };

   let stackedOptions = {
      scales: {
         x:{
            stacked:true,
         },
         y: {
            minBarLength: 2,
            stacked:true,
            beginAtZero: true,
            ticks: {
               beginAtZero:true,
           }
         },
      },
   };

   let categoryData = {
      labels: months,
      datasets: [...incomeCategoriesData.datasets,...expensesCategoriesData.datasets],
   };

   constructGraph('bar', incomeExpensesData, options, `<h2><a href = "./accounts#transactionsSection">Monthly Trends</a></h2>`, document.getElementById('finances'));

   constructGraph('bar', categoryData, stackedOptions, `<h2><a href = "./budget">Category Trends</a></h2>`, document.getElementById('finances'));
}

async function fetchData(){
   try {
      const response = await fetch('./fetchHomeData');

      const data = await response.json();

      console.log(data);

      constructStories(data.stories);
      constructStocks(data.stocks);
      constructAccountsGraph(data.userData.accounts,data.userData.netWorth);
      constructFinanceGraph(data.userData.transactions,data.userData.budget);
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
      chart.update();
   });
}

document.querySelector("#mode").addEventListener('change', (event)=>{
   updateChartColors();
});


fetchData();
