
import {transitionToPage,removeError, displayError}  from "../../shared/scripts/shared.js";

let signUpForm = document.getElementById("signUpForm");

let usernameInput = document.getElementById("username");
let passwordInput = document.getElementById("password");
let passwordIcon = document.getElementById("showPassword");
let additionalPasswordInput = document.getElementById("additionalPassword");
let additionalPasswordIcon = document.getElementById("showAdditionalPassword");
let submitButton = document.getElementById("submitButton");

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
   //Use regex for stronger passwords
   let passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$");

   if(usernameInput.value.length == 0 || usernameInput.value.length >= 15){
      errorMessage = displayError(usernameInput,errorMessage, "Username must be between 1 and 30 characters <i class='fa-solid fa-signature'></i>");
   } else if(passwordInput.value.length < 8){
      errorMessage = displayError(passwordInput,errorMessage, "Passwords must be at least 8 characters <i class='fa-solid fa-key'></i>");
   } else if (passwordTest.test(passwordInput.value) == 0){
      //Passwords must have at least one special character, one digit, 1 uppercase, 1 lowercase, and at least 8 total characters
      errorMessage = displayError(passwordInput,errorMessage, "Passwords must have at least one special character (@$!%*?&), one digit, 1 uppercase, 1 lowercase, and at least 8 total characters <i class='fa-solid fa-lock'></i>");
   } else if (passwordInput.value != additionalPasswordInput.value){
      //Passwords must match in case users enters in undesired input for security
      errorMessage = displayError(additionalPasswordInput,errorMessage, "Passwords do not match <i class='fa-solid fa-lock'></i>");
   }else{
      //Try to make a POST request to add new user
      const url = '../registerUser';
      const formData = new FormData(this);

      alert(1);

      fetch(url,{
         method:"POST",
         body:formData
      })
         .then(response => response.json())
         .then(data => console.log(data))
         .error(error => console.log(error))

      transitionToPage(submitButton,"../home/index.html");
   }


   return false;
}