import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

@modelOptions({
  schemaOptions: {
    _id: false
  }
})
class Embed {
  @prop()
    title: string

  @prop()
    titleAsUrl: boolean

  @prop()
    description: string

  @prop()
    color: string

  @prop()
    previewImage: boolean
}

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
export class Notification {
    @prop({ required: true })
      userId: string

    @prop({ required: true })
      guildId: string

    @prop({ required: true })
      twitchUsername: string

    @prop({ required: true, type: String })
      twitchUserId: string

    @prop({ required: true })
      channel: string

    @prop({ required: true })
      channelName: string

    @prop({ required: true })
      message: string

    @prop({ required: true })
      embedMessage: boolean

    @prop()
      embed?: Embed
}

const notificationModel = getModelForClass(Notification)

export default notificationModel
