const {model, Schema} = require("mongoose")

const twitchTokenSchema = new Schema({
    access_token: {
        type: String,
        required: true
    },
    expires_in: Number,
    token_type: String
}, {
    timestamps: true
})

module.exports = model("TwitchToken", twitchTokenSchema)