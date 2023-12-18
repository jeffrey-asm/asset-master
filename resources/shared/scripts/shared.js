function transitionToPage(component,link){
   component.style.color = "transparent";

   setTimeout(()=>{
      component.style.transition = "2.5s";
      component.classList.add("buttonFade");
   },400);

   setTimeout(() => {
      window.location.assign(link);
   },1000);
}

function removeError(errorComponent){
   if(document.body.contains(errorComponent)){
      errorComponent.remove();
   }
}

function displayError(inputComponent, errorComponent, message){
   inputComponent.classList.add("errorInput");

   removeError(errorComponent);

   errorComponent = document.createElement("p");
   errorComponent.className = "error";
   errorComponent.innerHTML = message;

   inputComponent.after(errorComponent);

   //Always return component to check if node still exists
   return errorComponent;
}


export {transitionToPage,removeError,displayError};
