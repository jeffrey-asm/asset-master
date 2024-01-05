import {openNotification}  from "../../shared/scripts/shared.js";

async function fetchFeed(){
   try {
      const response = await fetch('./fetchHomeData');

      const data = await response.json();

      let storiesContainer = document.getElementById('stories');

      let storiesItems = data.rss.channel[0].item;

      for(let i = 0; i < storiesItems.length; i++){
         console.log(storiesItems[i]);

         let story = document.createElement('div');
         story.className = 'story';

         let possibleImageURL = ``;
         let possibleImageType = ``;
         let possibleURL = storiesItems[i]['media:content'][0]['$'];

         //TODO -> check for https://images.mktw.net

         if(possibleURL && possibleURL.url){
            possibleImageURL = possibleURL.url;
            possibleImageType = possibleURL.type;
         } else{
            possibleURL = '../resources/home/images/backup.jpg';
            possibleImageType = 'text/jpeg';
         }

         story.innerHTML = `
            <div class = 'imageContainer'>
               <img src="${possibleImageURL}" alt="story-image" type="${possibleImageType}">
            </div>
            <div class = 'storyText'>
               <h1><a href = '${storiesItems[i].link}'>${storiesItems[i].title[0]}</a></h1>
               <p>${storiesItems[i].description[0]}</p>
               <h3>${storiesItems[i].author[0]}</h3>
               <h3>${storiesItems[i].pubDate[0]}</h3>
            </div>
         `

         storiesContainer.append(story);
      }


    } catch (error) {
      console.log(error);
      // Handle errors if the request fails
      openNotification("fa-solid fa-layer-group", '<p>Could not successfully process request</p>', 'errorType');
    }
}

fetchFeed();