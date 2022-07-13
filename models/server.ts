import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose'
import { Notification } from './notification'

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
export class Server {
    @prop({ required: true, unique: true })
      server_id: string

    @prop({ ref: () => Notification })
      notifications?: Ref<Notification>[]

      @prop({ default: '$', maxlength: 3 })
        prefix?: string
}

const ServerModel = getModelForClass(Server)

export default ServerModel
