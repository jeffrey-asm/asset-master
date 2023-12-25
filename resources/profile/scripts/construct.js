
export async function updateProfileInfo(){
   try {
      const response = await fetch('../users/getUserInfo', {
        method: "GET",
      });

      const data = await response.json();

      let username = document.getElementById('username');
      let email = document.getElementById('email');

      username.value = `${data.Username}`;
      email.value = `${data.Email}`;

      let previousVerifiedComponent = document.getElementById('emailContainer').lastElementChild;
      let newContainer;

      if(data.Verified !== 'F'){
         newContainer = Object.assign(document.createElement('img'), { src: '../resources/profile/images/verified.jpg', alt: 'verified-image', id: 'verifiedImage'});
      } else{
         newContainer = Object.assign(document.createElement('button'), { type:'button',className: 'securityButton',id: 'changePasswordPopUp', innerHTML:'Change Password'});
      }

      // We replace previous verified state node with new container
      previousVerifiedComponent.parentNode.replaceChild(newContainer, previousVerifiedComponent);
    } catch (error) {
      username.value = `N/A`;
      email.value = `N/A`;
    }
}