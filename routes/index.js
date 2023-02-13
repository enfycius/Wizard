const { Client } = require("@notionhq/client");

var express = require('express');
var router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

require('dotenv').config();

// var cur_length = null;
// var ex_length = null;
// var update_word = null;

const notion = new Client({ auth: process.env.NOTION_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

var meaning = null;

/* async function findAndSendMeaning(word_data) {
  console.log("\nFetching tasks from Notion DB...");
  const [length, word] = await getTasksFromNotionDatabase();

  console.log(word_data);
  
  cur_length = length;

  console.log(cur_length);
  console.log(word);
  
  const update_length = await findUpdatedTasks(cur_length);
  
  console.log(update_length);

  console.log(`Found ${update_length} updated tasks.`);

  if(update_length > 0) {
    console.log("Trigger Event");

    sleep(2000);

    const [length, word] = await getTasksFromNotionDatabase();
    
    try {
      update_word = word.toString();
    } catch(e) {
      update_word = "";
    }

    await axios.get("http://aha-dic.com/View.asp?word=" + update_word)
    .then(async (html) => {
      const $ = cheerio.load(html.data);
      var count = 0;
      var meaning = "";
      // console.log(html.data);


      $('ul li').each((idx, el) => {
        if(count != 0)
          meaning += ', ';
        
        meaning += $(el).text()
        count++;
      });

      updateItem(update_word, meaning);
    })
    .catch((err) => console.log(err));
  }
} */

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


/* async function findUpdatedTasks(cur_length) {
  if(cur_length == ex_length) {
    return 0;
  } else if(cur_length > ex_length) {
    const temp_length = ex_length;
    
    ex_length = cur_length;

    return (cur_length - temp_length);
  } else {
    const [length, word] = await getTasksFromNotionDatabase();
    
    cur_length = ex_length = length;

    return 0;
  }
} */

/* async function setInitialTaskPageIdToStatusMap() {
  const [length, word] = await getTasksFromNotionDatabase();

  cur_length = length;
  ex_length = cur_length;
} */

/* async function getTasksFromNotionDatabase() {
  const pages = [];
  let cursor = undefined;

  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    })
    pages.push(...results)
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  console.log(`${pages.length} pages successfully fetched.`);

  var page = pages[0];

  // for (const page of pages) {
  //   // const pageId = page.id

  //   // const responseResults = results.map((page) => {
  //   //   return {
  //   //     id: page.id,
  //   //     word: page.properties.Word.title[0]?.plain_text,
  //   //     meaning: page.properties.Meaning.rich_text[0]?.plain_text,
  //   //   };
  //   // });

  //   console.log(page.properties.Word.title[0]?.plain_text);
  // }
  return [pages.length, page.properties.Word.title[0]?.plain_text];
} */

async function addToDatabase(word) {
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
                          content: await getMeaning(word),
                      },
                  }
                ],
              },
          }    
      });
      console.log(response);
  } catch (error) {
      console.error(error.body);
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
    }
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/create', function(req, res, next) {
  var word = req.body.word;
  
  // setInitialTaskPageIdToStatusMap().then(() => {
  //   findAndSendEmailsForUpdatedTasks(req.body.word);
  // });

  createItem(word);

  res.sendStatus(200);
});

module.exports = router;
