import {transitionToPage, removeError, displayError}  from "../../shared/scripts/shared.js";

let username = document.getElementById('username');
let email = document.getElementById('email');
let changesButton = document.getElementById('changesButton');
let errorMessage;

fetch('/users/getUserInfo',{
   method:"GET",
})
   .then(response => response.json())
   .then(data => {
      username.value = `${data.Username}`;
      email.value = `${data.Email}`;

      if(data.Verified !== 'F'){
         let verifiedImage = Object.assign(document.createElement('img'), { src: '../resources/settings/images/verified.jpg', alt: 'verified-image', id: 'verifiedImage' });

         // We replace verifying email with verified image for simplicity
         let verifyButton = document.getElementById('verifyEmailButton');
         verifyButton.parentNode.replaceChild(verifiedImage, verifyButton);
      }
   })
   .catch(error => console.error(error));

// Send request to log out method in built controllers
document.getElementById('logOutButton').onclick = function(event){
   transitionToPage(this, '/users/logout');
}

//Handling removing disabled inputs individually
function enableInput(input){
   input.disabled = false;
   changesButton.disabled = false;
}

document.getElementById('editUsername').onclick = function(event){
   enableInput(username);
}

document.getElementById('editEmail').onclick = function(event){
   enableInput(email);
}

// Send post request to handle validation and updating values
document.getElementById('detailsForm').onsubmit = function(event){
   removeError(errorMessage);
   let url = '../users/updateUser';
   let formData = new FormData(this);

   changesButton.innerHTML = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;

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
            if(data.componentID === 'username'){
               errorMessage = displayError(username,errorMessage, `${data.error}`);
            } else{
               errorMessage = displayError(email,errorMessage, `${data.error}`);
            }

            changesButton.innerHTML = "Submit";
         } else{
            //TODO setTimeout to success message with thumbs up noting changes have been made
            //TODO MUST HANDLE CASE FOR NEW EMAIL AND NOT VERIFIED
            changesButton.innerHTML = "";
         }
      })
      .catch(error => console.error(error));








   return false;
}

