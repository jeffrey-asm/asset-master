import {sendRequest,transitionToPage,openNotification}  from "../../shared/scripts/shared.js";

let signUpForm = document.getElementById("signUpForm");
let submitButton = document.getElementById('submitButton');

openNotification("fa-solid fa-cookie-bite", '<p>Please allow all cookies to stay signed in!</p>', 'informational');

signUpForm.onsubmit = async function(event){
      event.preventDefault();

      let successFunction = (data,messageContainer) => {
            submitButton.innerHTML = '';
            submitButton.disabled = false;

            setTimeout(()=>{
                  transitionToPage(submitButton,'../users/home');
            },800);
      }

      let failFunction =  () => {return;};

      let formData = new FormData(this);
      let structuredFormData = new URLSearchParams(formData).toString();

      await sendRequest('./registerUser',structuredFormData,submitButton,'Submit',successFunction,failFunction);
}