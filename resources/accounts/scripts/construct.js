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
      editAccountForm.querySelector('#editName').value = name;
      editAccountForm.querySelector('#editType').value = type;
      editAccountForm.querySelector('#editBalance').value = balance;
      editAccountForm.dataset.identification = ID;
      openPopUp(editAccountContainer);
   }
}

export function constructTransaction(account,title,type,category,date,amount){
   let transactionContainer = document.createElement('tr');
   transactionContainer.className = 'dataRow';

   transactionContainer.innerHTML = `
      <td>Savings Account</td>
      <td>Deposit</td>
      <td>Incomessss</td>
      <td>2023-10-10</td>
      <td>$1200</td>
      <td><i class = "fa-solid fa-pen-to-square editTransaction"></i></td>
   `;
   document.querySelector('table').append(transactionContainer);

   return transactionContainer;
}

export async function getUserAccounts(){
   let mainTag = document.querySelector('main');
   mainTag.style.opacity = 0;

   try {
      const response = await fetch('../users/getUserAccounts', {
        method: "GET",
      });

      let data = await response.json();
      console.log(data);
      //Render object holds all variables essential to constructing front end data
      mainTag.style.opacity = '1';

      let accountKeys = Object.keys(data.render.accounts);
      let accountFormOptions = ``;


      for(let i = 0; i < accountKeys.length; i++){
         constructAccount(data.render.accounts[accountKeys[i]].name, data.render.accounts[accountKeys[i]].type, data.render.accounts[accountKeys[i]].balance, accountKeys[i]);
         accountFormOptions += `<option value = ${accountKeys[i]}>${data.render.accounts[accountKeys[i]].name}</option>`;
      }

      if(data.render.netWorth < 0) {
         document.getElementById('netWorthText').innerHTML =
         `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(data.render.netWorth)*-1).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
      } else{
         document.getElementById('netWorthText').innerHTML =
         `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(data.render.netWorth).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
      }

      //Work on transactions
      console.log(accountFormOptions);
      let categoryOptions = `<option value = 'Income'>Income</option>`;

      let incomeCategories = Object.keys(data.render.budget['Income'].categories);
      for(let i = 0; i < incomeCategories.length; i++){
         //Option contains value of ID and text of actual name
         categoryOptions += `<option value = ${incomeCategories[i]}>Income - ${data.render.budget['Income'].categories[incomeCategories[i]].name}</option>`;
      }

      let expensesCategories = Object.keys(data.render.budget['Expenses'].categories);
      categoryOptions +=  `<option value = 'Expenses'>Expenses</option>`;
      for(let i = 0; i < expensesCategories.length; i++){
         //Option contains value of ID and text of actual name
         categoryOptions += `<option value = ${incomeCategories[i]}>Expenses - ${data.render.budget['Expenses'].categories[expensesCategories[i]].name}</option>`;
      }

      let transactionKeys = Object.keys(data.render.transactions);

      for(let i = 0; i < expensesCategories.length; i++){
         let incomeOrExpense;

         let transactionType = data.render.transactions[transactionKeys[i]].type;
         let possibleCategory = data.render.transactions[transactionKeys[i]].categoryID;



         //Must reduce later
         constructAccount(
            data.render.transactions[transactionKeys[i]].account,
            data.render.transactions[transactionKeys[i]].name,
            data.render.transactions[transactionKeys[i]].type,
            data.render.budget[data.render.transactions[transactionKeys[i]].type].categories[transactionKeys[i]].name,
            data.render.transactions[transactionKeys[i]].balance,
            transactionKeys[i]);



      }

    } catch (error) {
      console.log(error);
      mainTag.style.opacity = '1';
      openNotification("fa-solid fa-triangle-exclamation", '<p>Could not successfully process request</p>', 'errorType');
   }

}