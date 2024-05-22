const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');
dotenv.config();

// // Function to generate a random key (for demonstration purposes)
// function generateRandomKey() {
//   return CryptoJS.lib.WordArray.random(32).toString();
// }

// Function to encrypt an object
function encryptObject(object, key) {
  const jsonString = JSON.stringify(object);
  const ciphertext = CryptoJS.AES.encrypt(jsonString, key).toString();
  return ciphertext;
}

// Function to decrypt an object
function decryptObject(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const jsonString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonString);
}

module.exports = {
  encryptObject,
  decryptObject
}