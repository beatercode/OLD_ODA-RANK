const { DBROLES, DBSETTINGS, DBUSERDUMMY } = require("../helper/databaseHelper")
const Users = require("../models/Users")
const config = require("../backup/config.json")
const logger = require("./_logger")
require("dotenv").config()

const HYPER_BASE_API = "https://api.hyper.co/v6/"

module.exports = {

    async generateLicences(amount) {

        let licences = new Array(0);

        for (let i = 0; i < amount; i++) {
            let licence = await this.generateLicence()
            licences.push(licence)
        }
        return licences
    },

    async generateLicence() {

        // TODO TEST
        const samuraiHyperProductID = process.env.SAMURAI_HYPER_PRODUCT_ID
        const hyperAuthKey = process.env.HYPER_AUTH_KEY
        let linkId = ""
        let api = HYPER_BASE_API + "links"
        let response = await fetch(api, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: hyperAuthKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ max_usages: 1, nickname: "Samurai Membership", plan: samuraiHyperProductID })
        })
        
        response = await response.json()
        linkId = response.url

        const finalLinkUrl = `https://hpr.co/${linkId}`

        logger.info("Final Link Create: " + finalLinkUrl)
        console.log("Final Link Create: " + finalLinkUrl)

        return finalLinkUrl
    },

    async extendLicence(user, millisec) {

        // TODO TEST
        const hyperAuthKey = process.env.HYPER_AUTH_KEY
        let api = HYPER_BASE_API + "licenses?page=1&limit=100"
        fetch(api, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: hyperAuthKey
            }
        })
            .then(response => response.json())
            .then(response => {

                let result = response.data
                let userLicence = result.find(x => (x.user.username == user.username || x.user.username.includes(user.username)))

                userLicence = userLicence ? userLicence : false
                if (!userLicence) { 
                    logger.info("Licenza non trovata = fa parte del team")
                    console.log("Licenza non trovata = fa parte del team")
                    return 0
                }

                let userLicenceSub = userLicence.subscription
                let userLicenceKey = userLicence.key

                let userLicenceSubUpdated = userLicenceSub
                userLicenceSubUpdated.current_period_end = userLicenceSubUpdated.current_period_end + millisec
                userLicenceSubUpdated.trial_end = userLicenceSubUpdated.trial_end + millisec

                let updateApi = HYPER_BASE_API + "licenses/" + userLicenceKey
                fetch(updateApi, {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json',
                        Authorization: hyperAuthKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ subscription: userLicenceSubUpdated })
                })
                    .then(response => response.json())
                    .then(response => console.log("KEY [" + userLicenceKey + "] added [" + millisec + "] milliseconds"))
                    .catch(err => console.error(err));

            })
            .catch(err => console.error(err));
    },

    async commonCatch(err, from, logger) {
        if (err) {
            logger.error(`Error in [${from}]`)
            logger.error(err)
        }
    }

}