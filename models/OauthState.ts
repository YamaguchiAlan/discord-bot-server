import { prop, getModelForClass, modelOptions, index } from '@typegoose/typegoose'

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
@index({ createdAt: 1 }, { expireAfterSeconds: 1200 })
export class OauthState {
    @prop({ required: true })
      state: string

    @prop({ default: '/' })
      path?: string

    @prop({ type: Date, default: Date.now })
      createdAt?: Date
}

const OauthStateModel = getModelForClass(OauthState)

export default OauthStateModel
