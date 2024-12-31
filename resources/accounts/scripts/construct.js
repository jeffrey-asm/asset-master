import { openPopUp, openNotification }  from "../../shared/scripts/shared.js";

export function constructAccount(name, type, balance, ID) {
   const container = document.createElement("div");
   container.className = "accountContainer";
   container.id = ID;

   // Store name in dataset to grab value for transaction table
   container.dataset.name = name;

   const accountValueType = (type == "Loan" || type == "Credit Card") ? "debt" : "standard";

   container.innerHTML = `
      <div class = "accountDetails">
         <h1 class = "accountName">${name}</h1>
         <h3 class = 'accountValue ${accountValueType}' >$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
      </div>
   `;

   container.style.backgroundImage = `linear-gradient(rgba(0,0,0,var(--bg-filter-opacity)),rgba(0,0,0,var(--bg-filter-opacity))),url( '../resources/accounts/images/${type.toLowerCase()}.png')`;

   const accountsContainer = document.getElementById("accounts");
   if (document.querySelectorAll(".accountContainer").length == 0) {
      // Remove no accounts message
      accountsContainer.innerHTML = "";
   }

   // Add to account options in transaction form to the top
   document.getElementById("account").innerHTML = `<option value = ${ID}>${name}</option>` + document.getElementById("account").innerHTML;
   document.getElementById("editAccount").innerHTML = `<option value = ${ID}>${name}</option>` + document.getElementById("editAccount").innerHTML;

   const possibleSwap = document.querySelector(`#accounts #${ID}`);

   if (!possibleSwap) {
      accountsContainer.append(container);
   } else {
      // Replace HTML Node for a edit to maintain placement
      accountsContainer.replaceChild(container, possibleSwap);
   }

   const editAccountContainer = document.getElementById("editAccountContainer");
   const editAccountForm = document.getElementById("editAccountForm");

   container.onclick = function() {
      editAccountForm.querySelector("#editName").value = name;
      editAccountForm.querySelector("#editType").value = type;
      editAccountForm.querySelector("#editBalance").value = balance;
      editAccountForm.dataset.identification = ID;
      openPopUp(editAccountContainer);
   };
}

function insertTransactionByDate(container) {
   const mainContainer = document.querySelector("tbody");
   const possibleTransactions = mainContainer.querySelectorAll("tr");
   let found = false;

   possibleTransactions.forEach((transaction) => {
      if (parseInt(container.dataset.date) > parseInt(transaction.dataset.date)) {
         // Date in in form Date.getTime()
         if (!found) {
            mainContainer.insertBefore(container, transaction);
            found = true;
         }
      }
   });

   // Simply append oldest date to table
   if (!found) {
      mainContainer.append(container);
   }
}

export function constructTransaction(accountID, title, type, categoryID, date, amount, ID) {
   const currentAmountFixed = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

   const transactionContainer = document.createElement("tr");
   transactionContainer.className = "transactionRow addedTransaction";
   transactionContainer.id = ID;

   let accountName = "";

   if (accountID != null && accountID != "") {
      accountName = document.getElementById(accountID).dataset.name;
   } else {
      accountID = "";
   }

   const categoryName = document.querySelector(`option[value="${categoryID}"]`).innerHTML;

   const formattedDate = date.split("-");
   // Assume form YY-MM-DD
   const dateText = `${formattedDate[0]}-${formattedDate[1]}-${formattedDate[2].substr(0, 2)}`;
   // Store for insertion
   const transactionDate = new Date(date);
   transactionDate.setUTCDate(transactionDate.getUTCDate() - 1);
   transactionContainer.dataset.date = transactionDate.getTime();
   transactionContainer.dataset.account = accountID;

   transactionContainer.innerHTML = `
      <td class = 'column1'>${dateText}</td>
      <td class = 'column2 accountNameLink'>${accountName}</td>
      <td class = 'column3'>${title}</td>
      <td class = 'column4'>${categoryName}</td>
      <td class = 'column5 ${type}'>$${currentAmountFixed}</td>
      <td class = 'column6'>
         <button class = "editTransactionIcon">
            <span>
               <i class = "fa-solid fa-pen-to-square"></i>
            </span>
         </button>
      </td>
   `;

   const possibleSwap = document.querySelector(`tr#${ID}`);

   if (possibleSwap) {
      // Must always re-adjust date insertion
      possibleSwap.remove();
   }

   const noTransactionCheck = document.querySelector(".no-transaction");

   if (noTransactionCheck) {
      // Remove no transaction message
      noTransactionCheck.remove();
   }

   insertTransactionByDate(transactionContainer);

   const editTransactionContainer = document.getElementById("editTransactionContainer");
   const editTransactionForm = document.getElementById("editTransactionForm");
   const editTransactionButton =  transactionContainer.querySelector(".editTransactionIcon");

   editTransactionButton.onclick = function() {
      editTransactionForm.querySelector("#editAccount").value = transactionContainer.dataset.account;
      editTransactionForm.querySelector("#editTitle").value = title;
      editTransactionForm.querySelector("#editCategory").value = categoryID;
      editTransactionForm.querySelector("#editDate").value = dateText;
      editTransactionForm.querySelector("#editAmount").value = amount;
      editTransactionForm.dataset.identification = ID;
      openPopUp(editTransactionContainer);
   };

   if (transactionContainer.dataset.account != "") {
      const accountNameLink = transactionContainer.querySelector(".accountNameLink");
      const accountContainer = document.querySelector(`#accounts #${transactionContainer.dataset.account}`);

      accountNameLink.style.cursor = "pointer";
      accountNameLink.style.color = "#178eef";

      accountNameLink.onclick = function() {
         accountContainer.scrollIntoView({ behavior:"smooth" });
         accountContainer.classList.add("highlighted");

         const removeHighlightOnHover = () => {
            accountContainer.classList.remove("highlighted");
         };

         accountContainer.addEventListener("mouseover", removeHighlightOnHover);

         setTimeout(() => {
            accountContainer.classList.remove("highlighted");
            accountContainer.removeEventListener("mouseover", removeHighlightOnHover);
         }, 5000);
      };
   }

   return transactionContainer;
}

