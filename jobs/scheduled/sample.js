const moment = require('moment');

module.exports = {
  "to": "me@example.com",
  "from": "mailinary@example.com",
  "subject": (html, options)=> { return `dynamic title ${ new Date()}`;},
  "url": "https://marketplace.clicdata.com/v/yYF0JrwBkrHw",
  "selectors": ["#dashboard"],
  "page_load_timeout":0,
  'schedule': '* * * * *'
};

