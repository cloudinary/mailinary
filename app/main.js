require('dotenv').config();
const fs = require('fs');
const path = require('path');

let tmpdir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpdir)){
  fs.mkdirSync(tmpdir);
}
global.config = require('config');
global.log = require('./logger.js')('Server');

let Scraper = require("./scraper.js");
let mailer = require("./mailer.js");
let scheduler = require("./scheduler.js");

log.info("initializing mailinary");

async function scrapeAndSend(args){
  try{
    let scraper = new Scraper(args);
    let resp = await scraper.execute();
    mailer.send(resp, args);
  } catch(e){
    log.warn('failed executing scrapeAndSend');
    throw e;
  }
}

function initScheduler(args){
  scheduler.watch();
}

module.exports = {
  scrapeAndSend, 
  initScheduler,
};

