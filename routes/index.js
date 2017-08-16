var express = require('express');
const router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var Expo = require('exponent-server-sdk');
var CryptoJS = require("crypto-js");

var host = process.env.HOST;
var port = process.env.PORT_SQL;
var user = process.env.USER;
var password = process.env.PASSWORD;
var database = process.env.DATABASE;

const connection = mysql.createConnection({
  host: host,
  port: port,
  user: user,
  password: password,
  database: database
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
//7dc5efd3fbec24b5055b27cfe0c0eadfde9f7d6d8bbe9888cc89e0aafe1e88b4125e262e84d3584bbddf4185911fdc076e4d09ffb44f152c995634539a1d23b0


//Route to login into app
//Ankur comment
router.post('/login', (req, res) => {
  console.log('REQBODY', req.body)
  var usernameInput = req.body.username;
  var passwordInput = req.body.password;
  var salt = 'salt'; //CryptoJS.lib.WordArray.random(128/8)
  var userHash = CryptoJS.PBKDF2(passwordInput, salt, { keySize: 512/32, iterations: 1000 }).toString();
  const tableName = 'Users';
  const sql = 'SELECT locationID, employeeID, firstTime, password FROM ?? WHERE username = ?';
  connection.query(sql, [tableName, usernameInput], (error, results, fields) => {
    if (error) {
      console.log('Error: ' + error);
      res.json({success: false});
    }
    // else if (userHash === results[0].password){
		else {
      console.log(userHash, results[0].password, "compare passwordddd")
			if (userHash.indexOf(results[0].password.toString()) === 0) {
				if (results[0].firstTime !== 'false') {
					locationID = results[0].locationID;
					employeeID = results[0].employeeID;
					res.json({firstTimeLogin:true});
				} else {
					if (results && results.length > 0) {
						locationID = results[0].locationID;
						employeeID = results[0].employeeID;
						res.json({
							success: true,
							employeeID: results[0].employeeID,
							locationID: results[0].locationID
						});
					} else {
						res.json({success: false});
					}
				}
			}else {
				console.log("wrong password");
				res.json({success:false})
			}
    }
  });
});

router.post('/firstLogin', (req, res) => {
  var passwordInput = req.body.password;
	var userName = req.body.username
  var salt = 'salt'; //CryptoJS.lib.WordArray.random(128/8)
  var userHash = CryptoJS.PBKDF2(passwordInput, salt, { keySize: 512/32, iterations: 1000 }).toString();
	console.log(userHash, userName,"firstlogin information")
	const updatePass = "UPDATE `Users` SET `firstTime` = ?, `password` = ? WHERE `username` = ?";
	connection.query(updatePass,['true', userHash, userName],(error, result, fields) => {
		if (error) {
			console.log('Error: ' + error);
			res.json({success: false});
		} else {
			console.log('json adsjfklajlsdf')
			res.json({success: true});
		}
	})
})

//Route to get the Employee Name
router.get('/name', (req, res) => {
  const tableName = locationID + '_employees';
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
