
let username = document.getElementById('username');
let email = document.getElementById('email');


fetch('/users/getUserInfo',{
   method:"GET",
})
   .then(response => response.json())
   .then(data => {
      username.innerHTML = `Username: ${data.Username}`;
      email.innerHTML = `Email: ${data.Email}`;
   })
   .catch(error => console.error(error));