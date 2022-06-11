const log4js = require("log4js")
const logger = log4js.getLogger()
const pm2Intercom = require("@takin/pm2-intercom-log4js")

pm2Intercom().catch(() => {

}).finally(() => {
	log4js.configure({
		appenders: {
			appender: {
				type: "file",
				filename: "log/log",
				keepFileExt: true,
				compress: true,
				pattern: "yyyy-MM-dd.log",
				alwaysIncludePattern: true,
			},
			console: { type: "console" }
		},
		categories: {
			default: {
				appenders: ["appender", "console"],
				level: "all",
			},
		},
		pm2: true,
	})
})

module.exports = logger