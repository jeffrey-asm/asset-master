import {openNotification,exitPopUp,sendRequest}  from "../../shared/scripts/shared.js";
import { constructCategory,getBudget } from "./construct.js";

let addCategoryForm = document.getElementById('addCategoryForm');
let addCategorySubmitButton = document.getElementById('addCategorySubmitButton');

let editCategoryContainer = document.getElementById('editCategoryContainer');
let editCategoryForm = document.getElementById('editCategoryForm');
let editCategorySubmitButton = document.getElementById('editCategorySubmitButton');
let exitEditCategoryIcon = document.getElementById('exitEditCategoryIcon');

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

   await sendRequest('./addCategory',structuredFormData,addCategorySubmitButton,'Submit',successFunction,failFunction);
}

editCategoryForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitEditCategoryIcon').click();
         if(data.render.changes){

            if(data.render.mainOrSub == 'reload'){
               let mainTag = document.querySelector('main');

               getBudget();
            } else{
                //Only update current category if changes were made on backend signaled by type(main or sub)
               document.getElementById(data.render.ID).remove();

               if(data.render.remove == "false"){
                  constructCategory(data.render.mainOrSub, data.render.type,data.render.ID, data.render.name, data.render.current, data.render.total);
               }
            }
         }
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   //Set name since it could be disabled for main types
   formData.set('name',document.getElementById('editName').value);
   //mainIncome or mainExpenses should be the dataset ID variable for current form
   formData.set('ID', (this.dataset.identification));
   formData.set('type', document.getElementById('editType').value);
   formData.set('remove', document.getElementById('remove').checked);

   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('./updateCategory',structuredFormData,editCategorySubmitButton,'Submit',successFunction,failFunction);
}
