const { Client } = require("@notionhq/client");

var express = require('express');
var router = express.Router();

const dateTime = require('node-datetime');

const axios = require('axios');
const cheerio = require('cheerio');

const mysql = require('mysql2/promise');
const dbconfig = require('./../config/database.js');
const pool = mysql.createPool(dbconfig);

require('dotenv').config();

// var cur_length = null;
// var ex_length = null;
// var update_word = null;

const notion = new Client({ auth: process.env.NOTION_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

var meaning = null;

async function getMeaning(word) {
  await axios.get("http://aha-dic.com/View.asp?word=" + word)
    .then(async (html) => {
      const $ = cheerio.load(html.data);
      var count = 0;
      meaning = "";

      $('ul li').each((idx, el) => {
        if(count != 0)
          meaning += ', ';
        
        meaning += $(el).text()
        count++;
      });
      // updateItem(update_word, meaning);
  })
  .catch((err) => console.log(err));

  return meaning;
}

async function addToMySQL(word) {
  const meaning = await getMeaning(word);

  var exist_row = null;
  
  if(!(meaning.includes("검색한 단어"))) {
      await (async() => {
        try {
          const connection = await pool.getConnection(async(conn) => conn);
            try {
              exist_row = await connection.query('SELECT * from Dictionary WHERE word = ?', [word]);
        
              await connection.commit();
              connection.release();

              return [rows];
            } catch(error) { 
              await connection.rollback();
              connection.release();
            };
        } catch(error) { };
      })();
      
      if(exist_row[0].length != 0) {
          await (async() => {
            try {
              const connection = await pool.getConnection(async(conn) => conn);

              try {
                await connection.query('UPDATE Dictionary SET date = ? WHERE word = ?', [dateTime.create().format('Y-m-d'), word]);
          
                await connection.commit();
                
                connection.release();
              } catch(error) {
                await connection.rollback();

                connection.release();
              }
            } catch(error) { };
          })();
      } else {
          await (async() => {
            try {
              const connection = await pool.getConnection(async(conn) => conn);
              
              try {
                await connection.query('INSERT INTO Dictionary VALUES (?, ?, ?)', [word, meaning, dateTime.create().format('Y-m-d')]);
  
                await connection.commit();

                connection.release();
              } catch(error) {
                await connection.rollback();

                connection.release();
              }
            } catch(error) { };
            
          })();
        }
      }
}

async function addToDatabase(word) {
  const meaning = await getMeaning(word);

  if(!(meaning.includes("검색한 단어"))) {
    try {
        const response = await notion.pages.create({
            parent: {
                database_id: databaseId,
            },
            properties: {
                'Word': {
                    type: 'title',
                    title: [
                    {
                        type: 'text',
                        text: {
                            content: word,
                        },
                    },
                    ],
                },
                'Meaning' : {
                    type: 'rich_text',
                    rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: meaning,
                        },
                    }
                  ],
                },
                'Date' : {
                  type: 'date',
                  date: {
                      start: dateTime.create().format('Y-m-d')
                  }
                }
            }    
        });
        console.log(response);  
    } catch (error) {
        console.error(error.body);
    }
  }
}

async function queryDatabase(word) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      "filter": {
        "property": "Word",
        "rich_text": {
          "contains": word
        }
      }
    });

    console.log(response);

    if(response.results.length != 0) {
      return true;
    } else {
      return false;
    }

    // return response.results[0].id;
  } catch(error) {
    console.log(error.body);
  }
}

async function createItem(word) {
  queryDatabase(word)
  .then(async result => {
    console.log(result);

    if(!(result)) {
      try {
        addToDatabase(word);
      } catch(e) {}
    } else {
      try {
        addToMySQL(word);
      } catch(e) {}
    }
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
    const rows = (async() => {

      try {
          var rows = null;

          const connection = await pool.getConnection(async(conn) => conn);

          try {
            await connection.query('SELECT * from Dictionary WHERE date = ?', [dateTime.create().format('Y-m-d')], function(err, results) {
              rows = results;
            });

            await connection.commit();

            connection.release();
          } catch(error) {

            await connection.rollback();

            connection.release();
          }
        } catch(error) { };

        return rows;
      })();

    res.render('index', { pages: JSON.stringify(rows) });
});

router.post('/create', function(req, res, next) {
  var word = req.body.word;

  createItem(word);

  res.sendStatus(200);
});

module.exports = router;
