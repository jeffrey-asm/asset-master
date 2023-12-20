function randomIdentification() {
   //Create random id for a transaction using both chars and ints from current date
   let randomID = Math.random().toString(36).replace(/[^a-z]+/g, '') + Date.now();
   return randomID.substring(0,30);
}

module.exports = randomIdentification;