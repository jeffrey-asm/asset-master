import {displayMessage,openPopUp,exitPopUp,sendRequest}  from "../../shared/scripts/shared.js";
import { constructCategory,getBudget } from "./construct.js";

let addCategoryContainer = document.getElementById('addCategoryContainer');
let addCategoryForm = document.getElementById('addCategoryForm');
let categoryType = document.getElementById('type');
let addCategorySubmitButton = document.getElementById('addCategorySubmitButton');
let exitAddCategoryIcon = document.getElementById('exitAddCategoryIcon');
let addCategoryButtons = document.querySelectorAll('.addCategoryButton');

let editCategoryContainer = document.getElementById('editCategoryContainer');
let editCategoryForm = document.getElementById('editCategoryForm');
let editCategorySubmitButton = document.getElementById('editCategorySubmitButton');
let exitEditCategoryIcon = document.getElementById('exitEditCategoryIcon');

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

exitEditCategoryIcon.onclick = function(event){
   let editButtons = document.body.querySelectorAll('.editCategory');

   for(let i = 0; i < editButtons.length; i++){
      editButtons[i].disabled = true;
   }

   setTimeout(()=>{
      for(let i = 0; i < editButtons.length; i++){
         editButtons[i].disabled = false;
      }
   },1500);

   exitPopUp(editCategoryContainer,editCategoryForm,exitEditCategoryIcon);
}

getBudget();


addCategoryForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitAddCategoryIcon').click();
         constructCategory('sub', data.render.type,data.render.ID, data.render.name, 0, data.render.amount);
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/addCategory',structuredFormData,addCategorySubmitButton,'Submit',successFunction,failFunction);
}

editCategoryForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitEditCategoryIcon').click();
      },1100);
   }

   let failFunction =  () => {

   };

   let formData = new FormData(this);
   //Set name since it could be disabled for main types
   formData.set('name',document.getElementById('editName').value);
   //mainIncome or mainExpenses should be the dataset ID variable for current form
   formData.set('ID', (this.dataset.identification));
   formData.set('remove', document.getElementById('remove').checked);

   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/updateCategory',structuredFormData,editCategorySubmitButton,'Submit',successFunction,failFunction);
}