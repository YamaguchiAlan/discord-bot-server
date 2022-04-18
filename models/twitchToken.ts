import {prop, getModelForClass, modelOptions} from '@typegoose/typegoose'

@modelOptions({schemaOptions: {
    timestamps: true
}})
export class TwitchToken {
    @prop({required: true})
    access_token: string

    @prop()
    expires_in?: number

    @prop()
    token_type?: string
}

const twitchTokenModel = getModelForClass(TwitchToken)

export default twitchTokenModel