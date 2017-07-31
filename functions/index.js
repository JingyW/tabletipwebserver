const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("./config.json");
const axios = require('axios')
admin.initializeApp(functions.config().firebase);
const dbRootRef = admin.database().ref();

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});
