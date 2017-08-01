const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require("./config.json");
const axios = require('axios')
admin.initializeApp(functions.config().firebase);
const dbRootRef = admin.database().ref();
const app = require('express')();
const Expo = require('exponent-server-sdk');

let expo = new Expo();

function sendPush(pushToken) {
  console.log('we are in sendPush function', pushToken);
   expo.sendPushNotificationsAsync([{
      to: pushToken,
      sound: 'default',
      body: 'You have received a new message.',
   }])
   .then(() => {
    console.log('success for pushing notifications');
   })
  .catch((err) => {
     console.log('error for pushing notifications', err);
    })
}

app.post('/pushtoken', (req, res) => {
  var serverId = req.body.serverId.value;
  var pushToken = req.body.token;
  console.log('HI', req.body, pushToken);
  dbRootRef.child(`/Users/${serverId}/pushtoken`).set(pushToken);
  res.json({success: true});
});

/**
   * New message added
   * @type {DATABASE TRIGGER}
  */
 exports.addMessages = functions.database
   // listen for new users in ANY topic
   .ref('/Messages/Managers/{managerId}/{serverId}/{message}')
   .onCreate((event) => {
     // get all of the children of the topic in question
     //const myTopic = event.params.changedTopic;
     console.log('GETTING IN HEREEEE', event);
     const managerId = event.params.managerId;
     const serverId = event.params.serverId;
     dbRootRef.child(`/Users/${serverId}/pushtoken`).once('value')
     .then((pushToken) => {
       console.log('HELLOOOOOOOO', pushToken, pushToken.val());
       if (pushToken) {
         sendPush(pushToken.val());
       }
     });
  });

exports.route = functions.https.onRequest(app);
