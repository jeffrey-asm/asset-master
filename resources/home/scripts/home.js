import { openNotification }  from "../../shared/scripts/shared.js";

const charts = [];

Chart.defaults.font.size = 16;
Chart.defaults.font.weight = "bold";
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.datasets.bar.maxBarThickness = 50;

function updateChartColors() {
   // Manually set color based on current mode for Chart JS graphs
   charts.forEach((chart) => {
      chart.options.scales.x.ticks.color = getComputedStyle(document.body).getPropertyValue("--text-color");
      chart.options.scales.y.ticks.color = getComputedStyle(document.body).getPropertyValue("--text-color");
      chart.update();
   });
}

function constructStories(stories) {
   const storiesContainer = document.getElementById("stories");
   const storiesItems = stories.rss.channel[0].item;

   storiesItems.forEach((story) => {
      const container = document.createElement("div");
      container.className = "story";

      let possibleImageURL;
      let possibleImageType;
      const possibleURL = story["media:content"]?.[0]?.["$"] || story["image"] || "";

      if (possibleURL != "" && possibleURL.url && possibleURL.url.includes("https://images.mktw.net")) {
         // https://images.mktw.net is only allowed domain for imported page images
         possibleImageURL = possibleURL.url;
         possibleImageType = possibleURL.type;
      } else {
         possibleImageURL = "../resources/home/images/backup.jpg";
         possibleImageType = "text/jpeg";
      }

      const getStoryItem = (array, index) => {
         // Some RSS feeds will not include specific tags, so ensure they exist
         return array?.[index] || "";
      };

      container.innerHTML = `
         <div class='imageContainer'>
           <img src="${possibleImageURL}" alt="story-image" type="${getStoryItem(possibleImageType, 0)}">
         </div>
         <div class='storyText'>
           <h2><a href='${getStoryItem(story.link, 0)}' target = '_blank'>${getStoryItem(story.title, 0)}</a></h2>
           <p>${getStoryItem(story.description, 0)}</p>
           <h3><i class="fa-solid fa-at"></i> ${getStoryItem(story.author, 0)}</h3>
           <h3><i class="fa-solid fa-calendar-days"></i> ${getStoryItem(story.pubDate, 0)}</h3>
         </div>
      `;
      storiesContainer.append(container);
   });
}

function constructGraph(graphType, graphData, graphOptions, text, container) {
   const graphContainer = document.createElement("div");
   graphContainer.className = "graphContainer";
   graphContainer.innerHTML = `
      <div>
        ${text}
      </div>
      <div class = 'graph'>
         <canvas></canvas>
      </div>`;

   container.append(graphContainer);

   const chart = graphContainer.querySelector("canvas").getContext("2d");

   charts.push(new Chart(chart, {
      type: graphType,
      data: graphData,
      options: graphOptions
   }));
}

function constructStocks(stocks) {
   const allStocks = Object.values(stocks);

   // Show a limited amount of index funds
   const stockNames = {
      "VT":"Vanguard Total World Stock Index Fund ETF",
      "VTI":"Vanguard Total Stock Market Index Fund ETF",
      "SPY":"SPDR S&P 500 ETF Trust",
      "QQQ":"Invesco QQQ Trust Series 1",
      "BITW":"Bitwise 10 Crypto Index Units Beneficial Interest"
   };

   allStocks.forEach((stock) => {
      const symbol = stock["Meta Data"]["2. Symbol"];

      const stockData = stock["Time Series (Daily)"];
      const times = Object.keys(stockData);

      const graphDates = [];
      const graphPrices = [];

      // Get previous month worth of stock data
      for (let i = times.length - 30; i < times.length; i++) {
         graphDates.push(times[i].split(" ")[0]);
         graphPrices.push(parseFloat(stockData[times[i]]["1. open"]));
      }

      const stockColor = graphPrices[times.length - 1] < graphPrices[times.length - 31] ? "red" : "#07EA3A";

      const data = {
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
         }]
      };

      const options = {};
      constructGraph("line", data, options, `<h2><a href = 'https://www.google.com/search?q=${symbol}' target = '_blank'>${stockNames[symbol]}</a></h2>`, document.getElementById("markets"));
   });
}

function constructAccountsGraph(accounts) {
   const accountData = Object.values(accounts);
   const accountNames = [];
   const accountValues = [];

   const backgroundColors = [
      "#59FD59", "#36A2EB", "#FFCE56",
      "#4BC0C0", "#9966FF", "#FF9F40",
      "#FF35FF", "#6699FF", "#FFD966",
      "#45B6FE", "#FF6384", "#4BC0C0"
   ];

   const accountColors = [];

   accountData.forEach((account) => {
      accountNames.push(account.name);
      accountValues.push(account.balance);

      if (account.type == "Loan" || account.type == "Credit Card") {
         // Differentiate between negative and positive accounts
         accountColors.push("red");
      } else {
         accountColors.push(backgroundColors[Math.floor(Math.random() * backgroundColors.length)]);
      }
   });

   const data = {
      labels: accountNames,
      datasets: [{
         label: "balance",
         backgroundColor: accountColors,
         borderColor: accountColors,
         borderWidth: 1,
         data: accountValues
      }]
   };

   const options = {
      scales: {
         y: {
            beginAtZero: true
         }

      },
      elements: {
         bar: {
            borderWidth: 1,
            borderRadius: 1,
            barThickness: function(context) {
               const minBarThickness = 50;
               return Math.max(minBarThickness, context.parsed.y) / 2;
            }
         }
      }
   };

   const innerText = "<h2><a href = './accounts#accounts'>Accounts</h2></a>";
   constructGraph("bar", data, options, innerText, document.getElementById("accounts"));
}

