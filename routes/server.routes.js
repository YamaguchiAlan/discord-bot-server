const {Router} = require("express")
const router = Router()
const {checkServer, getServers, getNewNotification, postNotification,
    getNotifications, getNotification, editNotification, removeNotification} = require("../controllers/server.controller")

router.get("/api/servers", getServers)

router.get("/api/users/:userId/guilds/:guildId/check", checkServer)

router.get("/api/servers/:guildId/notifications/@new", getNewNotification)

router.post("/api/servers/:guildId/notifications", postNotification)

router.get("/api/servers/:guildId/notifications", getNotifications)

router.get("/api/servers/:guildId/notifications/:notificationId", getNotification)

router.put("/api/servers/:guildId/notifications/:notificationId", editNotification)

router.delete("/api/servers/:guildId/notifications/:notificationId", removeNotification)

module.exports = router