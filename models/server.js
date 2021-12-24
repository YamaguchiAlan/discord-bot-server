const {model, Schema} = require('mongoose')

const serverSchema = new Schema({
    server_id: {
        type: String,
        required: true
    },
    notifications: [{type: Schema.Types.ObjectId, ref: "Notifications"}]
}, {
    timestamps: true
})

module.exports = model("Servers", serverSchema)