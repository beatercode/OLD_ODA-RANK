const Users = require("../models/Users");
const logger = require("../helper/_logger");

module.exports = {

    async dailyChecks(client) {

        await this.resetDailyClaim();
        await this.dailyAdjustOdaInName();

    },

    async resetDailyClaim() {
        try {
            let updated1 = await Users.updateMany(
                { daily: false, consecutive_daily: { $gt: 0 } },
                { $set: { consecutive_daily: 0, multiplier: 1 } });
            let updated2 = await Users.updateMany(
                { daily: true },
                { $set: { daily: false } });

            if (updated1.modifiedCount > 0) {
                logger.info("DAILY CLAIM RESET DONE [" + updated1.modifiedCount + "] --------")
            }
            if (updated2.modifiedCount > 0) {
                logger.info("DAILY CLAIM RESET DONE [" + updated2.modifiedCount + "] --------")
            }
        } catch (err) {
            logger.error("DAILY CLAIM RESET ERROR--------")
            logger.error(err);
        }
    },

    async dailyAdjustOdaInName() {
        let toAddBonusRows = await Users.updateMany(
            { oda_in_name: true, oda_in_name_bonus: false },
            {
                $set: { oda_in_name_bonus: true },
                $inc: { consecutive_oda: 1 }
            });
        logger.info("Daily adjust ODA IN NAME added ---> " + toAddBonusRows.modifiedCount);
        let toRemoveBonusRows = await Users.updateMany(
            { oda_in_name: false, oda_in_name_bonus: true },
            { $set: { oda_in_name_bonus: false, consecutive_oda: 0 } });
        logger.info("Daily adjust ODA IN NAME removed ---> " + toRemoveBonusRows.modifiedCount);
    }

}