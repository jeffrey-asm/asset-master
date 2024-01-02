import {openPopUp,exitPopUp,sendRequest}  from "../../shared/scripts/shared.js";
import {constructTransaction} from "./construct.js";

let addTransactionContainer = document.getElementById('addTransactionContainer');
let addTransactionForm = document.getElementById('addTransactionForm');
let addTransactionSubmitButton = document.getElementById('addTransactionSubmitButton');
let exitAddTransactionIcon = document.getElementById('exitAddTransactionIcon');
let addTransactionButton = document.getElementById('addTransactionButton');

addTransactionButton.onclick = function(event){
   openPopUp(addTransactionContainer);
}

exitAddTransactionIcon.onclick = function(event){
   exitPopUp(addTransactionContainer,addTransactionForm,exitAddTransactionIcon,addTransactionButton);
}

addTransactionForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitAddTransactionIcon').click();
         constructTransaction(data.render.account,data.render.title,data.render.type,data.render.category,data.render.date,data.render.amount,data.render.ID);
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   //Select options hold possible ID's
   formData.set('type', (document.getElementById('category').querySelector('option:checked').dataset.type));
   formData.set('date', (document.getElementById('date').value));

   let structuredFormData = new URLSearchParams(formData).toString();

   console.log(addTransactionSubmitButton);

   await sendRequest('../users/addTransaction',structuredFormData,addTransactionSubmitButton,'Submit',successFunction,failFunction);
}

//document.querySelector(`#transactionsData #${data.render.ID}`).remove()