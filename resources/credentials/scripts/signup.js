import { sendRequest, transitionToPage }  from "../../shared/scripts/shared.js";

const signUpForm = document.getElementById("signUpForm");
const submitButton = document.getElementById("submitButton");

signUpForm.onsubmit = async function(event) {
   event.preventDefault();

   const successFunction = () => {
      submitButton.innerHTML = "";
      submitButton.disabled = false;

      setTimeout(() => {
         transitionToPage(submitButton, "../users/home");
      }, 800);
   };

   const failFunction =  () => {return;};

   const formData = new FormData(this);
   const structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest("./registerUser", structuredFormData, submitButton, "Submit", successFunction, failFunction);
};