export async function getUserData() {;
   try {
      const response = await fetch("../users/getUserAccounts", {
         method: "GET"
      });

      const data = await response.json();
      // Render object holds all variables essential to constructing front end data
      const accountKeys = Object.keys(data.render.accounts);

      if (accountKeys.length == 0) {
         // Show no accounts available
         document.getElementById("accounts").innerHTML = "<h2>No accounts available</h2>";
      }

      accountKeys.forEach((key) => {
         constructAccount(data.render.accounts[key].name, data.render.accounts[key].type, data.render.accounts[key].balance, key);
      });

      // Empty option
      document.getElementById("account").innerHTML += "<option value =''></option>";
      document.getElementById("editAccount").innerHTML += "<option value =''></option>";;

      if (data.render.netWorth < 0) {
         document.getElementById("netWorthText").innerHTML =
         `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(data.render.netWorth) * -1).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
      } else {
         document.getElementById("netWorthText").innerHTML =
         `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(data.render.netWorth).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
      }

      // Work on transactions
      let categoryOptions = "<option data-type = 'Income' value = 'Income'>Income</option>";

      const categories = data.render.budget.categories;
      const categoriesKeys = Object.keys(categories);

      categoriesKeys.sort(function(a, b) {
         return categories[b].type.localeCompare(categories[a].type);
      });

      let expensesShown = false;

      categoriesKeys.forEach((key) => {
         // Option contains value of ID and   text of actual name
         if (categories[key].type != "Income" && !expensesShown) {
            // Sorted by Income -> Expenses
            categoryOptions +=  "<option data-type = 'Expenses' value = 'Expenses'>Expenses</option>";
            expensesShown = true;
         }

         categoryOptions += `<option data-type = '${categories[key].type}' value = ${key}>${categories[key].name}</option>`;
      });

      if (!expensesShown) {
         // Case of no expenses categories
         categoryOptions +=  "<option data-type = 'Expenses' value = 'Expenses'>Expenses</option>";
      }

      document.getElementById("category").innerHTML = document.getElementById("editCategory").innerHTML = categoryOptions;

      const transactionKeys = Object.keys(data.render.transactions);

      transactionKeys.forEach((key) => {
         const currentTransaction = data.render.transactions[key];
         constructTransaction(currentTransaction.accountID, currentTransaction.title, currentTransaction.type, currentTransaction.categoryID, currentTransaction.date, currentTransaction.amount, key);
      });

      if (transactionKeys.length == 0) {
         document.querySelector("tbody").innerHTML = "<tr class = \"no-transaction\"><td>No transactions available</td></tr>";
      }

      document.body.style.opacity = "1";
   } catch (error) {
      console.log(error);
      document.body.style.opacity = "1";
      openNotification("fa-solid fa-triangle-exclamation", "<p>Could not successfully process request</p>", "errorType");
   }

}