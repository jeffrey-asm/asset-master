export const positiveGradient = [
   "#FF0000", // Red
   "#FF1A00",
   "#FF3300",
   "#FF4D00",
   "#FF6600",
   "#FF8000",
   "#FF9900",
   "#FFB200",
   "#FFCC00",
   "#FFE500",
   "#FFFF00",
   "#E5FF00",
   "#CCFF00",
   "#B2FF00",
   "#99FF00",
   "#80FF00",
   "#66FF00",
   "#4DFF00",
   "#33FF00",
   "#1AFF00",
   "#00FF00"
];

export const negativeGradient = [...positiveGradient].reverse();

export function constructCategory(mainOrSub,type,ID,name,current,total){
   let formattedCurrent = parseFloat(current).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
   let formattedTotal = parseFloat(total).toLocaleString("en-US",{ minimumFractionDigits: 2, maximumFractionDigits: 2 });
   let mainContainer = document.getElementById(`${type}`);

   let container = document.createElement('div');
   container.id = ID;
   container.className = `${mainOrSub}Category`;
   container.innerHTML = `
      <h2 class = "categoryHeading">${name}</h2>
      <h3 class = "categoryTotal">$${formattedCurrent}/ $${formattedTotal}</h3>
      <div class = "progressBar">
         <div class = "currentProgress"></div>
      </div>
      <button class = "editCategory">
         <span>
            <i class = "fa-solid fa-pen-to-square"></i> Edit
         </span>
      </button>
   `;

   let color;
   let colorIndex = 0;
   let fraction = current / total;

   if(positiveGradient.length * fraction >= positiveGradient.length){
      colorIndex = positiveGradient.length - 1;
   } else{
      colorIndex = Math.floor(positiveGradient.length * fraction);
   }

   if(type == 'Income'){
      color = positiveGradient[colorIndex];
   } else{
      color = negativeGradient[colorIndex];
   }

   let containerProgressBar = container.getElementsByClassName('currentProgress')[0];
   mainContainer.append(container);

   setTimeout(()=>{
      //Update progress bar during animation for changing progress visuals
      containerProgressBar.style.width = `${Math.ceil(fraction * 100)}%`;
      containerProgressBar.style.backgroundColor = color;
   },50);
}




export function updateCategory(){
   // Implement later
}
