import {prop, getModelForClass, modelOptions, Ref} from '@typegoose/typegoose'
import {Notification} from './notification'

@modelOptions({schemaOptions: {
    timestamps: true
}})
export class Server {
    @prop({required: true})
    server_id: string

    @prop({ref: () => Notification})
    notifications?: Ref<Notification>[]
}

const ServerModel = getModelForClass(Server)

export default ServerModel