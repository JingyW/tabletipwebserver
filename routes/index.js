// import express from 'express';
var express = require('express');
const router = express.Router();
// import session from 'express-session';
var session = require('express-session');
var mysql = require('mysql');
var Expo = require('exponent-server-sdk');

const connection = mysql.createConnection({
  host: 'ankurmgoyal.ccfuvi1hkijt.us-west-2.rds.amazonaws.com',
  port: '3306',
  user: 'ankurmgoyal',
  password: 'tab1et!p',
  database: 'dexterMVP'
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});

// let locationID = '';
// let employeeID ='';
let locationID = 'TB5bxM9c';
let employeeID = '200';
const date = new Date();


var parts = new Date().toISOString().substring(0, 10).split('-');
var dd = parts[2];
var mm = parts[1] - 1;
var yy = Number(parts[0]);
if (yy < 1000) { yy = 2000 + yy; }
var dt = new Date(yy, mm, dd);
var secs = dt.valueOf() / 1000;
var hours = secs / 3600;
var day = ~~(hours / 24);

// const epochDay = Math.floor(date / 8.64e7);  //today's date since epochDay in days
// const day = epochDay + date.getDay();


router.get('/', (req, res) => {
  res.send('Testing');
});

router.post('/login', (req, res) => {
  console.log(req.body);   //{ locationId: 'TB5bxM9c', employeeId: '200' }
  // if (req.body.locationId === locationID && req.body.employeeId.toString() === EmployeeID) {
  //   res.json({success: true});
  // }
  // else {
  //   res.json({success: false})
  // }
  res.json({success: true});
});

//Route to get the Employee Name
router.get('/name', (req, res) => {
  const tableName = locationID + '_employees';
  console.log('name', tableName);
  console.log('EmployeeID', employeeID);
  //const sql = "SELECT Name FROM " + connection.escape(tableName) + " WHERE EmployeeID = " + connection.escape(employeeID);
  const sql = 'SELECT `Name` FROM ?? WHERE `EmployeeID` = ?'
  //const sql = "SELECT Name FROM " + tableName + " WHERE EmployeeID = " + employeeID;
  connection.query(sql, [tableName, employeeID], (error, results, fields) => {
    console.log('in');
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      res.json({employeeName: results[0].Name});
    }
  });
});

//Route to get the Employee Image
router.get('/image', (request, response) => {
  const tableName = locationID + "_employees";
  //const sql = "SELECT Picture FROM " + tableName + " WHERE EmployeeID = " + employeeID;
  const sql = 'SELECT `Picture` FROM ?? WHERE `EmployeeID` = ?';
  connection.query(sql, [tableName, employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json({employeeImage: results[0].Picture.toString()});
    }
  });
});

//Route to get the goal target (expected value) and current performance
router.get('/goalandperformance', (request, response) => {
  const tableName = locationID + "_goals";
  const subQuery = "(SELECT * FROM " + connection.escapeId(tableName)
  + " t3 LEFT JOIN Skill_Info t4 USING (ID) WHERE WeekOf < "
  + connection.escape(day) + ") ";
  console.log(subQuery);
  const subQuery2 = "(SELECT * FROM " + connection.escapeId(tableName)
  + " WHERE WeekOf < " + connection.escape(day) + ") ";
  const sql = "SELECT t1.ExpectedValue, t1.NewQty FROM " + subQuery
  + " t1 LEFT OUTER JOIN " + subQuery2
  + " t2 ON (t1.EmployeeID = t2.EmployeeID AND t1.WeekOf < t2.WeekOf) WHERE t2.EmployeeID IS NULL AND t1.EmployeeID = ?";
  connection.query(sql, [employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json({
        expectedValue: results[0].ExpectedValue,
        newQuantity: results[0].NewQty,
        day: day
      });
    }
  });
});

