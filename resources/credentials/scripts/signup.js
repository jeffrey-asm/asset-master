
import {transitionToPage,removeError, displayError}  from "../../shared/scripts/shared.js";

let signUpForm = document.getElementById("signUpForm");

let usernameInput = document.getElementById("username");
let passwordInput = document.getElementById("password");
let passwordIcon = document.getElementById("showPassword");
let additionalPasswordInput = document.getElementById("additionalPassword");
let additionalPasswordIcon = document.getElementById("showAdditionalPassword");
let emailInput = document.getElementById("email");
let submitButton = document.getElementById('submitButton');

let errorMessage;


passwordIcon.onclick = function(){
   //Switch between text and password type for user interactivity
   if(passwordInput.type == "password"){
      passwordInput.type = "text";
      this.style.color = "#08B0FF";
   } else{
      passwordInput.type = "password";
      this.style.color = "black";
   }
}

additionalPasswordIcon.onclick = function(){
   //Switch between text and password type for user interactivity
   if(additionalPassword.type == "password"){
      additionalPassword.type = "text";
      this.style.color = "#08B0FF";
   } else{
      additionalPassword.type = "password";
      this.style.color = "black";
   }
}

let inputs = document.getElementsByTagName("input");

for(let i = 0; i < inputs.length;i++){
   inputs[i].addEventListener("focus", function(event){
      removeError(errorMessage);
      this.classList.remove("errorInput");
   });
}

signUpForm.onsubmit = function(event){
   removeError(errorMessage);
   //Try to make a POST request to add new user
   let url = '../register_user';
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
         if(data.hasOwnProperty('status')){
            //Display error message on specific component after verifying form on backend
            errorMessage = displayError(document.getElementById(data.componentID),errorMessage,data.message);
            submitButton.innerHTML = "Submit";
         } else if(data.hasOwnProperty('error')){
            if(data['error'] == 'Username already taken!'){
               errorMessage = displayError(usernameInput,errorMessage, `${data['error']} <i class='fa-solid fa-lock'></i>`);
               submitButton.innerHTML = "Submit";
            } else{
               errorMessage = displayError(emailInput,errorMessage, `${data['error']} <i class='fa-solid fa-lock'></i>`);
               submitButton.innerHTML = "Submit";
            }
         } else{
            submitButton.innerHTML = "";
            transitionToPage(submitButton,'/users/home');
         }
      })
      .catch(error => console.error(error));

   return false;
}