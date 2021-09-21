const {model, Schema} = require('mongoose')

const serverSchema = new Schema({
    server_id: {
        type: String,
        required: true
    },
    subscriptions_id_list: [String],
    subscriptions: [{
        username: String,
        user_id: String
    }]
}, {
    timestamps: true
})

module.exports = model("Servers", serverSchema)