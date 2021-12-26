const axios = require("axios")
const {REST} = require("@discordjs/rest")
const {Routes} = require("discord-api-types/v9")
const Users = require("../models/user")
const Servers = require("../models/server")
const Notifications = require("../models/notification")
const TwitchToken = require("../models/twitchToken")

const clientId = process.env.APP_CLIENT_ID
const secretToken = process.env.APP_SECRET_TOKEN
const subscriptionSecret = process.env.TWITCH_SUBSCRIPTION_SECRET

const rest = new REST({version: '9'}).setToken(process.env.BOT_TOKEN)

const serverCtrl = {}

serverCtrl.getServers = async (req, res) => {
    const {token} = req.session

    if(token){
        try{
            const headers = {
                authorization: `Bearer ${token}`
              }

            const response = await axios.get('https://discord.com/api/users/@me/guilds', {
                headers: headers
            })

            const servers = response.data.filter(guild => guild.owner === true)
            res.status(200).send(servers)
        }
        catch(err){
            res.status(400).end()
        }
    } else {
        res.status(401).end()
    }
}

serverCtrl.checkServer = async (req, res) => {
    try{
        const {userId, guildId} = req.params
        const guild = await rest.get(Routes.guild(guildId))
        const user = await Users.findById(userId)

        if(guild.owner_id === user.user_id){
            const exist = await Servers.exists({server_id: guildId})
            let server;

            if(exist){
                server = await Servers.findOne({server_id: guildId})
            } else{
                server = await new Servers({
                    server_id: guildId
                })

                user.servers.push(server._id)

                await user.save()
                await server.save()
            }
            res.status(200).send({
                server_name: guild.name,
                icon: guild.icon,
                ...server._doc
            })
        } else{
            res.status(401).send({ message: "You don't own this server" })
        }
    }
    catch(err){
        console.log(err)
        if(err.code === 50001){
            res.status(401).send({
                code: 50001,
                message: "Missing Access"
            })
        } else if(err.code === 50035){
            res.status(404).send({
                code: 50035,
                message: "Invalid Guild ID"
            })
        } else{
            res.status(400).end()
        }
    }
}

serverCtrl.getNewNotification = async (req, res) => {
    try{
        const {guildId} = req.params

        const channels = await rest.get(Routes.guildChannels(guildId))
        const textChannels = channels.filter(c => c.type === 0).map(c => ({
            id: c.id,
            name: c.name
        }))

        let roles = await rest.get(Routes.guildRoles(guildId))
        roles = roles.map(r => ({
            id: r.id,
            name: r.name
        }))

        res.status(200).send({channels: textChannels, roles})
    } catch(err){
        console.log(err)
        res.status(400).end()
    }
}

serverCtrl.postNotification = async (req, res) => {
    const {guildId} = req.params
    const {message, username, userId, channel, channelName} = req.body

    const addNotification = async (id) => {
        const notification = new Notifications({
            message,
            twitchUsername: username,
            twitchUserId: id,
            guildId,
            userId,
            channel,
            channelName
        })

        const server = await Servers.findOne({server_id: guildId})
        server.notifications.push(notification._id)

        await notification.save()
        await server.save()

        res.status(200).end()
    }

    const token = await TwitchToken.findOne({token_type: "bearer"})
    const twitchHeaders = {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token?.access_token}`
    }

    try {
        const user = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {headers: twitchHeaders})

        if(user.data.data[0]){
            const subscription = {
                "type": "stream.online",
                "version": "1",
                "condition": {
                    "broadcaster_user_id": user.data.data[0].id
                },
                "transport": {
                    "method": "webhook",
                    "callback": "https://yamabot-bot.tk/twitch/stream/live",
                    "secret": subscriptionSecret
                }
            }

            axios.post("https://api.twitch.tv/helix/eventsub/subscriptions", subscription, {headers: twitchHeaders})
            .then(async data => {
                await addNotification(user.data.data[0].id)
            })
            .catch(async err => {
                if(err.response.status === 409){
                    await addNotification(user.data.data[0].id)
                } else if(error.response.status === 401){
                    const token = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretToken}&grant_type=client_credentials`)
                    await TwitchToken.findOneAndUpdate({token_type: "bearer"}, token.data, {upsert: true})

                    serverCtrl.postNotification(req, res)
                } else{
                    res.status(400).end()
                }
            })
        } else{
            res.status(404).send({message: "User Not Found"})
        }
    } catch (error) {
        if(error.response.status === 401){
            const token = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretToken}&grant_type=client_credentials`)
            await TwitchToken.findOneAndUpdate({token_type: "bearer"}, token.data, {upsert: true})

            serverCtrl.postNotification(req, res)
        } else{
            res.status(400).end()
        }
    }
}

serverCtrl.getNotifications = async (req, res) => {
    const {guildId} = req.params

    try {
        const notifications = await Notifications.find({guildId})

        if(notifications[0]){
            const token = await TwitchToken.findOne({token_type: "bearer"})
            const twitchHeaders = {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token?.access_token}`
            }

            const userQuery = notifications.map((n, i) => i === 0 ? "?id=" + n.twitchUserId : "&id=" + n.twitchUserId).join('')
            const users = await axios.get(`https://api.twitch.tv/helix/users${userQuery}`, {headers: twitchHeaders})

            const data = notifications.map(n => {
                const user = users.data.data.find(u => u.login.toLowerCase() === n.twitchUsername.toLowerCase())

                return {
                    ...n._doc,
                    profile_image_url: user.profile_image_url
                }
            })

            res.status(200).send(data)
        } else{
            res.status(200).end()
        }
    } catch (error) {
        if(error?.response?.status === 401){
            const token = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretToken}&grant_type=client_credentials`)
            await TwitchToken.findOneAndUpdate({token_type: "bearer"}, token.data, {upsert: true})

            serverCtrl.getNotifications(req, res)
        } else{
            res.status(400).send({message: "Something went wrong"})
        }
    }
}

serverCtrl.getNotification = async (req, res) => {
    const {guildId, notificationId} = req.params

    try {
        const notification = await Notifications.findOne({guildId, _id: notificationId}, "message channel channelName twitchUsername")

        res.status(200).send(notification)
    } catch (error) {
        res.status(404).end()
    }
}

serverCtrl.editNotification = async (req, res) => {
    const {guildId, notificationId} = req.params
    const {channel, channelName, message} = req.body

    try {
        await Notifications.findOneAndUpdate({guildId, _id: notificationId}, {
                channel,
                channelName,
                message
            })
        res.status(200).end()
    } catch (error) {
        res.status(404).end()
    }
}

serverCtrl.removeNotification = async (req, res) => {
    const {guildId, notificationId} = req.params

    try {
        await Notifications.findOneAndRemove({guildId, _id: notificationId})
        await Servers.findOneAndUpdate({server_id: guildId}, {
            $pull: {
                notifications: notificationId
            }
        })
        res.status(200).end()
    } catch (error) {
        res.status(404).end()
    }
}

module.exports = serverCtrl