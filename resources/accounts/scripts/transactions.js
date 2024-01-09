import {openPopUp,exitPopUp,sendRequest}  from "../../shared/scripts/shared.js";
import {constructTransaction} from "./construct.js";

let addTransactionContainer = document.getElementById('addTransactionContainer');
let addTransactionForm = document.getElementById('addTransactionForm');
let addTransactionSubmitButton = document.getElementById('addTransactionSubmitButton');
let exitAddTransactionIcon = document.getElementById('exitAddTransactionIcon');
let addTransactionButton = document.getElementById('addTransactionButton');

let editTransactionContainer = document.getElementById('editTransactionContainer');
let editTransactionForm = document.getElementById('editTransactionForm');
let editTransactionSubmitButton = document.getElementById('editTransactionSubmitButton');
let exitEditTransactionIcon = document.getElementById('exitEditTransactionIcon');

addTransactionButton.onclick = function(event){
   openPopUp(addTransactionContainer);
}

exitAddTransactionIcon.onclick = function(event){
   exitPopUp(addTransactionContainer,addTransactionForm,exitAddTransactionIcon,addTransactionButton);
}

exitEditTransactionIcon.onclick = function(event){
   exitPopUp(editTransactionContainer,editTransactionForm,exitEditTransactionIcon);
   disableEditButtons();
}

function disableEditButtons(){
   let editTransactionButtons = document.querySelectorAll('.editTransactionIcon');

   editTransactionButtons.forEach((editButton)=>{
      editButton.disabled = true;
   });

   setTimeout(()=>{
      editTransactionButtons.forEach((editButton)=>{
         editButton.disabled = false;
      });
   },1500);
}


addTransactionForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitAddTransactionIcon').click();
         constructTransaction(data.render.account,data.render.title,data.render.type,data.render.category,data.render.date,data.render.amount,data.render.ID);
         disableEditButtons();
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   //Select options hold possible ID's
   formData.set('type', (document.getElementById('category').querySelector('option:checked').dataset.type));
   formData.set('date', (document.getElementById('date').value));

   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/addTransaction',structuredFormData,addTransactionSubmitButton,'Submit',successFunction,failFunction);
}

editTransactionForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitEditTransactionIcon').click();

         if(data.render.remove == true){
            let transaction = document.querySelector(`.transactionRow#${data.render.ID}`);
            transaction.classList.add('removedTransaction');

            setTimeout(()=>{
               transaction.remove();

               let possibleTransaction = document.querySelector('tbody .transactionRow');

               if(!possibleTransaction){
                  //Must have removed only transaction on table
                  document.querySelector('tbody').innerHTML = '<tr class = "no-transaction"><td colspan = "6">No transactions available</td></tr>';
               }

            },500);


         } else if(data.render.changes){
            //Edit instance in current table
            constructTransaction(data.render.account,data.render.title,data.render.type,data.render.category,data.render.date,data.render.amount,data.render.ID);
            disableEditButtons();
         }
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   //Select options hold possible ID's
   formData.set('type', (document.getElementById('editCategory').querySelector('option:checked').dataset.type));
   formData.set('date', (document.getElementById('editDate').value));
   formData.set('ID', (this.dataset.identification));
   formData.set('remove', document.getElementById('removeTransaction').checked);

   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/editTransaction',structuredFormData,editTransactionSubmitButton,'Submit',successFunction,failFunction);
}

