
import { openNotification }  from "../../shared/scripts/shared.js";

export async function updateProfileInfo () {
   const username = document.getElementById("username");
   const email = document.getElementById("email");

   try {
      const response = await fetch("../users/getUserInfo", {
         method: "GET",
      });

      const data = await response.json();

      username.value = `${data.username}`;
      email.value = `${data.email}`;
      document.body.style.opacity = "1";
   } catch (error) {
      console.log(error);
      document.body.style.opacity = "1";
      username.value = "N/A";
      email.value = "N/A";
      openNotification("fa-solid fa-triangle-exclamation", "<p>Could not successfully process request</p>", "errorType");
   }
}