function constructFinanceGraph(transactions, budget) {
   // Graph showing Income vs Expenses for current year
   const currentYear = new Date().getFullYear();
   const months = ["Jan", "Feb", "Mar", "Apr.", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

   const transactionData = Object.values(transactions);

   const incomeData = {
      label:"Income",
      data: Array.from({ length: 12 }, () => 0),
      backgroundColor:"rgba(144, 238, 144, 0.7)",
      borderWidth: 1
   };

   const expensesData = {
      label:"Expenses",
      data:Array.from({ length: 12 }, () => 0),
      backgroundColor:"rgba(255, 99, 71, 0.7)",
      borderWidth: 1
   };

   const categoryIndexes = {};

   const incomeCategoriesData = {
      datasets:[]
   };

   const expensesCategoriesData = {
      datasets:[]
   };

   let incomeCategoryIndex = 1;
   let expensesCategoryIndex = 1;

   // General types to be the base of the bar chart
   const incomeGraphClone = {
      label:"General Income",
      data: Array.from({ length: 12 }, () => 0),
      stack:"Income",
      borderWidth: 1
   };

   incomeCategoriesData.datasets.push(incomeGraphClone);

   const expensesGraphClone = {
      label:"General Expenses",
      data: Array.from({ length: 12 }, () => 0),
      stack:"Expenses",
      borderWidth: 1
   };

   expensesCategoriesData.datasets.push(expensesGraphClone);

   const categories = Object.entries(budget.categories);
   categories.forEach((category) => {
      const categoryID = category[0];
      const categoryData = category[1];

      const graphData = {
         label:categoryData.name,
         data: Array.from({ length: 12 }, () => 0),
         stack:categoryData.type
      };

      if (categoryData.type == "Income") {
         if (!categoryIndexes[categoryID]) {
            incomeCategoriesData.datasets.push(graphData);
            categoryIndexes[categoryID] = incomeCategoryIndex++;
         }
      } else if (!categoryIndexes[categoryID]) {
         expensesCategoriesData.datasets.push(graphData);
         categoryIndexes[categoryID] = expensesCategoryIndex++;
      }
   });

   transactionData.forEach((transaction) => {
      const date = transaction.date.split("-");
      const year = date[0];

      if (year == currentYear) {
         // Only construct data for current year
         const monthIndex = date[1] - 1;
         const amount = transaction.amount;
         const categoryIndex = categoryIndexes[transaction.categoryID];

         if (transaction.type == "Income") {
            if (transaction.categoryID != "Income") {
               // Categories Object stores index in array of data
               incomeCategoriesData.datasets[categoryIndex].data[monthIndex] += amount;
            } else {
               // First index represents general income/expenses category
               incomeCategoriesData.datasets[0].data[monthIndex] += amount;
            }

            incomeData.data[monthIndex] += amount;
         } else {
            if (transaction.categoryID != "Expenses") {
               expensesCategoriesData.datasets[categoryIndex].data[monthIndex] += amount;
            } else {
               expensesCategoriesData.datasets[0].data[monthIndex] += amount;
            }

            expensesData.data[monthIndex] += amount;
         }
      }
   });

   const incomeExpensesData = {
      labels: months,
      datasets: [incomeData, expensesData]
   };

   const options = {
      scales: {
         y: {
            minBarLength: 2,
            beginAtZero: true,
            ticks: {
               beginAtZero:true
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

   const stackedOptions = {
      scales: {
         x:{
            stacked:true
         },
         y: {
            minBarLength: 2,
            stacked:true,
            beginAtZero: true,
            ticks: {
               beginAtZero:true
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

   const categoryData = {
      labels: months,
      datasets: [...incomeCategoriesData.datasets, ...expensesCategoriesData.datasets]
   };

   // Construct Income and Category Graphs for current year
   constructGraph("bar", incomeExpensesData, options, "<h2><a href = \"./accounts\">Monthly Trends</a></h2>", document.getElementById("finances"));
   constructGraph("bar", categoryData, stackedOptions, "<h2><a href = \"./budget\">Category Trends</a></h2>", document.getElementById("finances"));
}

async function fetchData() {
   try {
      const response = await fetch("./fetchHomeData");
      const data = (await response.json()).data;

      constructStocks(data.stocks);
      constructStories(data.stories);
      constructAccountsGraph(data.userData.accounts);
      constructFinanceGraph(data.userData.transactions, data.userData.budget);
      updateChartColors();

      document.body.style.opacity = "1";
   } catch (error) {
      console.error(error);
      document.body.style.opacity = "1";
      openNotification("fa-solid fa-triangle-exclamation", "<p>Could not successfully process request</p>", "errorType");
   }
}

fetchData();