const moment = require('moment');

module.exports = {
  "to": "me@example.com",
  "from": "mailinary@example.com",
  "subject": (html, options) => { return `dynamic title ${new Date()}`; },
  "url": "https://www.highcharts.com/demo/dashboards/accounting",
  "selectors": [".demo-section"],
  "window": { width: 1200, height: 900 },
  "page_load_timeout": 0,
  "augmentHTMLBeforeScrape": async (page) => {
    await page.evaluate(() => {
      function remove(selector) {
        try {
          let elm = document.querySelector(selector);
          elm.remove()
        } catch (_) { }
      }
      remove("#hc-cookie-dialog")


    })

  },
  "augmentHTMLBeforeSend": async (page) => {
    await page.evaluate(() => {
      function remove(selector) {
        try {
          let elm = document.querySelector(selector);
          elm.remove()
        } catch (_) { }
      }

      // remove("#preview")
      remove('.sidebar')
      remove('#toolbar')
      remove('#app-header-cnt')
      remove('iframe')
      remove('next-route-announcer')
      remove('.Footer-bleed')
      remove('ul')

    })

  },
  'schedule': '* * * * *'
};

