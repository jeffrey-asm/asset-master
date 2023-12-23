import {transitionToPage, removeMessage, displayMessage,openPopUp,exitPopUp}  from "../../shared/scripts/shared.js";

let username = document.getElementById('username');
let email = document.getElementById('email');

let editUsername = document.getElementById('editUsername');
let editEmail = document.getElementById('editEmail');
let changesButton = document.getElementById('changesButton');
let detailsForm = document.getElementById('detailsForm');

let passwordFormContainer = document.getElementById('popupPasswordContainer');
let passwordForm = document.getElementById('passwordForm');
let editPasswordPopUp = document.getElementById('changePasswordPopUp');
let editPasswordButton = document.getElementById('passwordSubmitButton');
let exitPasswordIcon = document.getElementById('exitPasswordIcon');

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

editPasswordPopUp.onclick = function(event){
   passwordForm.reset();
   openPopUp(passwordFormContainer);
}

exitPasswordIcon.onclick = function(event){
   exitPopUp(passwordFormContainer,exitPasswordIcon,editPasswordPopUp);
}

let inputs = document.getElementsByTagName("input");

for(let i = 0; i < inputs.length;i++){
   inputs[i].addEventListener("focus", function(event){
      removeMessage(messageContainer);
      this.classList.remove("errorInput");
   });
}

// Send post request to handle validation and updating values
detailsForm.onsubmit = function(event){
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
         if(data.status != 'pass'){
            messageContainer = displayMessage(changesButton,messageContainer, data.message,'error');
            document.getElementById(`${data.componentID}`).classList.add('errorInput');
            changesButton.innerHTML = "Save Changes";
         } else{
            //Reset all form inputs
            updateInfo();
            editUsername.disabled = editEmail.disabled = username.disabled = email.disabled = changesButton.disabled = true;
            changesButton.innerHTML = "Save Changes";

            //Insert message before button
            messageContainer = displayMessage(changesButton,messageContainer,data.message,'informational');
            messageContainer.style.animation = 'fadeOut 8s';

            setTimeout(()=>{
               editUsername.disabled = editEmail.disabled = false;
               messageContainer.remove();
            },5000);

         }
      })
      .catch(error => {
         //In case of error, display before submit button
         messageContainer = displayMessage(changesButton,messageContainer, `Could not successfully process request <i class='fa-solid fa-database'></i>`,'error');
         changesButton.innerHTML = "Save Changes";
      });

   return false;
}

passwordForm.onsubmit = function(event){
   removeMessage(messageContainer);

   let url = '../users/updatePassword';
   let formData = new FormData(this);
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
            messageContainer = displayMessage(editPasswordButton,messageContainer, data.message,'error');
            document.getElementById(`${data.componentID}`).classList.add('errorInput');
            editPasswordButton.innerHTML = "Submit";
         } else{
            editPasswordButton.innerHTML = "Submit";

            //Insert message before button
            messageContainer = displayMessage(editPasswordButton,messageContainer,`Changes saved <i class="fa-solid fa-check"></i>`,'informational');
            messageContainer.style.animation = 'fadeOut 8s';

            setTimeout(()=>{
               exitPasswordIcon.click();
            },1500);
         }
      })
      .catch(error => {
         //In case of error, display before submit button
         messageContainer = displayMessage(editPasswordButton,messageContainer, `Could not successfully process request <i class='fa-solid fa-database'></i>`,'error');
         editPasswordButton.innerHTML = "Submit";
      });

   return false;

}