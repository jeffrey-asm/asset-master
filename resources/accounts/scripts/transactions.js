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
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   //Select options hold possible ID's
   formData.set('CategoryID', (document.getElementById('category').value));
   formData.set('AccountID', (document.getElementById('account').value));
   formData.set('type', (document.getElementById('category').querySelector('option:checked').dataset.type));


   let structuredFormData = new URLSearchParams(formData).toString();

   console.log(addTransactionSubmitButton);

   await sendRequest('../users/addTransaction',structuredFormData,addTransactionSubmitButton,'Submit',successFunction,failFunction);
}