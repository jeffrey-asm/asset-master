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

function removeMessage(errorComponent){
   if(document.body.contains(errorComponent)){
      errorComponent.style.animation = 'fadeOut 1s';
      setTimeout(()=>{
         errorComponent.remove();
      },800);

   }
}

function displayMessage(inputComponent, currentMessage, message, classType){
   if(document.body.contains(currentMessage)){
      //apply no fadeout
      currentMessage.remove();
   }

   let container = Object.assign(document.createElement('p'),{className:classType,innerHTML:message});
   inputComponent.before(container);

   //Always return message component to check if node still exists
   return container;
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

function exitPopUp(component,icon,button){

   if(component.classList.contains('popupShown')){
      icon.classList.add('clicked');
      button.disabled = true;

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
         button.disabled = false;
      },1500);
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

export {transitionToPage,displayMessage,removeMessage,openPopUp,exitPopUp};
