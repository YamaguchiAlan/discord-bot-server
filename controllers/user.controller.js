const userCtrl = {}

const axios = require("axios")
const Users = require("../models/user")
const OauthStates = require("../models/OauthState")
const crypto = require("crypto-js")

userCtrl.getToken = async (req, res) => {
    const {code, state} = req.query

    if(code && state){
        const OauthState = await OauthStates.findOne({state})

        if(OauthState){
            await OauthStates.deleteOne({state})

            const data = {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: "https://server.yamabot.tk/api/token"
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
                res.redirect(`https://yamabot.tk${OauthState.path}`)
            })
            .catch(err => res.redirect("https://yamabot.tk"))
        } else{
            res.redirect("https://yamabot.tk")
        }
    } else{
        res.redirect("https://yamabot.tk")
    }
}

userCtrl.authenticate = async (req, res) => {
    const {token} = req.session
    const {path} = req.query

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
            const date = new Date().toString()
            const hash = crypto.MD5(`${process.env.HASH_SECRET}${date}`).toString()

            const newOauthState = new OauthStates({
                state: hash,
                path: path ? path : "/"
            })
            await newOauthState.save()

            res.status(307).send({redirect: `${process.env.AUTHENTICATION_REDIRECT}&state=${hash}`})
        }
    } else {
        const date = new Date().toString()
        const hash = crypto.MD5(`${process.env.HASH_SECRET}${date}`).toString()

        const newOauthState = new OauthStates({
            state: hash,
            path: path ? path : "/"
        })
        await newOauthState.save()

        res.status(307).send({redirect: `${process.env.AUTHENTICATION_REDIRECT}&state=${hash}`})
    }
}

module.exports = userCtrl