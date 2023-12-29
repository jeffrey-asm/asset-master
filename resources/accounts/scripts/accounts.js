import {openPopUp,exitPopUp,sendRequest,openNotification}  from "../../shared/scripts/shared.js";
import {constructAccount,getUserAccounts} from "./construct.js";

let addAccountButton = document.getElementById('addAccountButton');
let addAccountContainer = document.getElementById('addAccountContainer');
let addAccountForm = document.getElementById('addAccountForm');
let addAccountSubmitButton = document.getElementById('addAccountSubmitButton');
let exitAddAccountIcon = document.getElementById('exitAddAccountIcon');

addAccountButton.onclick = function(event){
   openPopUp(addAccountContainer);
}

exitAddAccountIcon.onclick = function(event){
   exitPopUp(addAccountContainer,addAccountForm,exitAddAccountIcon,addAccountButton);
}

getUserAccounts();

addAccountForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      document.getElementById('exitAddAccountIcon').click();
      constructAccount(data.render.name, data.render.type,data.render.balance,data.render.ID);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('../users/addAccount',structuredFormData,addAccountSubmitButton,'Submit',successFunction,failFunction);
}