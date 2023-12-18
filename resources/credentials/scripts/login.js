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
   let usernameSaved = localStorage.getItem("asset-master-username", usernameInput.value);
   let passwordSaved = localStorage.getItem("asset-master-password", passwordInput.value);

   if (usernameInput.value != usernameSaved || passwordInput.value != passwordSaved){
      //Assume this does not work until planning for structured database
      errorMessage = displayError(passwordInput,errorMessage, "Invalid user credentials <i class='fa-solid fa-lock'></i>");
      usernameInput.classList.add("errorInput");
   } else{
      transitionToPage(submitButton,"../home/index.html")
   }
   return false;
}