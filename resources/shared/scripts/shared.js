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

function trimInputs(components){
   for(let i = 0; i < components.length; i++){
      //Always trim inputs for valid form validation
      components[i].value = components[i].value.trim();
   }
}



function togglePopUp(component){
   if(component.classList.contains('popupShown')){
      //Must hide elements behind
      component.classList.remove('popupShown');
      component.classList.add('popupHidden');
   } else{
      component.classList.remove('popupHidden');
      component.classList.add('popupShown');
   }

}

//Nav icon for user settings
let profileIcon = document.getElementById('profileIcon');

if(profileIcon){
   profileIcon.onclick = function(event){
      window.location.assign('../users/profile');
   }
}

export {transitionToPage,displayMessage,removeMessage,trimInputs,togglePopUp};
