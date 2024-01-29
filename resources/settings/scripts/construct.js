
import {openNotification}  from "../../shared/scripts/shared.js";

export async function updateProfileInfo(){
   let username = document.getElementById('username');
   let email = document.getElementById('email');

   try {
      const response = await fetch('../users/getUserInfo', {
        method: "GET",
      });

      const data = await response.json();


      username.value = `${data.Username}`;
      email.value = `${data.Email}`;
      document.body.style.opacity = '1';
    } catch (error) {
      document.body.style.opacity = '1';
      username.value = `N/A`;
      email.value = `N/A`;
      openNotification("fa-solid fa-triangle-exclamation", '<p>Could not successfully process request</p>', 'errorType');
    }
}