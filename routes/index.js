// import express from 'express';
var express = require('express');
const router = express.Router();
// import session from 'express-session';
var session = require('express-session');
var mysql = require('mysql');

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
const epochDay = Math.floor(date / 8.64e7);  //today's date since epochDay in days
const day = epochDay + (8 % date.getDay());


router.get('/', (req, res) => {
  res.send('Testing');
});

router.post('/login', (req, res) => {
  console.log(req.body);   //{ locationId: 'TB5bxM9c', employeeId: '200' }
  if (req.body.locationId === locationID && req.body.employeeId === EmployeeID) {
    res.json({success: true});
  }
  else {
    res.json({success: false})
  }
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

// export default router;
module.exports = router;
