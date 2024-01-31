import {openNotification}  from "../../shared/scripts/shared.js";

function constructStories(stories){
   let storiesContainer = document.getElementById('stories');
   let storiesItems = stories.rss.channel[0].item;

   storiesItems.forEach((story)=>{
      let container = document.createElement('div');
      container.className = 'story';

      let possibleImageURL;
      let possibleImageType;
      let possibleURL = story['media:content']?.[0]?.['$'] || story['image'] || '';


      if(possibleURL != '' && possibleURL.url && possibleURL.url.includes('https://images.mktw.net')){
         //https://images.mktw.net is only allowed domain for images
         possibleImageURL = possibleURL.url;
         possibleImageType = possibleURL.type;
      } else{
         console.log(possibleURL);
         console.log(story);
         possibleImageURL = '../resources/home/images/backup.jpg';
         possibleImageType = 'text/jpeg';
      }

      function getStoryItem(array, index) {
         // Some RSS feeds will not include specific tags, so ensure they exist
         return array?.[index] || '';
      }

      container.innerHTML = `
         <div class='imageContainer'>
           <img src="${possibleImageURL}" alt="story-image" type="${getStoryItem(possibleImageType, 0)}">
         </div>
         <div class='storyText'>
           <h2><a href='${getStoryItem(story.link)}'>${getStoryItem(story.title, 0)}</a></h2>
           <p>${getStoryItem(story.description, 0)}</p>
           <h3><i class="fa-solid fa-at"></i> ${getStoryItem(story.author, 0)}</h3>
           <h3><i class="fa-solid fa-calendar-days"></i> ${getStoryItem(story.pubDate, 0)}</h3>
         </div>
      `;
      storiesContainer.append(container);
   });
}

let charts = []
Chart.defaults.font.size = 16;
Chart.defaults.font.weight = 'bold';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.datasets.bar.maxBarThickness = 50;

function constructGraph(graphType,graphData,graphOptions,text,container){
   let graphContainer = document.createElement('div');
   graphContainer.className = `graphContainer`;
   graphContainer.innerHTML = `
      <div>
        ${text}
      </div>
      <div class = 'graph'>
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
   // Limited amount of stocks due to limitations on free API, but ETF's are generally good indications of current trends
   const stockNames = {
      "VT":"Vanguard Total World Stock Index Fund ETF",
      "VTI":"Vanguard Total Stock Market Index Fund ETF",
      "SPY":"SPDR S&P 500 ETF Trust",
      "QQQ":"Invesco QQQ Trust Series 1",
      "BITW":"Bitwise 10 Crypto Index Units Beneficial Interest"
   }

   allStocks.forEach((stock) => {
      let symbol = stock['Meta Data']['2. Symbol'];

      let stockData = stock['Time Series (Daily)']
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
   });
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

   accountData.forEach((account) => {
      accountNames.push(account.name);
      accountValues.push(account.balance);

      if(account.type == 'Loan' || account.type == 'Credit Card'){
         //Differentiate between negative and positive accounts
         accountColors.push('red');
      } else{
         accountColors.push(backgroundColors[Math.floor(Math.random() * backgroundColors.length)]);
      }
   });

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
      elements: {
         bar: {
             borderWidth: 1,
             borderRadius: 1,
             barThickness: function(context) {
                 var minBarThickness = 50;
                 return Math.max(minBarThickness, context.parsed.y) / 2;
             },
         }
     }
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
      } else if(!categoryIndexes[categoryID]){
         expensesCategoriesData.datasets.push(graphData);
         categoryIndexes[categoryID] = expensesCategoryIndex++;
      }
   });

   transactionData.forEach((transaction) => {
      let date = transaction.date.split('-');
      let year = date[0];

      if(year == currentYear){
         //Only construct data for current year
         let monthIndex = date[1] - 1;
         let amount = transaction.amount;
         let categoryIndex = categoryIndexes[transaction.categoryID];

         if(transaction.type == 'Income'){
            if(transaction.categoryID != 'Income'){
               //Categories Object stores index in array of data
               incomeCategoriesData.datasets[categoryIndex].data[monthIndex] += amount;
            } else{
                //First index represents general income/expenses category
                incomeCategoriesData.datasets[0].data[monthIndex] += amount;
            }

            incomeData.data[monthIndex] += amount;
         } else{
            if(transaction.categoryID != 'Expenses'){
               expensesCategoriesData.datasets[categoryIndex].data[monthIndex] += amount;
            } else{
               expensesCategoriesData.datasets[0].data[monthIndex] += amount;
            }

            expensesData.data[monthIndex] += amount
         }
      }
   });

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
      elements: {
         bar: {
             borderWidth: 1,
             borderRadius: 1
         }
     }
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
      elements: {
         bar: {
             borderWidth: 1,
             borderRadius: 1,
         }
     }
   };

   let categoryData = {
      labels: months,
      datasets: [...incomeCategoriesData.datasets,...expensesCategoriesData.datasets],
   };

   constructGraph('bar', incomeExpensesData, options, `<h2><a href = "./accounts">Monthly Trends</a></h2>`, document.getElementById('finances'));
   constructGraph('bar', categoryData, stackedOptions, `<h2><a href = "./budget">Category Trends</a></h2>`, document.getElementById('finances'));
}

async function fetchData(){
   try {
      const response = await fetch('./fetchHomeData');
      const data = await response.json();

      constructStories(data.stories);
      constructStocks(data.stocks);
      constructAccountsGraph(data.userData.accounts,data.userData.netWorth);
      constructFinanceGraph(data.userData.transactions,data.userData.budget);
      updateChartColors();

      document.body.style.opacity = '1';
    } catch (error) {
      console.log(error);
      document.body.style.opacity = '1';
      // Handle errors if the request fails
      openNotification("fa-solid fa-triangle-exclamation", '<p>Could not successfully process request</p>', 'errorType');
    }
}

function updateChartColors(){
   //Manually set color to current mode for Chart JS graph
   charts.forEach((chart)=>{
      chart.options.scales.x.ticks.color = getComputedStyle(document.body).getPropertyValue('--text-color');
      chart.options.scales.y.ticks.color = getComputedStyle(document.body).getPropertyValue('--text-color');
      chart.update();
   });
}

fetchData();
