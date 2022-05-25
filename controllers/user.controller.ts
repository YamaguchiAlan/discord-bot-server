import { RequestHandler } from 'express'
import axios, { AxiosRequestConfig } from 'axios'
import Users, { User } from '../models/user'
import OauthStates, { OauthState as Oauth } from '../models/OauthState'
import crypto from 'crypto-js'
import { DiscordUser } from '../types'

const ClientId = (process.env.CLIENT_ID as string)
const ClientSecret = (process.env.CLIENT_SECRET as string)
const production = process.env.PRODUCTION

export const getToken: RequestHandler = async (req, res) => {
  const { code, state } = req.query

  if (code && state) {
    const OauthState = await OauthStates.findOne({ state })

    if (OauthState) {
      await OauthStates.deleteOne({ state })

      const params = new URLSearchParams()
      params.append('client_id', ClientId)
      params.append('client_secret', ClientSecret)
      params.append('grant_type', 'authorization_code')
      params.append('code', (code as string))
      params.append('redirect_uri', production ? 'https://server.yamabot.tk/api/token' : 'http://localhost:4000/api/token')

      const axiosConfig: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }

      axios.post('https://discord.com/api/oauth2/token', params.toString(), axiosConfig)
        .then(response => {
          const { access_token } = response.data

          req.session.token = access_token
          res.redirect(production ? `https://app.yamabot.tk${OauthState.path}` : `http://localhost:3000${OauthState.path}`)
        })
        .catch(_ => res.redirect(production ? 'https://app.yamabot.tk' : 'http://localhost:3000'))
    } else {
      res.redirect(production ? 'https://app.yamabot.tk' : 'http://localhost:3000')
    }
  } else {
    res.redirect(production ? 'https://app.yamabot.tk' : 'http://localhost:3000')
  }
}

export const authenticate: RequestHandler = async (req, res) => {
  const { token } = req.session
  const path = (req.query.path as string)

  if (token) {
    try {
      const response = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      const { username, id, avatar, discriminator }: DiscordUser = response.data
      const exists = await Users.exists({ user_id: id })

      if (exists) {
        const user = await Users.findOne({ user_id: id }, '-servers')
        if (user?.username !== username || user?.avatar !== avatar || user?.discriminator !== discriminator) {
                    user!.username = username
                    user!.avatar = avatar
                    user!.discriminator = discriminator
                    await user!.save()
        }
        res.status(200).send(user)
      } else {
        const newUserProps: User = {
          username,
          user_id: id,
          avatar,
          discriminator
        }
        const user = await new Users(newUserProps)
        await user.save()

        res.status(200).send(user)
      }
    } catch (err) {
      const date = new Date().toString()
      const hash = crypto.MD5(`${process.env.HASH_SECRET}${date}`).toString()

      const newOauthProps: Oauth = {
        state: hash,
        path: path || '/'
      }
      const newOauthState = new OauthStates(newOauthProps)
      await newOauthState.save()

      res.status(307).send({ redirect: `${process.env.AUTHENTICATION_REDIRECT}&state=${hash}` })
    }
  } else {
    const date = new Date().toString()
    const hash = crypto.MD5(`${process.env.HASH_SECRET}${date}`).toString()

    const newOauthProps: Oauth = {
      state: hash,
      path: path || '/'
    }
    const newOauthState = new OauthStates(newOauthProps)
    await newOauthState.save()

    res.status(307).send({ redirect: `${process.env.AUTHENTICATION_REDIRECT}&state=${hash}` })
  }
}

export const logout: RequestHandler = (req, res) => {
  req.session.destroy((_) => {
    res.clearCookie('connect.sid')
    res.sendStatus(200)
  })
}
