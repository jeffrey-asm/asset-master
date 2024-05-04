import {sendRequest, transitionToPage, openNotification}  from "../../shared/scripts/shared.js";

let loginForm = document.getElementById("loginForm");
let submitButton = document.getElementById("submitButton");

loginForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      submitButton.innerHTML = '';
      document.getElementById("username").classList.remove("errorInput");
      document.getElementById("password").classList.remove('errorInput');
      setTimeout(()=>{
         submitButton.disabled = false;
         transitionToPage(submitButton,'../users/home');
      },800);
   }

   let failFunction =  () => {
      document.getElementById("username").classList.add("errorInput");
      document.getElementById("password").classList.add('errorInput');
   }

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('./loginUser',structuredFormData,submitButton,'Submit',successFunction,failFunction);
}