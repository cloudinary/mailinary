const schedule = require('node-schedule');
const fs = require('fs');
let Scraper = require("./scraper.js");
let mailer = require("./mailer.js");

let crons = {};
let jobsPath = 'jobs/scheduled';


function watch(){
  log.info(`starting mail scheduler service on ${jobsPath}`);
  let files = fs.readdirSync(jobsPath);
  fs.watch(jobsPath, (event, filename)=>{
    let fileExists = fs.existsSync(`${jobsPath}/${filename}`);
    if (fileExists){
      refreshCron(filename);
    }else{
      try{
        removeCron(filename);
      }catch(error){
        log.error({error}, `cannot cancel job ${filename}`);
      }
    }

  });

  for (let file of files){
    refreshCron(file);
  }
}

function listJobs(){
  let files = fs.readdirSync(jobsPath);
  console.log('job'.padEnd(16), 'scuedule'.padEnd(16), 'send to'.padEnd(16), 'url');
  for(file of files){
    let config = require(`../${jobsPath}/${file}`);
    console.log(file.padEnd(16), config.schedule.padEnd(16), config.to.padEnd(16), config.url);
  }
}

function removeCron(file){
  let jobName = file.split('.')[0];
  log.info(`removing cron ${jobName}`);
  if (crons[jobName]){
    crons[jobName].job.cancel();
  }
}

function refreshCron(file){
  log.info(`loading job ${file}`);
  let jobName = file.split('.')[0];
  if (crons[jobName]){
    crons[jobName].job.cancel();
  } else {
    crons[jobName] = {};
  }
  let config = require(`../${jobsPath}/${file}`);
  crons[jobName].config = config;
  log.debug(`scheduling ${jobName}: ${config.schedule} ${config.url}`);
  crons[jobName].job = schedule.scheduleJob(config.schedule, async function(){
    log.debug(`running ${jobName} on ${new Date()}`);
    let scraper = new Scraper(config);
    let resp = await scraper.execute();
    mailer.send(resp, config);
  });
}

module.exports = {
  watch,
  removeCron,
  refreshCron,
  listJobs,
};
