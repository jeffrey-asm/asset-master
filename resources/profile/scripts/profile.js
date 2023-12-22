import {transitionToPage, removeMessage, displayMessage,trimInputs,togglePopUp}  from "../../shared/scripts/shared.js";

let username = document.getElementById('username');
let email = document.getElementById('email');

let editUsername = document.getElementById('editUsername');
let editEmail = document.getElementById('editEmail');

let editPassword = document.getElementById('changePassword');

let changesButton = document.getElementById('changesButton');
let messageContainer;

async function updateInfo(){
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

}
updateInfo();

// Send request to log out method in built controllers
document.getElementById('logOutButton').onclick = function(event){
   transitionToPage(this, '/users/logout');
}

//Handling removing disabled inputs individually
function enableInput(input){
   input.disabled = false;
   changesButton.disabled = false;
}


editUsername.onclick = function(event){
   enableInput(username);
}

editEmail.onclick = function(event){
   enableInput(email);
}

editPassword.onclick = function(event){
   togglePopUp(document.getElementById('passwordForm'));
}

let inputs = document.getElementsByTagName("input");

for(let i = 0; i < inputs.length;i++){
   inputs[i].addEventListener("focus", function(event){
      removeMessage(messageContainer);
      this.classList.remove("errorInput");
   });
}


// Send post request to handle validation and updating values
document.getElementById('detailsForm').onsubmit = function(event){
   trimInputs(inputs);
   removeMessage(messageContainer);

   let url = '../users/updateUser';
   let formData = new FormData(this);
   //Manually set request body parameters for form validation
   formData.set('username',username.value);
   formData.set('email',email.value);

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
         console.log(data);
         if(data.hasOwnProperty('message')){
            errorMessage = displayMessage(changesButton,messageContainer, `${data.message}`,'error');
            document.getElementById(`${data.componentID}`).classList.add('errorInput');
            changesButton.innerHTML = "Save Changes";
         } else{
            //Reset all form inputs
            updateInfo();
            editUsername.disabled = editEmail.disabled = username.disabled = email.disabled = changesButton.disabled = true;
            changesButton.innerHTML = "Save Changes";

            //Insert message before button
            informational = displayMessage(changesButton,messageContainer,`Changes saved <i class="fa-solid fa-check"></i>`,'informational');
            informational.style.animation = 'fadeOut 8s';

            setTimeout(()=>{
               editUsername.disabled = editEmail.disabled = false;
               informational.remove();
            },5000);

         }
      })
      .catch(error => {
         //In case of error, display before submit button
         errorMessage = displayMessage(changesButton,messageContainer, `Could not successfully process request <i class='fa-solid fa-database'></i>`,'error');
         changesButton.innerHTML = "Save Changes";
      });








   return false;
}

