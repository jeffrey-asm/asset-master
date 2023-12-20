
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
   //Use regex for stronger passwords
   let passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$");
   let emailTest = new RegExp('^(([^<>()[\\]\\.,;:\\s@"]+(\\.[^<>()[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');

   if(usernameInput.value.length == 0 || usernameInput.value.length > 30){
      errorMessage = displayError(usernameInput,errorMessage, "Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
   } else if(passwordInput.value.length < 8){
      errorMessage = displayError(passwordInput,errorMessage, "Passwords must be at least 8 characters <i class='fa-solid fa-key'></i>");
   } else if (passwordTest.test(passwordInput.value) == 0){
      //Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      errorMessage = displayError(passwordInput,errorMessage, "Passwords must have at least one special character (@$!%*?&), one digit, 1 uppercase, 1 lowercase, and at least 8 total characters <i class='fa-solid fa-lock'></i>");
   } else if (passwordInput.value != additionalPasswordInput.value){
      //Passwords must match in case users enters in undesired input for security
      errorMessage = displayError(additionalPasswordInput,errorMessage, "Passwords do not match <i class='fa-solid fa-lock'></i>");
   } else if(emailTest.test(emailInput.value) == 0){
      //Ensure valid email for security of account
      errorMessage = displayError(emailInput,errorMessage, "Invalid email address <i class='fa-regular fa-envelope'></i>");
   } else{
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
            if(data.hasOwnProperty('error')){
               if(data['error'] == 'Username already taken!'){
                  errorMessage = displayError(usernameInput,errorMessage, `${data['error']} <i class='fa-solid fa-lock'></i>`);
                  submitButton.innerHTML = "Submit";
               } else{
                  errorMessage = displayError(emailInput,errorMessage, `${data['error']} <i class='fa-solid fa-lock'></i>`);
                  submitButton.innerHTML = "Submit";
               }
            } else{
               transitionToPage(submitButton,'/users/home');
            }
         })
         .catch(error => console.error(error));
   }
   return false;
}