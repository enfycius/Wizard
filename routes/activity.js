const { Client } = require("@notionhq/client");

var express = require('express');
var router = express.Router();
var path = require('path');

const dateTime = require('node-datetime');

const mysql = require('mysql');
const dbconfig = require('./../config/database.js');
const connection = mysql.createConnection(dbconfig);

require("dotenv").config({ path: path.join(__dirname, './../config/.env') })

const notion = new Client({ auth: process.env.NOTION_KEY });

const databaseId = process.env.NOTION_DATABASE_ID_ACTIVITY;

async function addToMyNotion(activity) {
  try {
    const response = await notion.pages.create({
        parent: {
            database_id: databaseId,
        },
        properties: {
            'Task': {
                type: 'title',
                title: [
                {
                    type: 'text',
                    text: {
                        content: activity,
                    },
                },
                ],
            }
        }    
    });
    console.log(response);  
} catch (error) {
    console.error(error.body);
}
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  try {
    connection.query('SELECT * FROM Activity', (error, rows) => {
      if (error) throw error;
      
      console.log(rows);

      res.render('activity', { activities: JSON.stringify(rows) });
      
    })
  } catch(e) { console.log(e); }
});

router.post('/save', function(req, res, next) {
  try {
    connection.query('INSERT INTO Activity VALUES (?, ?)', [req.body.btn_txt, req.body.btn_id], (error, rows) => {
      if (error) throw error;
      
      try {
        addToMyNotion(req.body.btn_txt);
      } catch(e) {}

      res.sendStatus(200);
    })
  } catch(e) { console.log(e); }
});

router.post('/check', function(req, res, next) {
  try {
    addToMyNotion(req.body.btn_txt);
  } catch(e) { console.log(e); }
});

router.post('/delete', function(req, res, next) {
  try {
    connection.query('DELETE FROM Activity WHERE activity = ? AND id = ?', [req.body.btn_txt, req.body.btn_id], (error, rows) => {
      if (error) throw error;
      
      res.sendStatus(200);
      
    })
  } catch(e) { console.log(e); }
});

module.exports = router;