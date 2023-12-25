import {displayMessage,openPopUp,exitPopUp,sendRequest}  from "../../shared/scripts/shared.js";
import { constructCategory } from "./construct.js";

let addCategoryContainer = document.getElementById('addCategoryContainer');
let addCategoryForm = document.getElementById('addCategoryForm');
let categoryType = document.getElementById('type');
let addCategorySubmitButton = document.getElementById('addCategorySubmitButton');
let exitAddCategoryIcon = document.getElementById('exitAddCategoryIcon');

let addCategoryButtons = document.querySelectorAll('.addCategoryButton');

for(let i = 0; i < addCategoryButtons.length; i++){
   addCategoryButtons[i].onclick = function(event){
      categoryType.value = this.dataset.type;
      openPopUp(addCategoryContainer);
   }
}

exitAddCategoryIcon.onclick = function(event){
   addCategoryButtons[0].disabled = addCategoryButtons[1].disabled = true;
   setTimeout(()=>{
      addCategoryButtons[0].disabled = addCategoryButtons[1].disabled = false;
   },1500);
   exitPopUp(addCategoryContainer,addCategoryForm,exitAddCategoryIcon);
}

//Hide main tag till fetching user data
let mainTag = document.getElementsByTagName('main')[0];
// mainTag.style.visibility = 'hidden';

async function getBudget(){
   try {
      const response = await fetch('../users/getUserBudget', {
        method: "GET",
      });

      const data = await response.json();

      console.log(data);

      let formattedDate = data.Month.split('-');
      //Assume form YY-MM-DD
      let dateText = document.getElementById('dateText');
      dateText.innerHTML = `Budget for ${formattedDate[1]}/${formattedDate[0]}`;

      mainTag.style.visibility = 'visible';
      //Construct data for income and expenses
      constructCategory('main', 'Income','mainIncome', 'Income', data.Income.current, data.Income.total);
      let incomeCategories = data.Income.categories;

      for(let i = 0; i < incomeCategories.length;i++){
         //Construct sub categories
         constructCategory('sub', 'Income',incomeCategories[i].ID, incomeCategories[i].name, incomeCategories[i].current, incomeCategories[i].total);
      }

      constructCategory('main', 'Expenses','mainExpenses', 'Expenses', data.Expenses.current, data.Expenses.total);
      let expensesCategories = data.Expenses.categories;

      for(let i = 0; i < expensesCategories.length;i++){
         //Construct sub categories
         constructCategory('sub', 'Expenses',expensesCategories[i].ID, expensesCategories[i].name, expensesCategories[i].current, expensesCategories[i].total);
      }
    } catch (error) {
      console.error(error)
    }
}

getBudget();


addCategoryForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data) => {
      console.log(data);
      displayMessage(document.getElementById('addCategorySubmitButton'),data.message,'informational');

      setTimeout(()=>{
         document.getElementById('exitAddCategoryIcon').click();
         constructCategory('sub', data.render.type,data.render.ID, date.render.name, 0, data.render.amount);
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   const response = await sendRequest('../users/addCategory',structuredFormData,addCategorySubmitButton,'Submit',successFunction,failFunction);
   console.log(response);
}
