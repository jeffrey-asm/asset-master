import { transitionToPage } from "../../shared/scripts/shared.js";

const loginButton = document.getElementById("loginButton");
const signUpButton = document.getElementById("registerButton");


loginButton.onclick = function () {
   transitionToPage(this, "/login");
};

signUpButton.onclick = function () {
   transitionToPage(this, "/signup");
};

