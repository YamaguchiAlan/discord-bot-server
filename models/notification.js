const { model, Schema } = require("mongoose");

const notificationSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    twitchUsername: {
        type: String,
        required: true
    },
    twitchUserId: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    channelName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {timestamps: true})

module.exports = model("Notifications", notificationSchema)