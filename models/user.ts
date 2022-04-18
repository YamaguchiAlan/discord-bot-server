import {prop, getModelForClass, modelOptions, Ref} from '@typegoose/typegoose'
import {Server} from './server'

@modelOptions({schemaOptions: {
    timestamps: true
}})
export class User {
    @prop({required: true})
    user_id: string

    @prop({required: true})
    username: string

    @prop({ref: () => Server})
    servers?: Ref<Server>[]
}

const userModel = getModelForClass(User)

export default userModel