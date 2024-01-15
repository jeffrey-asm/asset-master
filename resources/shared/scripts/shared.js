let mode = localStorage.getItem('mode');

//Landing pages do not have light/dark mode preferences
if(mode && document.querySelector('footer')){
   if(mode == 'dark'){
      let possibleToggleSwitch = document.querySelector('#mode');

      if(possibleToggleSwitch){
         possibleToggleSwitch.click();
      }
      document.body.classList.add('dark-mode');
   }
   document.body.style.opacity = '1';
} else{
   localStorage.mode = 'light';
   document.body.style.opacity = '1';
}

let homeLogo = document.getElementById('logo');

if(homeLogo){
   homeLogo.onclick = (event) =>{
      window.location.href = './home';
   }
}

let sidebar = document.querySelector('nav');

if(sidebar){
   let anchors = sidebar.querySelectorAll('a');

   sidebar.onmouseover = function(event){
      anchors.forEach((anchorTag)=>{
         anchorTag.style.visibility = 'visible';
      });
   }

   sidebar.onmouseout = function(event){

      anchors.forEach((anchorTag)=>{
         anchorTag.style.visibility = 'hidden';
      });
   }
}

// Send request to log out method in built controllers
let logoutIcons = document.querySelectorAll('.logOutIcon');

if(logoutIcons){
   logoutIcons.forEach((icon)=>{
      // Some pages may have two log out icons (settings)
      icon.onclick = function(event){
         window.location.href = './logOut';
      }
   });
}

function checkDimensions(component,link) {
   let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
   let viewportHeight = window.innerHeight || document.documentElement.clientHeight;
   let componentDimensions = component.getBoundingClientRect()
   let elementWidth = componentDimensions.width;
   let elementHeight = componentDimensions.height;

   if (elementWidth >= viewportWidth || elementHeight >= viewportHeight) {
      setTimeout(()=>{
         window.location.assign(link);
      },400);
   }

}


let dimensionInterval;

function transitionToPage(component,link){
   setTimeout(()=>{
      component.innerHTML = "";
      component.classList.add("buttonFade");
   },400);

   setTimeout(()=>{
      component.classList.add("overtaken");
   },500);

   dimensionInterval = setInterval(()=>{
      checkDimensions(component, link)
   },100);

   window.addEventListener('beforeunload', function() {
      //Always clear interval on page leave
      clearInterval(dimensionInterval);
   });

   //Rare care of very large screen view ports, end the animation early
   setTimeout(() => {
      window.location.assign(link);
   },5000);
}

let inputs = document.getElementsByTagName('input');
let messageContainer;
let editingContainer;

function removeMessage(){
   if(document.body.contains(editingContainer)){
      editingContainer.classList.remove('errorInput');
   }

   if(document.body.contains(messageContainer)){
      messageContainer.style.animation = 'fadeOut 0.5s ease-in-out forwards';

      setTimeout(()=>{
         messageContainer.remove();
      },250);

   }
}

function displayMessage(inputComponent, message, classType){
   removeMessage();

   setTimeout(()=>{
      messageContainer = Object.assign(document.createElement('p'),{className:classType,innerHTML:message});
      inputComponent.before(messageContainer);
   },300);
}

let mainTag = document.querySelector('main');
let footerTag = document.querySelector('footer');

function openPopUp(component){
   if(!component.classList.contains('popupShown')){
      component.style.visibility = 'visible';
      component.classList.remove('popupHidden');
      component.querySelector('button').disabled = false;
      //Apply blur to all other elements
      mainTag.style.filter = footerTag.style.filter = 'blur(3px)';

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
      mainTag.style.filter = footerTag.style.filter = 'initial';

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

         let possibleSwitch = document.querySelector('#remove');

         if(possibleSwitch){
            possibleSwitch.checked = false;
         }

         removeMessage();
      },1100);
   }
}

function openNotification(iconClass, notificationHTML, notificationType){
   let notification = document.createElement('div');
   notification.className = `popupNotification`

   notification.innerHTML = `
      <div class = 'popupIconContainer ${notificationType} '>
         <i class='${iconClass}'></i>
      </div>
      <div class = 'popupExitContainer'>
         <i class="fa-solid fa-xmark exitNotificationIcon" ></i>
      </div>

      ${notificationHTML}
   `;

   document.body.append(notification);
   notification.classList.add('notificationShown');

   notification.querySelector('.exitNotificationIcon').onclick = function(event){
      this.classList.add('clicked');
   }

   notification.querySelector('.popupExitContainer').onclick = function(event){
      notification.classList.remove('notificationShown');
      notification.classList.add('notificationHidden');
      setTimeout(()=>{
         notification.remove();
      },2000)
   };

   return notification;
}

async function sendRequest(url,structuredFormData,formButton,formButtonText,successFunction=()=>{},failFunction=()=>{}){
   //Interesting loading animation inside button
   formButton.disabled = true;
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
      console.log(data);
      if(data.error){
         throw error;
      }

      if (data.status !== 'pass') {
        displayMessage(formButton, data.message, 'error');
        editingContainer = document.getElementById(data.componentID);
        editingContainer.classList.add('errorInput');
        formButton.innerHTML = formButtonText;
        failFunction();
        formButton.disabled = false;
      } else {
        displayMessage(formButton, data.message, 'informational');
        formButton.innerHTML = formButtonText;
        //Success functions may need data from request or current message container in scope of current module
        successFunction(data,messageContainer);
        return data;
      }
    } catch (error) {
      // Handle errors if the request fails
      openNotification("fa-solid fa-layer-group", '<p>Could not successfully process request</p>', 'errorType');
      formButton.innerHTML = formButtonText;
      failFunction();
    }
}

//Shared onfocus for all form inputs
for(let input of inputs){
   input.onfocus = function(){
      removeMessage();
   }
}

//Shared function for password inputs
let passwordIcons = document.querySelectorAll('.fa-regular.fa-eye');

passwordIcons.forEach((icon) => {
   icon.onclick = function(event){
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
});

// navbar
let sideBarIcon = document.getElementById('sidebarIcon');
let exitSideBarIcon = document.getElementById('exitSideBarIcon');
let navbar = document.querySelector('nav');

if(document.contains(sideBarIcon)){
   //Only apply to valid component on user pages
   sideBarIcon.onclick = function(event){
      if(!navbar.classList.contains('navbarShown')){
         navbar.classList.remove('navbarHidden');
         navbar.classList.add('navbarShown');
      }
   }
   exitSideBarIcon.onclick = function(event){
      if(!navbar.classList.contains('navbarHidden')){
         navbar.classList.remove('navbarShown');
         navbar.classList.add('navbarHidden');
      }
   }

}

let logoIcon = document.getElementById('logoIcon');

if(logoIcon){
   logoIcon.onclick = function(event){
      window.location.assign('./home');
   }
}

let footerYear = document.getElementById('footerYear');
if(footerYear){
   footerYear.innerText = (new Date().getUTCFullYear()).toString();
}

export {transitionToPage,displayMessage,removeMessage,openPopUp,exitPopUp,openNotification,sendRequest};
