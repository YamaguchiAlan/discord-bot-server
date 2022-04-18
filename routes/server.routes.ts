import {Router} from "express"
import authHeader from "../middlewares/authHeader"
import {checkServer, getServers, getNewNotification, postNotification,
    getNotifications, getNotification, editNotification, removeNotification} from "../controllers/server.controller"
const router = Router()

router.get("/api/servers", authHeader, getServers)

router.get("/api/users/:userId/guilds/:guildId/check", authHeader, checkServer)

router.get("/api/servers/:guildId/notifications/@new", authHeader, getNewNotification)

router.post("/api/servers/:guildId/notifications", authHeader, postNotification)

router.get("/api/servers/:guildId/notifications", authHeader, getNotifications)

router.get("/api/servers/:guildId/notifications/:notificationId", authHeader, getNotification)

router.put("/api/servers/:guildId/notifications/:notificationId", authHeader, editNotification)

router.delete("/api/servers/:guildId/notifications/:notificationId", authHeader, removeNotification)

export default router