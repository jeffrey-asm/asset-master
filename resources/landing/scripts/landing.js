import { transitionToPage } from "../../shared/scripts/shared.js";

let loginButton = document.getElementById("loginButton");
let signUpButton = document.getElementById("registerButton")

loginButton.onclick = function (event) {
   transitionToPage(this, '/login');
}

signUpButton.onclick = function (event) {
   transitionToPage(this, '/signup');
}

export {transitionToPage};
