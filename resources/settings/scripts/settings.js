import { sendRequest, openPopUp, exitPopUp, removeMessage }  from "../../shared/scripts/shared.js";
import { updateProfileInfo } from "./construct.js";

const username = document.getElementById("username");
const email = document.getElementById("email");

const editUsername = document.getElementById("editUsername");
const editEmail = document.getElementById("editEmail");
const changesButton = document.getElementById("changesButton");
const detailsForm = document.getElementById("detailsForm");

const passwordFormContainer = document.getElementById("popupPasswordContainer");
const passwordForm = document.getElementById("passwordForm");
const editPasswordPopUp = document.getElementById("changePasswordPopUp");
const editPasswordButton = document.getElementById("passwordSubmitButton");
const exitPasswordIcon = document.getElementById("exitPasswordIcon");

updateProfileInfo();

// Send request to log out method in built controllers
const logoutIcon = document.querySelector("#logOutIcon");

// Some pages may have two log out icons (settings)
logoutIcon.onclick = function () {
   window.location.href = "./logOut";
};

// Handling removing disabled inputs individually
function enableInput (input) {
   input.disabled = false;
   changesButton.disabled = false;
}

editUsername.onclick = function () {
   enableInput(username);
};

editEmail.onclick = function () {
   enableInput(email);
};

editPasswordPopUp.onclick = function () {
   passwordForm.reset();
   openPopUp(passwordFormContainer);
};

exitPasswordIcon.onclick = function () {
   exitPopUp(passwordFormContainer, passwordForm, exitPasswordIcon, editPasswordPopUp);
};

const toggle = document.querySelector("#mode");

toggle.onchange = () => {
   if (document.body.classList.contains("dark-mode")) {
      localStorage.mode = "light";
      document.body.classList.remove("dark-mode");
   } else {
      localStorage.mode =  "dark";
      document.body.classList.add("dark-mode");
   }
};

const deletePopUpButton = document.getElementById("deletePopUpButton");
const deleteFormContainer = document.getElementById("popupDeleteContainer");
const deleteMessage = document.getElementById("deleteMessage");

const deleteForm = document.getElementById("deleteForm");
const exitDeleteIcon = document.getElementById("exitDeleteIcon");
const deleteSubmitButton = document.getElementById("deleteSubmitButton");

deletePopUpButton.onclick = function () {
   const username = document.getElementById("username").value;
   deleteMessage.innerHTML = `<strong>sudo deluser ${username}</strong>`;
   openPopUp(deleteFormContainer);
};

exitDeleteIcon.onclick = function () {
   exitPopUp(deleteFormContainer, deleteForm, exitDeleteIcon, deletePopUpButton);
};

// Send post request to handle validation and updating values
detailsForm.onsubmit = async function (event) {
   event.preventDefault();

   const successFunction = (data, messageContainer) => {
      const username = document.getElementById("username");
      const email = document.getElementById("email");
      const editUsername = document.getElementById("editUsername");
      const editEmail = document.getElementById("editEmail");
      const changesButton = document.getElementById("changesButton");

      // Reset all form inputs
      updateProfileInfo();
      editUsername.disabled = editEmail.disabled = username.disabled = email.disabled = changesButton.disabled = true;

      setTimeout(() => {
         console.log(data);
         removeMessage(messageContainer);
         setTimeout(() => {
            document.getElementById("editUsername").disabled = document.getElementById("editEmail").disabled = false;
         }, 250);
      }, 2500);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   // Manually set request body parameters for form validation
   formData.set("username", username.value);
   formData.set("email", email.value);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./updateUser", structuredFormData, changesButton, "Save Changes", successFunction, failFunction);
};

passwordForm.onsubmit = async function (event) {
   event.preventDefault();

   const successFunction = () => {
      setTimeout(() => {
         document.getElementById("exitPasswordIcon").click();
      }, 2000);
   };

   const failFunction =  () => {return;};
   const formData = new FormData(this);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./updatePassword", structuredFormData, editPasswordButton, "Submit", successFunction, failFunction);
};

document.getElementById("message").onpaste = function (event) {
   // Don't allow simple copy paste for security reasons
   event.preventDefault();
};

deleteForm.onsubmit = async function (event) {
   event.preventDefault();

   const successFunction = () => {
      setTimeout(() => {
         window.location.href = "./logOut";
      }, 2000);
   };

   const failFunction =  () => {return;};
   const formData = new FormData(this);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./deleteAccount", structuredFormData, deleteSubmitButton, "Submit", successFunction, failFunction);
};