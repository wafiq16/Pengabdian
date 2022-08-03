// Import the functions you need from the SDKs you need
var firebase = require('firebase-admin');
var serviceAccount = require("../dummy.json");

// Initialize Firebase
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://dummy-90613-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

module.exports = firebase;