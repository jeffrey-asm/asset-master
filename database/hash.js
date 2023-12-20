const cryptoJS = require('crypto-js');

function hash(password){
   //Simple Hash Function provided by crypto-js for consistent hashes and safety of user sensitive info
   return cryptoJS.SHA256(password).toString(cryptoJS.enc.Hex);
}

module.exports = hash;