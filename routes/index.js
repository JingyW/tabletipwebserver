// import express from 'express';
var express = require('express');
const router = express.Router();
// import session from 'express-session';
var session = require('express-session');
var mysql = require('mysql');
var Expo = require('exponent-server-sdk');

const connection = mysql.createConnection({
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});

let locationID = '';
let employeeID ='';
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

//Route to login
router.post('/login', (req, res) => {
  var usernameInput = req.body.username;
  var passwordInput = req.body.password;
  const tableName = 'Users';
  const sql = 'SELECT locationID, employeeID FROM ?? WHERE username = ?';
  connection.query(sql, [tableName, usernameInput], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
      res.json({success: false});
    }
    else {
      console.log('RESULLLTSSSS', results);
      if (results && results.length > 0) {
        res.json({
          success: true,
          employeeID: results[0].employeeID,
          locationID: results[0].locationID
        });
      } else {
        res.json({success: false});
      }
    }
  });
});

//Route to get the Employee Name
router.get('/name', (req, res) => {
  const tableName = locationID + '_employees';
  console.log('name', tableName);
  console.log('EmployeeID', employeeID);
  const sql = 'SELECT `Name` FROM ?? WHERE `EmployeeID` = ?'
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

//Route to get managerId
router.get('/managerId', (request, response) => {
  const tableName = locationID + "_employees";
  const sql = 'SELECT `manager` FROM ?? WHERE `EmployeeID` = ?';
  connection.query(sql, [tableName, employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      response.json({managerId: results[0].manager.toString()});
    }
  });
})

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

//Route to get goal history
router.get('/goalhistory', (request, response) => {
  const tableName = locationID + "_goals";
  const subQuery = "(SELECT * FROM " + tableName + " t3 LEFT JOIN Skill_Info t4 USING (ID))";
  const sql = "SELECT * FROM " + subQuery + " t1 WHERE EmployeeID = ? ORDER BY WeekOf DESC";
  connection.query(sql, [employeeID], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
    }
    else {
      console.log('RESULT IS FROM GOAL HISTORY', results);
      var finalArr = [];
      for (var i = 0; i < results.length; i++) {
        var obj = {
          weekOf: results[i].WeekOf,
          newQuantity: results[i].NewQty,
          expectedValue: results[i].ExpectedValue,
          direction: results[i].Direction,
          name: results[i].Name,
          categories: results[i].Category,
          lift: results[i].Lift,
          actualLift: results[i].ActualLift
        }
        finalArr.push(obj);
      }
      console.log('FINAL ARRAY', finalArr);
      response.json({result: finalArr});
    }
  });
});

//Route to get leaderboard
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
      console.log('RESULT IS FROM LEADERBOARD', results);
      var finalArr = [];
      for (var i = 0; i < results.length; i++) {
        if (results[i].Picture === null) {
          var obj = {
            employeeId: results[i].EmployeeID,
            name: results[i].Name,
            score: results[i].Score,
            lift: results[i].Lift,
            actualLift: results[i].ActualLift
          }
        } else {
          var obj = {
            employeeId: results[i].EmployeeID,
            picture: results[i].Picture.toString(),
            name: results[i].Name,
            score: results[i].Score,
            lift: results[i].Lift,
            actualLift: results[i].ActualLift
          }
        }
        finalArr.push(obj);
      }
      response.json({result: finalArr});
    }
  });
});

module.exports = router;
