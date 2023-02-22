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

var arr_meaning = ["", ""];

async function getMeaning(word) {
  await axios.get("http://aha-dic.com/View.asp?word=" + word)
    .then(async (html) => {
      const $ = cheerio.load(html.data);
      var count = 0;
      var meaning = "";

      $('ul li').each((idx, el) => {
        if(count != 0)
          meaning += ', ';
        
        meaning += $(el).text()
        count++;
      });

      arr_meaning[0] = meaning;
      // updateItem(update_word, meaning);
  })
  .catch((err) => console.log(err));

  await axios.get("https://dictionary.cambridge.org/ko/%EC%82%AC%EC%A0%84/%EC%98%81%EC%96%B4-%ED%95%9C%EA%B5%AD%EC%96%B4/" + word)
    .then(async (html) => {
      const $ = cheerio.load(html.data);
      var meaning = "";
      
      $('.ddef_d').each((idx, el) => {
        meaning += ($(el).text()) + '.\n\n';
      });

      arr_meaning[1] = meaning;
    });

  return arr_meaning;
}

async function getExample(word) {
  var example = "";

  await axios.get("https://dictionary.cambridge.org/ko/%EC%82%AC%EC%A0%84/%EC%98%81%EC%96%B4-%ED%95%9C%EA%B5%AD%EC%96%B4/" + word)
    .then(async (html) => {
      const $ = cheerio.load(html.data);
      
      $('.eg').each((idx, el) => {
        if(($(el).text()).slice(-1) == '.')
          example += ($(el).text()) + '\n\n';
        else
          example += ($(el).text()) + '.' + '\n\n';
      });
    });

    return example;
}

async function addToMySQL(word) {
  const arr_meaning = await getMeaning(word);
  const example = await getExample(word);

  var exist_row = null;

  if(!(arr_meaning[0].includes("검색한 단어")) && !(arr_meaning[1] == "")) {
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
              await connection.query('UPDATE Dictionary SET kr = ?, en = ?, example = ?, date = ? WHERE word = ?', [arr_meaning[0], arr_meaning[1], example, dateTime.create().format('Y-m-d'), word]);
        
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
              await connection.query('INSERT INTO Dictionary VALUES (?, ?, ?, ?, ?)', [word, arr_meaning[0], dateTime.create().format('Y-m-d'), arr_meaning[1], example]);

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
  
  if(!(arr_meaning[0].includes("검색한 단어")) && (arr_meaning[1] == "")) {
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
                await connection.query('UPDATE Dictionary SET kr = ?, example = ?, date = ? WHERE word = ?', [arr_meaning[0], example, dateTime.create().format('Y-m-d'), word]);
          
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
                await connection.query('INSERT INTO Dictionary VALUES (?, ?, ?, ?, ?)', [word, arr_meaning[0], dateTime.create().format('Y-m-d'), arr_meaning[1], example]);

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

    if((arr_meaning[0].includes("검색한 단어")) && !(arr_meaning[1] == "")) {
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
                  await connection.query('UPDATE Dictionary SET en = ?, example = ?, date = ? WHERE word = ?', [arr_meaning[1], example, dateTime.create().format('Y-m-d'), word]);
            
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
                  await connection.query('INSERT INTO Dictionary VALUES (?, ?, ?, ?, ?)', [word, arr_meaning[0], dateTime.create().format('Y-m-d'), arr_meaning[1], example]);
  
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
  const arr_meaning = await getMeaning(word);
  const example = await getExample(word);

  if(!(arr_meaning[0].includes("검색한 단어")) && !(arr_meaning[1] == "")) {
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
                'KR' : {
                    type: 'rich_text',
                    rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: arr_meaning[0],
                        },
                    }
                  ],
                },
                'EN' : {
                  type: 'rich_text',
                  rich_text: [
                  {
                      type: 'text',
                      text: {
                          content: arr_meaning[1],
                      },
                  }
                ],
              },
              'EX' : {
                type: 'rich_text',
                rich_text: [
                {
                    type: 'text',
                    text: {
                        content: example,
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

  if(!(arr_meaning[0].includes("검색한 단어")) && (arr_meaning[1] == "")) {
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
                'KR' : {
                  type: 'rich_text',
                  rich_text: [
                  {
                      type: 'text',
                      text: {
                          content: arr_meaning[0],
                      },
                  }
                ],
              },
              'EX' : {
                type: 'rich_text',
                rich_text: [
                {
                    type: 'text',
                    text: {
                        content: example,
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

  if((arr_meaning[0].includes("검색한 단어")) && !(arr_meaning[1] == "")) {
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
                'EN' : {
                  type: 'rich_text',
                  rich_text: [
                  {
                      type: 'text',
                      text: {
                          content: arr_meaning[1],
                      },
                  }
                ],
              },
              'EX' : {
                type: 'rich_text',
                rich_text: [
                {
                    type: 'text',
                    text: {
                        content: example,
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
        addToMySQL(word);
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
