import { transitionToPage } from "../../shared/scripts/shared.js";

let usernameContainer = document.getElementById('usernameContainer');

document.getElementById('logOutButton').onclick = function(event){
   transitionToPage(this, '/users/logout');
}
