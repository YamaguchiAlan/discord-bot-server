const userCtrl = {}

const axios = require("axios")
const Users = require("../models/user")
const OauthStates = require("../models/OauthState")

userCtrl.getToken = (req, res) => {
    const {code} = req.query
    let guild_id = null;
    if(req.query.state){
        guild_id = JSON.parse(req.query.state).guild_id
    }

    if(code){
        const data = {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: "http://localhost:4000/api/token"
        }
        const params = new URLSearchParams(data)
        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded'
        }

        axios.post("https://discord.com/api/oauth2/token", params.toString(), {
            headers: headers
        })
        .then(response => {
            const {access_token} = response.data

            req.session.token = access_token
            res.redirect(`http://localhost:3000${guild_id ? `/server/${guild_id}` : ""}`)
        })
        .catch(err => res.redirect(process.env.AUTHENTICATION_REDIRECT))
    } else{
        res.redirect(process.env.AUTHENTICATION_REDIRECT)
    }
}

userCtrl.authenticate = async (req, res) => {
    const {token} = req.session
    const {guild_id} = req.query
    console.log(req.originalUrl)
    if(token){
        try{
            const response = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                  authorization: `Bearer ${token}`,
                }})

            const {username, id} = response.data
            const exists = await Users.exists({user_id: id})

            if(exists){
                const user = await Users.findOne({user_id: id}, "-servers")
                res.status(200).send(user)
            } else {
                const user = await new Users({
                    username: username,
                    user_id: id
                })
                await user.save()

                res.status(200).send(user)
            }
        }
        catch(err){
            const newOauthState = new OauthStates({
                state: "pene"
            })
            await newOauthState.save()

            if(guild_id){
                res.status(301).send({redirect: `${process.env.AUTHENTICATION_REDIRECT}&state=${guild_id}&pene=df`})
            } else{
                res.status(301).send({redirect: process.env.AUTHENTICATION_REDIRECT})
            }
        }
    } else {
        const newOauthState = new OauthStates({
            state: "pene"
        })
        await newOauthState.save()

        if(guild_id){
            res.status(301).send({redirect: `${process.env.AUTHENTICATION_REDIRECT}&state=${guild_id}&pene=df`})
        } else{
            res.status(301).send({redirect: process.env.AUTHENTICATION_REDIRECT})
        }
    }
}

module.exports = userCtrl