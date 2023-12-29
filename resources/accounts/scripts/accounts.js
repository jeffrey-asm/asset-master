import {openPopUp,exitPopUp,sendRequest,openNotification}  from "../../shared/scripts/shared.js";
import {constructAccount,getUserAccounts} from "./construct.js";

let addAccountButton = document.getElementById('addAccountButton');
let addAccountContainer = document.getElementById('addAccountContainer');
let addAccountForm = document.getElementById('addAccountForm');
let addAccountSubmitButton = document.getElementById('addAccountSubmitButton');
let exitAddAccountIcon = document.getElementById('exitAddAccountIcon');

let editAccountContainer = document.getElementById('editAccountContainer');
let editAccountForm = document.getElementById('editAccountForm');
let editAccountSubmitButton = document.getElementById('editAccountSubmitButton');
let exitEditAccountIcon = document.getElementById('exitEditAccountIcon');

addAccountButton.onclick = function(event){
   openPopUp(addAccountContainer);
}

exitAddAccountIcon.onclick = function(event){
   exitPopUp(addAccountContainer,addAccountForm,exitAddAccountIcon,addAccountButton);
}

exitEditAccountIcon.onclick = function(event){
   exitPopUp(editAccountContainer,addAccountForm,exitEditAccountIcon);

   let editAccountButtons = document.querySelectorAll('.editAccountButton');

   for(let i = 0; i < editAccountButtons.length; i++){
      editAccountButtons[i].disabled = true;
   }

   setTimeout(()=>{
      for(let i = 0; i < editAccountButtons.length; i++){
         editAccountButtons[i].disabled = false;
      }
   },1500);
}


getUserAccounts();

addAccountForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitAddAccountIcon').click();
         constructAccount(data.render.name, data.render.type,data.render.balance,data.render.ID);

         if(data.render.netWorth < 0) {
            document.getElementById('netWorthText').innerHTML =
            `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(data.render.netWorth)*-1).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
         } else{
            document.getElementById('netWorthText').innerHTML =
            `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(data.render.netWorth).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
         }
      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/addAccount',structuredFormData,addAccountSubmitButton,'Submit',successFunction,failFunction);
}


editAccountForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitEditAccountIcon').click();

         if(data.render.changes){
            //Always remove node, and reconstruct for non-removing account
            document.getElementById(data.render.ID).remove();

            if(!data.render.remove){
               constructAccount(data.render.name,data.render.type,data.render.balance,data.render.ID);
            }

            if(data.render.netWorth < 0) {
               document.getElementById('netWorthText').innerHTML =
               `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(data.render.netWorth)*-1).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
            } else{
               document.getElementById('netWorthText').innerHTML =
               `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(data.render.netWorth).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
            }
         }

      },1100);

   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   formData.set('name',document.getElementById('editName').value);
   formData.set('ID', (this.dataset.identification));
   formData.set('type', document.getElementById('editType').value);
   formData.set('balance', document.getElementById('editBalance').value);
   formData.set('remove', document.getElementById('remove').checked);

   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/editAccount',structuredFormData,editAccountSubmitButton,'Submit',successFunction,failFunction);
}

let addTransactionContainer = document.getElementById('addTransactionContainer');
let addTransactionForm = document.getElementById('addTransactionForm');
let addTransactionSubmitButton = document.getElementById('addTransactionButton');
let exitEditAccountIcon = document.getElementById('exitEditAccountIcon');
let addTransactionButton = document.getElementById('addTransactionButton');

addTransactionButton.onclick = function(event){
   openPopUp(addTransactionContainer);
}

exitEditAccountIcon.onclick = function(event){
   exitPopUp(editAccountContainer,addAccountForm,exitEditAccountIcon);

   let editTransactionIcons = document.querySelectorAll('.editTransaction');

   for(let i = 0; i < editTransactionIcons.length; i++){
      editTransactionIcons[i].disabled = true;
   }

   setTimeout(()=>{
      for(let i = 0; i < editTransactionIcons.length; i++){
         editTransactionIcons[i].disabled = false;
      }
   },1500);
}

addTransactionForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitEditAccountIcon').click();

      },1100);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/addTransaction',structuredFormData,addTransactionSubmitButton,'Submit',successFunction,failFunction);
}