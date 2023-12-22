import {transitionToPage,removeMessage, displayMessage,trimInputs}  from "../../shared/scripts/shared.js";

let signUpForm = document.getElementById("signUpForm");

let usernameInput = document.getElementById("username");
let passwordInput = document.getElementById("password");
let passwordIcon = document.getElementById("showPassword");
let additionalPasswordInput = document.getElementById("additionalPassword");
let additionalPasswordIcon = document.getElementById("showAdditionalPassword");
let emailInput = document.getElementById("email");
let submitButton = document.getElementById('submitButton');

let messageContainer;


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
      removeMessage(messageContainer);
      this.classList.remove("errorInput");
   });
}

signUpForm.onsubmit = function(event){
   trimInputs(inputs);
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
         if(data.hasOwnProperty('message')){
            //Display error message on specific component after verifying form on backend
            messageContainer = displayMessage(submitButton,messageContainer,data.message,'error');
            document.getElementById(data.componentID).classList.add('errorInput');
            submitButton.innerHTML = "Submit";
         } else{
            messageContainer = displayMessage(submitButton,messageContainer, 'Welcome <i class="fa-solid fa-door-open"></i>','informational');
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