//Route to get goal name
router.get('/goalname', (request, response) => {
  const tableName = locationID + "_goals";
  const subQuery = "(SELECT * FROM " + connection.escapeId(tableName)
  + " t3 LEFT JOIN Skill_Info t4 USING (ID) WHERE WeekOf < "
  + connection.escape(day) + ") ";
  const subQuery2 = "(SELECT * FROM " + connection.escapeId(tableName)
  + " WHERE WeekOf < " + connection.escape(day) + ") ";
  //the final name is Name + Category + (s)
  const sql = "SELECT t1.Name, t1.Category FROM " + subQuery + " t1 LEFT OUTER JOIN " + subQuery2
  + " t2 ON (t1.EmployeeID = t2.EmployeeID AND t1.WeekOf < t2.WeekOf) WHERE t2.EmployeeID IS NULL AND t1.EmployeeID = ?";
  connection.query(sql, [employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json({
        goalName: results[0].Name,
        goalCategory: results[0].Category
      });
    }
  });
});

//Route to get tips
router.get('/tips', (request, response) => {
  const tableName = locationID + "_goals";
  const subQuery = "(SELECT * FROM " + connection.escapeId(tableName)
  + " t3 LEFT JOIN Skill_Info t4 USING (ID) WHERE WeekOf < " + connection.escape(day) + ") ";
  const subQuery2 = "(SELECT * FROM " + connection.escapeId(tableName)
  + " WHERE WeekOf < " + connection.escape(day) + ") ";
  const sql = "SELECT t1.Lift, t1.ActualLift FROM " + subQuery + " t1 LEFT OUTER JOIN " + subQuery2
  + " t2 ON (t1.EmployeeID = t2.EmployeeID AND t1.WeekOf < t2.WeekOf) WHERE t2.EmployeeID IS NULL AND t1.EmployeeID = ?";
  connection.query(sql, [employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json({
        tipLift: results[0].Lift,
        tipActualLift: results[0].ActualLift
      });
    }
  });
});

router.get('/goalhistory', (request, response) => {
  const tableName = locationID + "_goals";
  const subQuery = "(SELECT * FROM " + tableName + " t3 LEFT JOIN Skill_Info t4 USING (ID))";
  const sql = "SELECT * FROM " + subQuery + " t1 WHERE EmployeeID = ? ORDER BY WeekOf DESC";
  connection.query(sql, [employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json([{
        weekOf: results[0].WeekOf,
        training: results[0].Direction + ' ' + results[0].Name + ' ' + results[0].Category,
        expectedValue: results[0].ExpectedValue,
        newQty: results[0].NewQty,
        lift: results[0].Lift,
        actualLift: results[0].ActualLift
      }]);
    }
  });
});

router.get('/leaderboard', (request, response) => {
  const tableName = locationID + "_goals";
  const empTable = locationID + "_employees";
  const subQuery = "(SELECT * FROM " + tableName + " t3 LEFT JOIN " + empTable + " t4 USING (EmployeeID) WHERE WeekOf < " + connection.escape(day) +") ";
  const subQuery2 = "(SELECT * FROM " + tableName + " WHERE WeekOf < " + connection.escape(day) +") ";

  const sql = "SELECT t1.EmployeeID, t1.Picture, t1.Name, t1.Lift, t1.ActualLift, (t1.NewQty/ t1.ExpectedValue) AS Score FROM " + subQuery + " t1 LEFT OUTER JOIN "
  + subQuery2 + " t2 ON (t1.EmployeeID = t2.EmployeeID AND t1.WeekOf < t2.WeekOf) WHERE t2.EmployeeID IS NULL ORDER BY Score DESC"
  connection.query(sql, (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json([{
        name: results[0].Name,
        score: results[0].Score,
        picture: results[0].Picture.toString(),
        lift: results[0].Lift,
        actualLift: results[0].ActualLift
    }])
    }
  });
});

router.post('/pushtoken', (request, response) => {
  // To check if something is a push token
  let isPushToken = Expo.isExponentPushToken(req.body.token.value);
  if (isPushToken) {
    // Create a new Expo SDK client
    let expo = new Expo();
    // To send push notifications
    expo.sendPushNotificationsAsync([{
      // The push token for the app user to whom you want to send the notification
      to: 'ExponentPushToken[' + req.body.token.value + ']',
      sound: 'default',
      body: 'This is a test notification',
      data: {withSome: 'data'},
    }])
    .then(function(receipts) {
      console.log(receipts);
    })
    .catch(function(error) {
      console.error(error);
    })
  }
});

module.exports = router;
