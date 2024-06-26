const mode = localStorage.getItem("mode");

// Landing and authentication pages do not have light/dark mode preferences
if (mode && document.querySelector("footer")) {
   if (mode == "dark") {
      const possibleToggleSwitch = document.querySelector("#mode");

      if (possibleToggleSwitch) {
         possibleToggleSwitch.click();
      }
      document.body.classList.add("dark-mode");
   }
} else {
   localStorage.mode = "light";
}

const sideBarIcon = document.getElementById("sidebarIcon");

if (sideBarIcon) {
   const nav = document.querySelector("nav");

   sideBarIcon.onclick = function () {
      if (nav.classList.contains("navShown")) {
         nav.classList.remove("navShown");
         nav.classList.add("navHidden");
         sideBarIcon.setAttribute("class", "fas fa-bars");
      } else {
         nav.classList.remove("navHidden");
         nav.classList.add("navShown");
         sideBarIcon.setAttribute("class", "fa-solid fa-angles-right");
      }
   };
}

function checkDimensions (component, link) {
   const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
   const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
   const componentDimensions = component.getBoundingClientRect();
   const elementWidth = componentDimensions.width;
   const elementHeight = componentDimensions.height;

   if (elementWidth >= viewportWidth || elementHeight >= viewportHeight) {
      setTimeout(() => {
         window.location.assign(link);
      }, 400);
   }
}

let dimensionInterval;

function transitionToPage (component, link) {
   // Complicated transitions needed for login/signup transitions to dashboard
   setTimeout(() => {
      component.innerHTML = "";
      component.classList.add("buttonFade");
   }, 400);

   setTimeout(() => {
      component.classList.add("overtaken");
   }, 500);

   dimensionInterval = setInterval(() => {
      checkDimensions(component, link);
   }, 100);

   window.addEventListener("beforeunload", function () {
      clearInterval(dimensionInterval);
   });

   // Rare care of very large screen view ports, end the animation early
   setTimeout(() => {
      window.location.assign(link);
   }, 5000);
}

const inputs = document.getElementsByTagName("input");
let messageContainer;
let editingContainer;

function removeMessage () {
   if (document.body.contains(editingContainer)) {
      editingContainer.classList.remove("errorInput");
   }

   if (document.body.contains(messageContainer)) {
      messageContainer.style.animation = "fadeOut 0.5s ease-in-out forwards";
      setTimeout(() => {
         messageContainer.remove();
      }, 450);
   }
}

function displayMessage (inputComponent, message, classType) {
   removeMessage();

   setTimeout(() => {
      if (messageContainer) {
         messageContainer.remove();
      }
      messageContainer = Object.assign(document.createElement("p"), {
         className: classType,
         innerHTML: message,
      });
      inputComponent.before(messageContainer);
   }, 450);
}

const header = document.querySelector("header");
const mainTag = document.querySelector("main");
const footerTag = document.querySelector("footer");

function openPopUp (component) {
   component.dataset.visible = true;

   if (!(component.classList.contains("popupShown"))) {
      component.style.visibility = "visible";
      component.classList.remove("popupHidden");
      component.querySelector("button").disabled = false;

      // Apply blur to all other elements
      header.style.filter =
      mainTag.style.filter =
      footerTag.style.filter =
        "blur(5px)";

      // Add transition to button for smooth animation on hover
      component.getElementsByTagName("button")[0].style.transition = "0.5s";
      component.classList.add("popupShown");
   }
}

function exitPopUp (component, form, icon, button) {
   component.dataset.visible = false;

   if (component.classList.contains("popupShown")) {
      icon.classList.add("clicked");

      if (button) {
         button.disabled = true;
      }

      // Spin animation and make sure button fades out with the container by setting transition to initial
      component.getElementsByTagName("button")[0].style.transition = "initial";

      // Remove all blur applications
      header.style.filter =
      mainTag.style.filter =
      footerTag.style.filter =
        "initial";

      component.classList.remove("popupShown");
      component.classList.add("popupHidden");

      setTimeout(() => {
         if (!(component.dataset.visible)) {
            component.style.visibility = "hidden";
         }
         
         icon.classList.remove("clicked");

         // Ensure form is reset for further usage
         if (button) {
            button.disabled = false;
         }

         form.reset();

         const possibleSwitch = document.querySelector("input[type='checkbox']");

         if (possibleSwitch) {
            possibleSwitch.checked = false;
         }

         removeMessage();
      }, 1000);
   }
}

