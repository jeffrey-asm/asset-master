import {transitionToPage,removeMessage, displayMessage}  from "../../shared/scripts/shared.js";

let signUpForm = document.getElementById("signUpForm");
let submitButton = document.getElementById('submitButton');
let messageContainer;

let inputs = document.getElementsByTagName("input");

for(let i = 0; i < inputs.length;i++){
   inputs[i].addEventListener("focus", function(event){
      removeMessage(messageContainer);
      this.classList.remove("errorInput");
   });
}

signUpForm.onsubmit = function(event){
   removeMessage(messageContainer);

   //Try to make a POST request to add new user
   let url = '../registerUser';
   let formData = new FormData(this);

   //Interesting loading animation inside button
   submitButton.innerHTML = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;

   // Manually encode the form data
   let encodedFormData = new URLSearchParams(formData).toString();

   fetch(url,{
      method:"POST",
      body:encodedFormData,
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
      },
   })
      .then(response => response.json())
      .then(data => {
         if(data.status != 'pass'){
            //Display error message on specific component after verifying form on backend
            messageContainer = displayMessage(submitButton,messageContainer,data.message,'error');
            document.getElementById(data.componentID).classList.add('errorInput');
            submitButton.innerHTML = "Submit";
         } else{
            messageContainer = displayMessage(submitButton,messageContainer, data.message,'informational');
            setTimeout(()=>{
               transitionToPage(submitButton,'../users/home');
            },500);
         }
      })
      .catch(error => {
         messageContainer = displayMessage(submitButton,messageContainer,`Could not successfully process request <i class='fa-solid fa-database'></i>`,'error');
         submitButton.innerHTML = "Submit";
      });

   return false;
}