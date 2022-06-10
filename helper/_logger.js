const log4js = require("log4js");
logger = log4js.getLogger();
log4js.configure({
  appenders: {
    appender: {
      type: 'file',
      filename: 'log/log',
      keepFileExt: true,
      compress: true,
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
    },
  },
  categories: {
    default: {
      appenders: ['appender'],
      level: 'all',
    },
  },
});

module.exports = logger;