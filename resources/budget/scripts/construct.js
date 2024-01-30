import {openPopUp,exitPopUp,openNotification}  from "../../shared/scripts/shared.js";

export const positiveGradient = [
   "#FF0000", // Red
   "#FF1A00",
   "#FF3300",
   "#FF4D00",
   "#FF6600",
   "#FF8000",
   "#FF9900",
   "#FFB200",
   "#FFCC00",
   "#FFE500",
   "#FFFF00",
   "#E5FF00",
   "#CCFF00",
   "#B2FF00",
   "#99FF00",
   "#80FF00",
   "#66FF00",
   "#4DFF00",
   "#33FF00",
   "#1AFF00",
   "#00FF00"
];

export const negativeGradient = [...positiveGradient].reverse();

Chart.defaults.font.size = 16;
Chart.defaults.font.weight = 'bold';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

export function constructChart(income,expenses){
   let ctx = document.getElementById('incomeExpenseChart').getContext('2d');
   let existingChart = Chart.getChart(ctx);

   if (existingChart) {
      existingChart.destroy();
   }

   let data = {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [income, expenses],
        backgroundColor: ['#07EA3A', 'red'],
      }]
   };


   let incomeExpenseChart = new Chart(ctx, {
      type: 'pie',
      data: data,
   });
}

export function constructCategory(mainOrSub,type,ID,name,current,total){
   let formattedCurrent = current.toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
   let formattedTotal = total.toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
   let mainContainer = document.getElementById(`${type}`);

   let container = document.createElement('div');
   container.id = ID;
   container.className = `${mainOrSub}Category`;
   container.innerHTML = `
      <h3 class = "categoryHeading">${name}</h3>
      <h3 class = "categoryTotal">$${formattedCurrent} / $${formattedTotal}</h3>
      <div class = "progressBar" >
         <div class = "currentProgress" class = '${type}'></div>
      </div>
      <button class = "editCategory">
         <span>
            <i class = "fa-solid fa-pen-to-square"></i> Edit
         </span>
      </button>
   `;
   //Store ID in edit category button for form popup setup
   let editContainer = container.querySelector('.editCategory');

   //Store relevant information for specific category in dataset for efficient input into edit form
   editContainer.onclick = function(event){
      //Update form accordingly given the input
      let editName = document.getElementById('editName');
      let editType = document.getElementById('editType');
      let remove = document.getElementById('remove');

      if(name == 'Income' || name == 'Expenses'){
         //Main types have unique identifier of their type and name
         editName.disabled = editType.disabled = remove.disabled  = true;
      } else{
         editName.disabled = editType.disabled = remove.disabled  = false;
      }
      editName.value = name;
      editType.value = type;

      document.getElementById('editAmount').value = total;
      //Store ID in form dataset to make adjustments on backend
      document.getElementById('editCategoryForm').dataset.identification = ID;

      openPopUp(document.getElementById('editCategoryContainer'));
   }

   let color;
   let colorIndex = 0;
   let fraction = current / total;

   if(positiveGradient.length * fraction >= positiveGradient.length){
      colorIndex = positiveGradient.length - 1;
   } else{
      colorIndex = Math.floor(positiveGradient.length * fraction);
   }

   if(type == 'Income'){
      color = positiveGradient[colorIndex];
   } else{
      color = negativeGradient[colorIndex];
   }

   let containerProgressBar = container.getElementsByClassName('currentProgress')[0];

   let possibleSwap = document.querySelector(`#${ID}`);

   if(!possibleSwap){
      mainContainer.append(container);
   } else{
      //Replace HTML Node for a edit to maintain placement
      mainContainer.replaceChild(container, possibleSwap)
   }


   setTimeout(()=>{
      //Update progress bar during animation for changing progress visuals
      containerProgressBar.style.width = `${Math.ceil(fraction * 100)}%`;
      containerProgressBar.style.backgroundColor = color;
   },50);
}


export async function getBudget(){
   //Hide main tag till fetching user data
   document.body.style.opacity = '0';

   //Reset current HTML and reload data
   document.getElementById('Income').innerHTML = `
      <div class = "addButton">
         <button class = "addCategoryButton" id = "addIncomeCategory" data-type = 'Income'>Add Category</button>
      </div>`;

   document.getElementById('Expenses').innerHTML = `
      <div class = "addButton">
         <button class = "addCategoryButton" id = "addExpensesCategory" data-type = 'Expenses'>Add Category</button>
      </div>`;


   let categoryType = document.getElementById('type');
   let addCategoryContainer = document.getElementById('addCategoryContainer');
   let addCategoryButtons = document.querySelectorAll('.addCategoryButton');

   addCategoryButtons.forEach((button) => {
      button.onclick = function(event){
         categoryType.value = this.dataset.type;
         openPopUp(addCategoryContainer);
      }
   });

   let addCategoryForm = document.getElementById('addCategoryForm');
   let exitAddCategoryIcon = document.getElementById('exitAddCategoryIcon');

   exitAddCategoryIcon.onclick = function(event){
      exitPopUp(addCategoryContainer,addCategoryForm,exitAddCategoryIcon);
      addCategoryButtons[0].disabled = addCategoryButtons[1].disabled = true;
      setTimeout(()=>{
         addCategoryButtons[0].disabled = addCategoryButtons[1].disabled = false;
      },1500);
   }

   try {
      const response = await fetch('../users/getUserBudget', {
        method: "GET",
      });

      let data = await response.json();
      console.log(data);
      //Render object holds all variables essential to constructing front end data

      let formattedDate = data.render.Month.split('-');
      //Assume form YY-MM-DD
      let dateText = document.getElementById('dateText');
      dateText.innerHTML = `Budget for ${formattedDate[1]}/${formattedDate[0]}`;

      //Construct data for income and expenses
      constructCategory('main', 'Income','mainIncome', 'Income', data.render.Income.current, data.render.Income.total);
      constructCategory('main', 'Expenses','mainExpenses', 'Expenses', data.render.Expenses.current, data.render.Expenses.total);

      let categories = data.render.categories;
      let categoriesKeys = Object.keys(categories);

      categoriesKeys.sort(function(a, b) {
         return (categories[a].name).localeCompare(categories[b].name);
       });

       categoriesKeys.forEach((key) => {
         //Construct sub categories
         constructCategory('sub', categories[key].type,key, categories[key].name, categories[key].current, categories[key].total);
       });


      let leftOverSpan = document.getElementById('leftOverSpan');

      //Update summary section
      document.getElementById('incomeSpan').innerHTML = `$` + data.render.Income.current.toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('expensesSpan').innerHTML = `$` + data.render.Expenses.current.toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });

      //Differentiate between positive and negative left over amounts
      if(data.render.leftOver < 0){
         leftOverSpan.style.color = 'red';
         leftOverSpan.innerHTML = `-$` + (data.render.leftOver * -1).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });

      } else{
         leftOverSpan.style.color = '#178eef';
         leftOverSpan.innerHTML = `$` + data.render.leftOver.toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      constructChart(data.render.Income.current, data.render.Expenses.current);
      document.body.style.opacity = '1';

      if(data.render.notify){
         openNotification("fa-solid fa-chart-pie", '<p>Updated budget for the month</p>', 'informational');
      }
    } catch (error) {
      console.log(error);
      constructCategory('main', 'Income','mainIncome', 'Income', 0.00, 0.00);
      constructCategory('main', 'Expenses','mainExpenses', 'Expenses', 0.00, 0.00);
      document.body.style.opacity = '1';
      openNotification("fa-solid fa-triangle-exclamation", '<p>Could not successfully process request</p>', 'errorType');
    }
}
