import {positiveGradient,negativeGradient,constructCategory} from "../../budget/scripts/construct.js";
import {updateProfileInfo} from "../../profile/scripts/construct.js";

function transitionToPage(component,link){
   setTimeout(()=>{
      component.innerHTML = "";
   },300);

   setTimeout(()=>{
      component.style.transition = "2.5s";
      component.classList.add("buttonFade");
   },400);

   setTimeout(() => {
      window.location.assign(link);
   },1000);
}

let inputs = document.getElementsByTagName('input');
let messageContainer;
let editingContainer;

function removeMessage(){
   if(document.body.contains(editingContainer)){
      editingContainer.classList.remove('errorInput');
   }

   if(document.body.contains(messageContainer)){
      messageContainer.style.animation = 'fadeOut 1.5s forwards';

      setTimeout(()=>{
         messageContainer.remove();
      },150);

   }
}

function displayMessage(inputComponent, message, classType){
   removeMessage();

   setTimeout(()=>{
      messageContainer = Object.assign(document.createElement('p'),{className:classType,innerHTML:message});
      inputComponent.before(messageContainer);
   },200);
}

let headerTag = document.querySelector('header');
let mainTag = document.querySelector('main');
let footerTag = document.querySelector('footer');

function openPopUp(component){
   if(!component.classList.contains('popupShown')){
      component.style.visibility = 'visible';
      component.classList.remove('popupHidden');
      //Apply blur to all other elements
      headerTag.style.filter = mainTag.style.filter = footerTag.style.filter = 'blur(2px)';

      //Add transition to button for smooth animation on hover
      component.getElementsByTagName('button')[0].style.transition = '0.5s';

      //Must hide elements behind
      component.classList.add('popupShown');
   }
}

function exitPopUp(component,form,icon,button){

   if(component.classList.contains('popupShown')){
      icon.classList.add('clicked');

      if(button){
         button.disabled = true;
      }
      //Spin animation and make sure button fades out with the container by setting transition to initial
      component.getElementsByTagName('button')[0].style.transition = 'initial';

      //Remove all blur applications
      headerTag.style.filter = mainTag.style.filter = footerTag.style.filter = 'initial';

      component.classList.remove('popupShown');
      component.classList.add('popupHidden');

      setTimeout(()=>{
         component.style.visibility = 'hidden';
         icon.classList.remove('clicked');
         //Ensure form fully fades out
         if(button){
            button.disabled = false;
         }
         //reset form and remove any message containers
         form.reset();
         removeMessage();
      },1100);
   }
}

async function sendRequest(url,structuredFormData,formButton,formButtonText,successFunction=()=>{},failFunction=()=>{}){
   //Interesting loading animation inside button
   formButton.innerHTML = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;
   removeMessage();

   try {
      const response = await fetch(url, {
        method: "POST",
        body: structuredFormData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();

      if (data.status !== 'pass') {
        displayMessage(formButton, data.message, 'error');
        editingContainer = document.getElementById(data.componentID);
        editingContainer.classList.add('errorInput');
        formButton.innerHTML = formButtonText;
        failFunction();
      } else {
        displayMessage(formButton, data.message, 'informational');
        formButton.innerHTML = formButtonText;
        //Success functions may need data from request or current message container in scope of current module
        successFunction(data,messageContainer);
        return data;
      }
    } catch (error) {
      // Handle errors if the request fails
      console.log(error);
      displayMessage(formButton, `Could not successfully process request <i class='fa-solid fa-database'></i>`, 'error');
      formButton.innerHTML = formButtonText;
      failFunction();
    }
}

//Shared onfocus for all form inputs
for(let i = 0; i < inputs.length; i++){
   inputs[i].onfocus = function(event){
      removeMessage(messageContainer)
   }
}

//Shared function for password inputs
let passwordIcons = document.querySelectorAll('.fa-regular.fa-eye');

for(let i = 0; i < passwordIcons.length; i++){
   passwordIcons[i].onclick = function(event){
      //Target container in dataset to toggle visible or hidden password
      let passwordContainer = document.getElementById(this.dataset.container);

      if(passwordContainer.type == "password"){
         passwordContainer.type = "text";
         this.style.color = "#08B0FF";
      } else{
         passwordContainer.type = "password";
         this.style.color = "black";
      }
   }
}

//Nav icon for user settings
let profileIcon = document.getElementById('profileIcon');

if(profileIcon){
   profileIcon.onclick = function(event){
      window.location.assign('../users/profile');
   }
}

export {transitionToPage,displayMessage,removeMessage,openPopUp,exitPopUp,sendRequest};
