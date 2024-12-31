import { exitPopUp, sendRequest }  from "../../shared/scripts/shared.js";
import { constructCategory, getBudget } from "./construct.js";

const addCategoryForm = document.getElementById("addCategoryForm");
const addCategorySubmitButton = document.getElementById("addCategorySubmitButton");

const editCategoryContainer = document.getElementById("editCategoryContainer");
const editCategoryForm = document.getElementById("editCategoryForm");
const editCategorySubmitButton = document.getElementById("editCategorySubmitButton");
const exitEditCategoryIcon = document.getElementById("exitEditCategoryIcon");

function disableEditButtons() {
   const editButtons = document.querySelectorAll(".editCategory");

   editButtons.forEach((editButton) => {
      editButton.disabled = true;
   });

   setTimeout(() => {
      editButtons.forEach((editButton) => {
         editButton.disabled = false;
      });
   }, 1500);
}

exitEditCategoryIcon.onclick = function() {
   exitPopUp(editCategoryContainer, editCategoryForm, exitEditCategoryIcon);
   disableEditButtons();
};

getBudget();

addCategoryForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = (data) => {
      setTimeout(() => {
         document.getElementById("exitAddCategoryIcon").click();
         constructCategory("sub", data.render.type, data.render.ID, data.render.name, 0, data.render.amount);
      }, 1100);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./addCategory", structuredFormData, addCategorySubmitButton, "Submit", successFunction, failFunction);
};

editCategoryForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = (data) => {
      setTimeout(() => {
         document.getElementById("exitEditCategoryIcon").click();

         if (data.render.changes) {
            if (data.render.mainOrSub == "reload") {
               getBudget();
            } else if (data.render.mainOrSub != "remove") {
               // Replace current category node
               constructCategory(data.render.mainOrSub, data.render.type, data.render.ID, data.render.name, data.render.current, data.render.total);
            } else {
               document.getElementById(data.render.ID).remove();
            }
         }
         disableEditButtons();
      }, 1100);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   // Set name since it could be disabled for main types
   formData.set("name", document.getElementById("editName").value);
   // mainIncome or mainExpenses should be the dataset ID variable for current form
   formData.set("ID", (this.dataset.identification));
   formData.set("type", document.getElementById("editType").value);
   formData.set("remove", document.getElementById("remove").checked);

   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./updateCategory", structuredFormData, editCategorySubmitButton, "Submit", successFunction, failFunction);
};