require('dotenv').config();
const fs = require('fs');
const path = require('path');


let execDir= process.cwd();
let installDir = path.join( __dirname, '..');
if (installDir!=execDir){
  // TODO support packaged installed from NPM
  throw new Error('package does not support this feature yet');
}


let tmpdir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpdir)){
  fs.mkdirSync(tmpdir);
}
global.config = require('config');
global.log = require('./logger.js')('Server');

let Scraper = require("./scraper.js");
let mailer = require("./mailer.js");
let scheduler = require("./scheduler.js");


async function scrapeAndSend(args){
  try{
    let scraper = new Scraper(args);
    let resp = await scraper.execute();
    await mailer.send(resp, args);
  } catch(e){
    log.warn('failed executing scrapeAndSend');
    log.warn(e.message);
    process.exit();
  }
}

function initScheduler(args){
  scheduler.watch();
}

module.exports = {
  scrapeAndSend, 
  initScheduler,
};



