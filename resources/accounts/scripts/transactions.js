import { openPopUp, exitPopUp, sendRequest }  from "../../shared/scripts/shared.js";
import { constructTransaction } from "./construct.js";

const addTransactionContainer = document.getElementById("addTransactionContainer");
const addTransactionForm = document.getElementById("addTransactionForm");
const addTransactionSubmitButton = document.getElementById("addTransactionSubmitButton");
const exitAddTransactionIcon = document.getElementById("exitAddTransactionIcon");
const addTransactionButton = document.getElementById("addTransactionButton");

const editTransactionContainer = document.getElementById("editTransactionContainer");
const editTransactionForm = document.getElementById("editTransactionForm");
const editTransactionSubmitButton = document.getElementById("editTransactionSubmitButton");
const exitEditTransactionIcon = document.getElementById("exitEditTransactionIcon");

addTransactionButton.onclick = function() {
   openPopUp(addTransactionContainer);
};

exitAddTransactionIcon.onclick = function() {
   exitPopUp(addTransactionContainer, addTransactionForm, exitAddTransactionIcon, addTransactionButton);
};

exitEditTransactionIcon.onclick = function() {
   exitPopUp(editTransactionContainer, editTransactionForm, exitEditTransactionIcon);
   disableEditButtons();
};

function disableEditButtons() {
   const editTransactionButtons = document.querySelectorAll(".editTransactionIcon");

   editTransactionButtons.forEach((editButton) => {
      editButton.disabled = true;
   });

   setTimeout(() => {
      editTransactionButtons.forEach((editButton) => {
         editButton.disabled = false;
      });
   }, 1500);
}

addTransactionForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = (data) => {
      setTimeout(() => {
         document.getElementById("exitAddTransactionIcon").click();
         const transactionContainer = constructTransaction(data.data.account, data.data.title, data.data.type, data.data.category, data.data.date, data.data.amount, data.data.ID);
         transactionContainer.scrollIntoView({ behavior:"smooth" });
         disableEditButtons();
      }, 1100);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   // Select options hold possible ID's
   formData.set("type", (document.getElementById("category").querySelector("option:checked").dataset.type));
   formData.set("date", (document.getElementById("date").value));

   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("../users/addTransaction", structuredFormData, addTransactionSubmitButton, "Submit", successFunction, failFunction);
};

editTransactionForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = (data) => {
      setTimeout(() => {
         document.getElementById("exitEditTransactionIcon").click();

         if (data.data.remove === true) {
            const transaction = document.querySelector(`tbody tr#${data.data.ID}`);
            transaction.classList.add("removedTransaction");

            setTimeout(() => {
               transaction.remove();

               const possibleTransaction = document.querySelector("tbody tr");

               if (!possibleTransaction) {
                  // Must have removed only transaction on table
                  document.querySelector("tbody").innerHTML = "<tr class = \"no-transaction\"><td>No transactions available</td></tr>";
               }

            }, 1600);

         } else if (data.data.changes) {
            // Edit instance in current table
            constructTransaction(data.data.account, data.data.title, data.data.type, data.data.category, data.data.date, data.data.amount, data.data.ID);
            disableEditButtons();
         }
      }, 1100);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   // Select options hold possible ID's
   formData.set("type", (document.getElementById("editCategory").querySelector("option:checked").dataset.type));
   formData.set("date", (document.getElementById("editDate").value));
   formData.set("ID", (this.dataset.identification));
   formData.set("remove", document.getElementById("removeTransaction").checked);

   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("../users/editTransaction", structuredFormData, editTransactionSubmitButton, "Submit", successFunction, failFunction);
};