function openNotification (iconClass, notificationHTML, notificationType) {
   const notification = document.createElement("div");
   notification.className = "popupNotification";

   notification.innerHTML = `
      <div class = 'popupIconContainer ${notificationType}'>
         <i class='${iconClass}'></i>
      </div>
      <div class = 'popupExitContainer'>
         <i class="fa-solid fa-xmark exitNotificationIcon" ></i>
      </div>
      ${notificationHTML}
   `;

   document.body.append(notification);
   notification.classList.add("notificationShown");

   notification.querySelector(".exitNotificationIcon").onclick = function () {
      this.classList.add("clicked");
   };

   notification.querySelector(".popupExitContainer").onclick = function () {
      notification.classList.remove("notificationShown");
      notification.classList.add("notificationHidden");
      setTimeout(() => {
         notification.remove();
      }, 2000);
   };

   return notification;
}

async function sendRequest (
   url,
   structuredFormData,
   formButton,
   formButtonText,
   successFunction = () => {},
   failFunction = () => {}
) {
   // Interesting loading animation inside button
   formButton.disabled = true;
   formButton.innerHTML =
    "<div class=\"lds-facebook\"><div></div><div></div><div></div></div>";
   removeMessage();

   try {
      const response = await fetch(url, {
         method: "POST",
         body: structuredFormData,
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
      });

      const data = await response.json();

      if (data.error === true) {
         throw new Error("");
      }

      if (data.status !== "pass") {
         displayMessage(formButton, data.message, "error");
         editingContainer = document.getElementById(data.componentID);
         editingContainer.classList.add("errorInput");
         formButton.innerHTML = formButtonText;
         formButton.disabled = false;
         failFunction();
      } else {
         displayMessage(formButton, data.message, "informational");
         formButton.innerHTML = formButtonText;
         // Success functions may need data from request or current message container in scope of current module
         successFunction(data, messageContainer);
         return data;
      }
   } catch (error) {
      console.log(error);

      // Handle errors if the request fails
      openNotification(
         "fa-solid fa-triangle-exclamation",
         "<p>Could not successfully process request</p>",
         "errorType"
      );
      formButton.disabled = false;
      formButton.innerHTML = formButtonText;
      failFunction();
   }
}

// Shared onfocus for all form inputs
for (const input of inputs) {
   input.onfocus = function () {
      removeMessage();
      this.classList.remove("errorInput");
   };
}

// Shared function for password inputs
const passwordIcons = document.querySelectorAll(".fa-regular.fa-eye");

passwordIcons.forEach((icon) => {
   icon.onclick = function () {
      // Target container in dataset to toggle visible or hidden password
      const passwordContainer = document.getElementById(this.dataset.container);

      if (passwordContainer.type == "password") {
         passwordContainer.type = "text";
         this.style.color = "#08B0FF";
      } else {
         passwordContainer.type = "password";
         this.style.color = "black";
      }
   };
});

const footerYear = document.getElementById("footerYear");

if (footerYear) {
   footerYear.innerText = new Date().getUTCFullYear().toString();
}

document.addEventListener("keydown", function (event) {
   if (event.key == "Escape") {
      const possiblePopUp = document.querySelector(".popupShown");

      if (possiblePopUp) {
         // Click on exit icon to escape pop up form or notification
         possiblePopUp.querySelector(".popupExitContainer i").click();
      }
   }
});

export {
   transitionToPage,
   displayMessage,
   removeMessage,
   openPopUp,
   exitPopUp,
   openNotification,
   sendRequest,
};
