
import {openNotification}  from "../../shared/scripts/shared.js";

export async function updateProfileInfo(){
   let mainTag = document.querySelector('main');

   try {
      const response = await fetch('../users/getUserInfo', {
        method: "GET",
      });

      const data = await response.json();

      let username = document.getElementById('username');
      let email = document.getElementById('email');

      username.value = `${data.Username}`;
      email.value = `${data.Email}`;
      mainTag.style.opacity = '1';

    } catch (error) {
      mainTag.style.opacity = '1';
      username.value = `N/A`;
      email.value = `N/A`;
      openNotification("fa-solid fa-triangle-exclamation", '<p>Could not successfully process request</p>', 'errorType');
    }
}