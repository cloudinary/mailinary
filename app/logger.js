const bunyan = require('bunyan');
const path = require('path');
const fs = require('fs');

let logdir = path.join(__dirname, '../log');
if (!fs.existsSync(logdir)){
  fs.mkdirSync(logdir);
}

module.exports = (name) => {
  let logConfig = {
    name: name,
    level: config.get('log.level'),
    serializers: bunyan.stdSerializers,
    streams: [{
      stream: process.stderr
    }]
  };

  if (config.get('log.fileEnabled')) {
    logConfig.streams.push({
      type: 'file',
      path: path.join(logdir, '../log', `${process.env.NODE_ENV}.log`)
    });
  }

  return bunyan.createLogger(logConfig);
};
