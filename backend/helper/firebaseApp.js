const { initializeApp } = require("firebase/app");
// Load dotenv if not already loaded
require('dotenv').config();
// Firebase configuration object containing credentials and settings
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');

// Initialize Firebase app with the provided configuration
const firebaseApp = initializeApp(firebaseConfig);
// console.log(firebaseApp)
// Export the initialized Firebase app for external use
module.exports = firebaseApp;