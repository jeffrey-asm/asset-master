import {openPopUp,openNotification}  from "../../shared/scripts/shared.js";

export function constructAccount(name,type,balance,ID){
   let container = document.createElement('div');
   container.className = 'specificAccountsContainer';
   container.id = ID;

   container.innerHTML = `
      <div class="imageContainer">
         <img src="../resources/accounts/images/${type.toLowerCase()}.png" alt="">
      </div>

      <div class = "accountDetails">
         <h1 class = "accountName">${name}</h1>
         <h3 class = "accountValue" >$${balance.toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
         <button type = 'button' class = 'editAccountButton'><i class = "fa-solid fa-pen-to-square"></i> Edit</button>
      </div>
   `;
   document.getElementById('accounts').append(container);

   let editAccountButton = container.querySelector('.editAccountButton');
   let editAccountContainer = document.getElementById('editAccountContainer');
   let editAccountForm = document.getElementById('editAccountForm');

   editAccountButton.onclick = function(event){
      editAccountForm.querySelector('editName').value = name;
      editAccountForm.querySelector('editType').value = type;
      editAccountForm.querySelector('editBalance').value = balance;
      openPopUp(editAccountContainer);
   }
}

export async function getUserAccounts(){
   let mainTag = document.querySelector('main');
   mainTag.style.opacity = 0;

   try {
      const response = await fetch('../users/getUserAccounts', {
        method: "GET",
      });

      let data = await response.json();
      //Render object holds all variables essential to constructing front end data
      data = data.render;

      console.log(data);


      mainTag.style.opacity = '1';

      let accountKeys = Object.keys(data.accounts);

      for(let i = 0; i < accountKeys.length; i++){
         constructAccount(data.accounts[accountKeys[i]].name, data.accounts[accountKeys[i]].type, data.accounts[accountKeys[i]].balance, data.accounts[accountKeys[i]].ID);
      }

    } catch (error) {
      console.log(error);
      mainTag.style.opacity = '1';
      openNotification("fa-solid fa-triangle-exclamation", '<p>Could not successfully process request</p>', 'errorType');
   }

}