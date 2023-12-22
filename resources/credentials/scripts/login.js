import {transitionToPage, removeMessage, displayMessage,trimInputs}  from "../../shared/scripts/shared.js";

let loginForm = document.getElementById("loginForm");
let usernameInput = document.getElementById("username");
let passwordInput = document.getElementById("password");
let passwordIcon = document.getElementById("showPassword");
let submitButton = document.getElementById("submitButton");

let messageContainer;

let inputs = document.getElementsByTagName("input");

for(let i = 0; i < inputs.length;i++){
   inputs[i].addEventListener("focus", function(event){
      //Put error message under password for simplicity
      removeMessage(messageContainer);
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
   trimInputs(inputs);
   removeMessage(messageContainer);

   let url = '../loginUser';
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
         console.log(data);
         if(data.hasOwnProperty('message')){
            messageContainer = displayMessage(submitButton,messageContainer, data.message,'error');
            usernameInput.classList.add("errorInput");
            passwordInput.classList.add('errorInput');
            submitButton.innerHTML = "Submit";
         } else{
            messageContainer = displayMessage(submitButton,messageContainer, 'Welcome <i class="fa-solid fa-door-open"></i>','informational');
            setTimeout(()=>{
               transitionToPage(submitButton,'../users/home');
            },500);

         }
      })
      .catch(error => {
         //Do not target an input for error due to backend problems
         messageContainer = displayMessage(submitButton,messageContainer, `Could not successfully process request <i class='fa-solid fa-database'></i>`,'error')
         submitButton.innerHTML = "Submit";
      });

   return false;
}