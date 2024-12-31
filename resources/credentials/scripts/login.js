import { sendRequest, transitionToPage }  from "../../shared/scripts/shared.js";

const loginForm = document.getElementById("loginForm");
const submitButton = document.getElementById("submitButton");

loginForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = () => {
      submitButton.innerHTML = "";
      document.getElementById("username").classList.remove("errorInput");
      document.getElementById("password").classList.remove("errorInput");
      setTimeout(() => {
         submitButton.disabled = false;
         transitionToPage(submitButton, "../users/home");
      }, 800);
   };

   const failFunction =  () => {
      document.getElementById("username").classList.add("errorInput");
      document.getElementById("password").classList.add("errorInput");
   };

   const formData = new FormData(this);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./loginUser", structuredFormData, submitButton, "Submit", successFunction, failFunction);
};