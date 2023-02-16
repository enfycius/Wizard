var express = require('express');
var router = express.Router();

const dateTime = require('node-datetime');

const mysql = require('mysql');
const dbconfig = require('./../config/database.js');
const connection = mysql.createConnection(dbconfig);

/* GET users listing. */
router.get('/', function(req, res, next) {
  try {
    connection.query('SELECT * from Dictionary WHERE date = ?', [dateTime.create().format('Y-m-d')], (error, rows) => {
      if (error) throw error;
  
      res.render('word', { pages: rows });
    })
  } catch(e) { console.log(e); }
});

module.exports = router;