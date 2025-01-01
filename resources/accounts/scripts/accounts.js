import { openPopUp, exitPopUp, sendRequest }  from "../../shared/scripts/shared.js";
import { constructAccount, getUserData } from "./construct.js";

const addAccountButton = document.getElementById("addAccountButton");
const addAccountContainer = document.getElementById("addAccountContainer");
const addAccountForm = document.getElementById("addAccountForm");
const addAccountSubmitButton = document.getElementById("addAccountSubmitButton");
const exitAddAccountIcon = document.getElementById("exitAddAccountIcon");

const editAccountContainer = document.getElementById("editAccountContainer");
const editAccountForm = document.getElementById("editAccountForm");
const editAccountSubmitButton = document.getElementById("editAccountSubmitButton");
const exitEditAccountIcon = document.getElementById("exitEditAccountIcon");

addAccountButton.onclick = function() {
   openPopUp(addAccountContainer);
};

exitAddAccountIcon.onclick = function() {
   exitPopUp(addAccountContainer, addAccountForm, exitAddAccountIcon, addAccountButton);
   disabledAddButton();

   addAccountButton.disabled = true;
   setTimeout(() => {
      addAccountButton.disabled = false;
   }, 1500);
};

exitEditAccountIcon.onclick = function() {
   exitPopUp(editAccountContainer, addAccountForm, exitEditAccountIcon);
};

getUserData();

function disabledAddButton() {
   addAccountButton.disabled = true;

   setTimeout(() => {
      addAccountButton.disabled = false;
   }, 1500);
}

addAccountForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = (data) => {
      setTimeout(() => {
         document.getElementById("exitAddAccountIcon").click();
         constructAccount(data.data.name, data.data.type, data.data.balance, data.data.ID);

         if (data.data.netWorth < 0) {
            document.getElementById("netWorthText").innerHTML =
            `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(data.data.netWorth) * -1).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
         } else {
            document.getElementById("netWorthText").innerHTML =
            `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(data.data.netWorth).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
         }
      }, 1100);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("../users/addAccount", structuredFormData, addAccountSubmitButton, "Submit", successFunction, failFunction);
};

editAccountForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = (data) => {
      setTimeout(() => {
         document.getElementById("exitEditAccountIcon").click();

         if (data.data.changes) {
            // Remove options in transaction form for upcoming changes
            document.querySelectorAll(`option[value="${data.data.ID}"]`).forEach((option) => {
               option.remove();
            });

            if (!data.data.remove) {
               constructAccount(data.data.name, data.data.type, data.data.balance, data.data.ID);

               const possibleTransactions = document.querySelectorAll(`.transactionRow[data-account="${data.data.ID}"]`);

               possibleTransactions.forEach((transaction) => {
                  // Update names if applicable!
                  const accountNameLink = transaction.querySelector(".accountNameLink");
                  accountNameLink.innerHTML = data.data.name;
                  accountNameLink.onclick = function() {
                     const accountContainer = document.querySelector(`#accounts #${data.data.ID}`);
                     accountContainer.scrollIntoView({ behavior:"smooth" });
                     accountContainer.classList.add("highlighted");
                     setTimeout(() => {
                        accountContainer.classList.remove("highlighted");
                     }, 5000);
                  };
               });
            } else {
               const accountContainer = document.querySelector(`.accountContainer#${data.data.ID}`);
               accountContainer.style.animation = "fadeOut 2s ease-in-out forwards";

               setTimeout(() => {
                  accountContainer.remove();

                  // In case a remove leads to no accounts
                  const accountsContainer = document.getElementById("accounts");

                  if (document.querySelectorAll(".accountContainer").length == 0) {
                     accountsContainer.innerHTML = "<h2>No accounts available</h2>";
                  }

               }, 1600);

               const possibleTransactions = document.querySelectorAll(`.transactionRow[data-account="${data.data.ID}"]`);

               possibleTransactions.forEach((transaction) => {
                  // Reset account ID for transaction
                  const accountNameLink = transaction.querySelector(".accountNameLink");
                  accountNameLink.innerHTML = "";
                  accountNameLink.style.cursor = "none";
                  accountNameLink.style.color = "initial";
                  accountNameLink.onclick = null;
                  transaction.dataset.accountID = "";
               });
            }

            if (data.data.netWorth < 0) {
               document.getElementById("netWorthText").innerHTML =
               `Net Worth: <span class = 'negativeNetWorth'>-$${(parseFloat(data.data.netWorth) * -1).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
            } else {
               document.getElementById("netWorthText").innerHTML =
               `Net Worth: <span class = 'positiveNetWorth'>$${parseFloat(data.data.netWorth).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
            }
         }

      }, 1100);

   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   formData.set("name", document.getElementById("editName").value);
   formData.set("ID", (this.dataset.identification));
   formData.set("type", document.getElementById("editType").value);
   formData.set("balance", document.getElementById("editBalance").value);
   formData.set("remove", document.getElementById("remove").checked);

   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("../users/editAccount", structuredFormData, editAccountSubmitButton, "Submit", successFunction, failFunction);
};