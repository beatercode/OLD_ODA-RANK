const hourlyEvents = require("../custom/hourlyEvents");
const monthlyEvents = require("../custom/monthlyEvents");
const dailyEvents = require("../custom/dailyEvents");
const { DBSETTINGS } = require("../helper/databaseHelper");
var cron = require('node-cron');

module.exports = {

    async setupTimebaseEvents(client) {

        const everyHour = '0 */1 * * *';
        const everyDay = '0 0 */1 * *';
        const everyMonth = '0 0 1 */1 *';

        try {
            const DB_SETTINGS = await DBSETTINGS();

            cron.schedule(everyHour, () => { hourlyEvents.hourlyChecks(client) }, { scheduled: DB_SETTINGS.hourly_task });
            cron.schedule(everyDay, () => { dailyEvents.dailyChecks(client) }, { scheduled: DB_SETTINGS.daily_task });
            cron.schedule(everyMonth, () => { monthlyEvents.monthlyCheck(client) }, { scheduled: DB_SETTINGS.monthly_task });
        } catch (err) {
            if (err) console.log(err)
        }
    }

}