import {openPopUp}  from "../../shared/scripts/shared.js";

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

export function constructCategory(mainOrSub,type,ID,name,current,total){
   let formattedCurrent = parseFloat(current).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
   let formattedTotal = parseFloat(total).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
   let mainContainer = document.getElementById(`${type}`);

   let container = document.createElement('div');
   container.id = ID;
   container.className = `${mainOrSub}Category`;
   container.innerHTML = `
      <h2 class = "categoryHeading">${name}</h2>
      <h3 class = "categoryTotal">$${formattedCurrent}/ $${formattedTotal}</h3>
      <div class = "progressBar">
         <div class = "currentProgress"></div>
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
   mainContainer.append(container);

   setTimeout(()=>{
      //Update progress bar during animation for changing progress visuals
      containerProgressBar.style.width = `${Math.ceil(fraction * 100)}%`;
      containerProgressBar.style.backgroundColor = color;
   },50);
}


export async function getBudget(){
   //Hide main tag till fetching user data
   let mainTag = document.getElementsByTagName('main')[0];

   try {
      const response = await fetch('../users/getUserBudget', {
        method: "GET",
      });

      let data = await response.json();
      //Render object holds all variables essential to constructing front end data
      data = data.render;

      let formattedDate = data.Month.split('-');
      //Assume form YY-MM-DD
      let dateText = document.getElementById('dateText');
      dateText.innerHTML = `Budget for ${formattedDate[1]}/${formattedDate[0]}`;


      mainTag.style.opacity = '1';
      //Construct data for income and expenses
      constructCategory('main', 'Income','mainIncome', 'Income', data.Income.current, data.Income.total);
      let incomeCategories = data.Income.categories;
      let incomeKeys = Object.keys(data.Income.categories);

      for(let i = 0; i < incomeKeys.length;i++){
         //Construct sub categories
         constructCategory('sub', 'Income',incomeKeys[i], incomeCategories[incomeKeys[i]].name, incomeCategories[incomeKeys[i]].current, incomeCategories[incomeKeys[i]].total);
      }

      constructCategory('main', 'Expenses','mainExpenses', 'Expenses', data.Expenses.current, data.Expenses.total);
      let expensesCategories = data.Expenses.categories;
      let expensesKeys = Object.keys(data.Expenses.categories);

      for(let i = 0; i < expensesKeys.length;i++){
         //Construct sub categories
         constructCategory('sub', 'Expenses',expensesKeys[i], expensesCategories[expensesKeys[i]].name, expensesCategories[expensesKeys[i]].current, expensesCategories[expensesKeys[i]].total);
      }
    } catch (error) {
      console.error(error)
    }
}


export function updateCategory(){
   // Implement later
}
