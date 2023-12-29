import {sendRequest,openPopUp,exitPopUp,removeMessage,transitionToPage}  from "../../shared/scripts/shared.js";
import {updateProfileInfo} from "./construct.js";

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

updateProfileInfo();

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
   exitPopUp(passwordFormContainer,passwordForm,exitPasswordIcon,editPasswordPopUp);
}

// Send post request to handle validation and updating values
detailsForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      console.log(data);
      let username = document.getElementById('username');
      let email = document.getElementById('email');
      let editUsername = document.getElementById('editUsername');
      let editEmail = document.getElementById('editEmail');
      let changesButton = document.getElementById('changesButton');

       //Reset all form inputs
       updateProfileInfo();
       editUsername.disabled = editEmail.disabled = username.disabled = email.disabled = changesButton.disabled = true;

      setTimeout(()=>{
         removeMessage(messageContainer)
         document.getElementById('editUsername').disabled = document.getElementById('editEmail').disabled = false;
      },2500);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   //Manually set request body parameters for form validation
   formData.set('username',username.value);
   formData.set('email',email.value);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('./updateUser',structuredFormData,changesButton,'Save Changes',successFunction,failFunction);
}

passwordForm.onsubmit = async function(event){
   event.preventDefault();

   let successFunction = (data,messageContainer) => {
      setTimeout(()=>{
         document.getElementById('exitPasswordIcon').click();
      },2000);
   }

   let failFunction =  () => {};

   let formData = new FormData(this);
   let structuredFormData = new URLSearchParams(formData).toString();

   await sendRequest('./updatePassword',structuredFormData,editPasswordButton,'Submit',successFunction,failFunction);
}