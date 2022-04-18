import session from 'express-session';

declare module 'express-session' {
  export interface SessionData {
    token: string;
  }
}

export interface DiscordUser {
  id: string,
  username: string,
  discriminator: string
}

export interface DiscordGuild {
  id: string,
  name: string,
  icon: string,
  owner: boolean,
  owner_id: string
}

export interface DiscordChannel {
  id: string,
  name: string,
  type: number
}

export interface DiscordRole {
  id: string,
  name: string
}