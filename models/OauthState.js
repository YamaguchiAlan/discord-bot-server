const {model, Schema} = require('mongoose')

const OauthStateSchema = new Schema({
    state: {
        type: String,
        required: true
    },
    path: {
        type: String,
        default: "/"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

OauthStateSchema.index({"createdAt": 1}, {expireAfterSeconds: 1200})

module.exports = model("OauthStates", OauthStateSchema)