const {Router} = require("express")
const router = Router()
const axios = require("axios")
const {REST} = require("@discordjs/rest")
const {Routes} = require("discord-api-types/v9")
const Users = require("../models/user")
const Servers = require("../models/server")

const rest = new REST({version: '9'}).setToken(process.env.BOT_TOKEN)

router.get("/api/servers", async (req, res) => {
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
})

router.get("/api/users/:userId/guilds/:guildId/check", async (req, res) => {
    try{
        const {userId, guildId} = req.params
        const data = await rest.get(Routes.guildMember(guildId, "880599706428928100"))
        if(data){
            const guild = await rest.get(Routes.guildPreview(guildId))
            const exist = await Servers.exists({server_id: guildId})
            let server;

            if(exist){
                server = await Servers.findOne({server_id: guildId})
            } else{
                server = await new Servers({
                    server_id: guildId
                })
                const user = await Users.findById(userId)
                user.servers.push(server._id)

                await user.save()
                await server.save()
            }
            res.status(200).send({
                server_name: guild.name,
                ...server._doc
            })
        } else{
            res.status(400).end()
        }
    }
    catch(err){
        if(err.code === 50001){
            res.status(401).send({
                code: 50001,
                message: "Missing Access"
            })
        } else{
            res.status(400).end()
        }
    }
})

module.exports = router