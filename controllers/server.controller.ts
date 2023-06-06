import { RequestHandler, Request, Response } from 'express'
import axios, { AxiosRequestConfig } from 'axios'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import Users from '../models/user'
import Servers, { Server } from '../models/server'
import Notifications, { Notification } from '../models/notification'
import TwitchToken from '../models/twitchToken'
import { DiscordChannel, DiscordGuild, DiscordRole, GuildData } from '../types'

const clientId = process.env.APP_CLIENT_ID
const secretToken = process.env.APP_SECRET_TOKEN
const subscriptionSecret = process.env.TWITCH_SUBSCRIPTION_SECRET

const rest = new REST({ version: '9' }).setToken((process.env.BOT_TOKEN as string))

export const getServers: RequestHandler = async (req, res) => {
  const { token } = req.session

  if (token) {
    try {
      const axiosConfig: AxiosRequestConfig = {
        headers: {
          authorization: `Bearer ${token}`
        }
      }

      const response = await axios.get('https://discord.com/api/users/@me/guilds', axiosConfig)
      const discordServers: DiscordGuild[] = response.data

      const servers = discordServers.filter(guild => guild.owner === true)
      res.status(200).send(servers)
    } catch (err) {
      res.status(400).end()
    }
  } else {
    res.status(401).end()
  }
}

export const checkServer: RequestHandler = async (req, res) => {
  try {
    const { userId, guildId } = req.params
    const guild = (await rest.get(Routes.guild(guildId)) as DiscordGuild)
    const user = await Users.findById(userId)

    if (guild.owner_id === user?.user_id) {
      const exist = await Servers.exists({ server_id: guildId })
      let server

      if (exist) {
        server = await Servers.findOne({ server_id: guildId })

        if (!user.servers?.includes(server!._id)) {
          user.servers?.push(server!._id)

          await user.save()
        }
      } else {
        const newServerProps: Server = {
          server_id: guildId
        }
        server = await new Servers(newServerProps)

        user?.servers?.push(server._id)

        await user?.save()
        await server.save()
      }
      res.status(200).send({
        server_name: guild.name,
        icon: guild.icon,
        ...server?.toJSON()
      })
    } else {
      res.status(401).send({ message: "You don't own this server" })
    }
  } catch (err: any) {
    if (err.code === 50001) {
      res.status(401).send({
        code: 50001,
        message: 'Missing Access'
      })
    } else if (err.code === 50035) {
      res.status(404).send({
        code: 50035,
        message: 'Invalid Guild ID'
      })
    } else {
      res.status(400).end()
    }
  }
}

export const getGuildData: RequestHandler = async (req, res) => {
  try {
    const { guildId } = req.params

    const channels = (await rest.get(Routes.guildChannels(guildId)) as DiscordChannel[])
    const textChannels = channels.filter(c => c.type === 0).map(c => ({
      id: c.id,
      name: c.name
    }))

    let roles = (await rest.get(Routes.guildRoles(guildId)) as DiscordRole[])
    roles = roles.map(r => ({
      id: r.id,
      name: r.name
    }))

    const result: GuildData = {
      channels: textChannels,
      roles
    }

    res.status(200).send(result)
  } catch (err) {
    res.status(400).end()
  }
}

export const postNotification = async (req: Request, res: Response) => {
  const { guildId } = req.params
  const { message, username, userId, channel, channelName, embedMessage, embed } = req.body

  const addNotification = async (id: string) => {
    const newnNotificationProps: Notification = {
      message,
      twitchUsername: username,
      twitchUserId: id,
      guildId,
      userId,
      channel,
      channelName,
      embedMessage,
      embed
    }

    const notification = new Notifications(newnNotificationProps)

    const server = await Servers.findOne({ server_id: guildId })
    server?.notifications?.push(notification._id)

    await notification.save()
    await server?.save()

    res.status(200).end()
  }

  const token = await TwitchToken.findOne({ token_type: 'bearer' })
  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token?.access_token}`
    }
  }

  try {
    const user = ((await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, axiosConfig)).data.data[0] as {id: string})

    if (user) {
      const subscription = {
        type: 'stream.online',
        version: '1',
        condition: {
          broadcaster_user_id: user.id
        },
        transport: {
          method: 'webhook',
          callback: 'https://bot.yamabot.run.place/twitch/stream/live',
          secret: subscriptionSecret
        }
      }

      axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', subscription, axiosConfig)
        .then(async data => {
          await addNotification(user.id)
        })
        .catch(async err => {
          if (err.response.status === 409) {
            await addNotification(user.id)
          } else if (err.response.status === 401) {
            const token = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretToken}&grant_type=client_credentials`)
            await TwitchToken.findOneAndUpdate({ token_type: 'bearer' }, token.data, { upsert: true })

            postNotification(req, res)
          } else {
            res.status(400).end()
          }
        })
    } else {
      res.status(404).send({ message: 'User Not Found' })
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const token = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretToken}&grant_type=client_credentials`)
      await TwitchToken.findOneAndUpdate({ token_type: 'bearer' }, token.data, { upsert: true })

      postNotification(req, res)
    } else {
      res.status(400).end()
    }
  }
}

export const getNotifications = async (req: Request, res: Response) => {
  const { guildId } = req.params

  try {
    const notifications = await Notifications.find({ guildId }, 'channelName message twitchUsername twitchUserId')

    if (notifications[0]) {
      const token = await TwitchToken.findOne({ token_type: 'bearer' })
      const axiosConfig: AxiosRequestConfig = {
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${token?.access_token}`
        }
      }

      const userQuery = notifications.map((n, i) => i === 0 ? '?id=' + n.twitchUserId : '&id=' + n.twitchUserId).join('')
      const users = (await axios.get(`https://api.twitch.tv/helix/users${userQuery}`, axiosConfig)).data

      const data = notifications.map(n => {
        const user = users.data.find((u: any) => u.login.toLowerCase() === n.twitchUsername.toLowerCase())

        return {
          ...n.toJSON(),
          profile_image_url: user.profile_image_url
        }
      })

      res.status(200).send(data)
    } else {
      res.status(200).end()
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const token = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secretToken}&grant_type=client_credentials`)
      await TwitchToken.findOneAndUpdate({ token_type: 'bearer' }, token.data, { upsert: true })

      getNotifications(req, res)
    } else {
      console.log(error)
      res.status(400).send({ message: 'Something went wrong' })
    }
  }
}

export const getNotification: RequestHandler = async (req, res) => {
  const { guildId, notificationId } = req.params

  try {
    const notification = await Notifications.findOne({ guildId, _id: notificationId }, 'message channel channelName twitchUsername embed embedMessage')

    res.status(200).send(notification)
  } catch (error) {
    res.status(404).end()
  }
}

export const editNotification: RequestHandler = async (req, res) => {
  const { guildId, notificationId } = req.params
  const { channel, channelName, message, embedMessage, embed }: Omit<Notification, 'userId' | 'guildId' | 'twitchUsername' | 'twitchUserId'> = req.body

  try {
    await Notifications.findOneAndUpdate({ guildId, _id: notificationId }, {
      channel,
      channelName,
      message,
      embedMessage,
      embed
    })
    res.status(200).end()
  } catch (error) {
    res.status(404).end()
  }
}

export const removeNotification: RequestHandler = async (req, res) => {
  const { guildId, notificationId } = req.params

  try {
    await Notifications.findOneAndRemove({ guildId, _id: notificationId })
    await Servers.findOneAndUpdate({ server_id: guildId }, {
      $pull: {
        notifications: notificationId
      }
    })
    res.status(200).end()
  } catch (error) {
    res.status(404).end()
  }
}
