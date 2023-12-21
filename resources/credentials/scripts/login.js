import {transitionToPage, removeError, displayError}  from "../../shared/scripts/shared.js";

let loginForm = document.getElementById("loginForm");
let usernameInput = document.getElementById("username");
let passwordInput = document.getElementById("password");
let passwordIcon = document.getElementById("showPassword");
let submitButton = document.getElementById("submitButton");

let errorMessage;

let inputs = document.getElementsByTagName("input");

for(let i = 0; i < inputs.length;i++){
   inputs[i].addEventListener("focus", function(event){
      //Put error message under password for simplicity
      removeError(errorMessage);
      //User must focus on given input to not remove both at same time
      this.classList.remove("errorInput");
   });
}

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

loginForm.onsubmit = function(event){
   removeError(errorMessage);
   let url = '../login_user';
   let formData = new FormData(this);

   //Interesting loading animation inside button
   submitButton.innerHTML = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;

   // Manually encode the form data
   let encodedFormData = new URLSearchParams(formData).toString();

   // Interesting animation
   submitButton.innerHTML = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;

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
            errorMessage = displayError(passwordInput,errorMessage, "Invalid user credentials <i class='fa-solid fa-lock'></i>");
            usernameInput.classList.add("errorInput");
            submitButton.innerHTML = "Submit";
         } else{
            submitButton.innerHTML = "";
            transitionToPage(submitButton,'/users/home');
         }
      })
      .catch(error => console.error(error));

   return false;
}