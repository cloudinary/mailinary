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

function loadConfig(file){
  let config = null;
    try{
      delete require.cache[require.resolve(`../${jobsPath}/${file}`)]

      config = require(`../${jobsPath}/${file}`);
    }catch(e){
      console.error(`cannot load ${file}: ${e}`);
    }
    return  config;
}

function listJobs(){
  let files = fs.readdirSync(jobsPath);
  console.log('job'.padEnd(16), 'scuedule'.padEnd(16),'next at'.padEnd(36), 'send to'.padEnd(16), 'url');
  for(file of files){
      let config = loadConfig(file);
      if (config) {
        var job = new schedule.Job();
        job.reschedule(config.schedule)
        var nextTick=null;
        try{
          nextTick = job.nextInvocation()._date.toString()
        } catch(e){
          nextTick = 'invalid cron expression'
        }

        console.log(file.padEnd(16), config.schedule.padEnd(16),nextTick.padEnd(36) , config.to.padEnd(16), config.url);
        job.cancel()
      }
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
    try {
      crons[jobName].job.cancel();
    }catch(e){
      console.log(`failed canceling ${jobName }: ${e.toString()}`)
    }
  } else {
    crons[jobName] = {};
  }
  let config = loadConfig(file);
  if (config){
    crons[jobName].config = config;

    crons[jobName].job = schedule.scheduleJob(config.schedule, async function(){
      log.debug(`running ${jobName} on ${new Date()}`);
      let scraper = new Scraper(config);
      let resp = await scraper.execute();
      mailer.send(resp, config);
    });
    var nextTick=null;
    try{
      nextTick = crons[jobName].job.nextInvocation()._date.toString()
    } catch(e){
      nextTick = `invalid cron expression`
    }
    log.debug(`scheduling ${jobName}: ${config.schedule} ${config.url} next at: ${nextTick}`);
  }
}

module.exports = {
  watch,
  removeCron,
  refreshCron,
  listJobs,
};
