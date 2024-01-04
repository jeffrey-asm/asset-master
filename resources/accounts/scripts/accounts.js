import {openPopUp,exitPopUp,sendRequest,openNotification}  from "../../shared/scripts/shared.js";
import {constructAccount,getUserData} from "./construct.js";

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


getUserData();

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

      //Add options for new account to transaction form
      document.getElementById('account').innerHTML = `<option value ='${data.render.ID}'>${data.render.name}</option>` + document.getElementById('account').innerHTML;
      document.getElementById('editAccount').innerHTML = `<option value ='${data.render.ID}'>${data.render.name}</option>` + document.getElementById('editAccount').innerHTML;

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
            if(!data.render.remove){
               constructAccount(data.render.name,data.render.type,data.render.balance,data.render.ID);

               let possibleTransactions = document.querySelectorAll(`.transaction[data-account="${data.render.ID}"]`);

               for(let i = 0; i < possibleTransactions.length; i++){
                  //Update names if applicable!
                  let accountNameLink = possibleTransactions[i].querySelector('.accountNameLink');
                  accountNameLink.innerHTML = data.render.name;
                  accountNameLink.onclick = function(event){
                     let accountContainer = document.querySelector(`#accounts #${data.render.ID}`);
                     accountContainer.scrollIntoView({behavior:'smooth'});
                     accountContainer.classList.add('highlighted');
                     setTimeout(()=>{
                        accountContainer.classList.remove('highlighted');
                     },5000);
                  }
               }
            } else{
               document.querySelector(`#accounts #${data.render.ID}`).remove()

               //In case a remove leads to no accounts
               let accountsContainer = document.getElementById('accounts');
               if(document.querySelectorAll('.specificAccountsContainer').length == 0) {
                  accountsContainer.innerHTML = '<h2>No accounts available</h2>';
               }

               //Remove options in transaction form
               document.querySelectorAll(`option[value="${data.render.ID}"]`).forEach((option)=>{
                  option.remove();
               });

               let possibleTransactions = document.querySelectorAll(`.transaction[data-account="${data.render.ID}"]`);

               for(let i = 0; i < possibleTransactions.length; i++){
                  //Reset account ID for transaction
                  let accountNameLink = possibleTransactions[i].querySelector('.accountNameLink');
                  accountNameLink.innerHTML = '';
                  accountNameLink.style.cursor = 'none';
                  accountNameLink.style.color = 'initial';
                  accountNameLink.onclick = null;
                  possibleTransactions[i].dataset.accountID = '';
               }
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

document.querySelector('.testAdd').onclick = function(event){
   let test = document.createElement('tr');
   test.innerHTML = `<tr>
   <td  class = 'accountNameLink'>Test</td>
   <td>Title</td>
   <td>categoryName</td>
   <td>2024-01-01</td>
   <td class = 'Income'>$900.00</td>
   <td><i class="fas fa-pen-to-square"></i></td>
</tr>`
   document.querySelector('table tbody tr:last-child td:first-child').classList.remove('roundedLeftBottom');
   document.querySelector('table tbody tr:last-child td:last-child').classList.remove('roundedRightBottom');
   document.querySelector('table tbody').append(test);
   document.querySelector('table tbody tr:last-child td:first-child').classList.add('roundedLeftBottom');
   document.querySelector('table tbody tr:last-child td:last-child').classList.add('roundedRightBottom');
}