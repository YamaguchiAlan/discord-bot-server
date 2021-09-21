const {model, Schema} = require("mongoose")

const userSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    servers: [{type: Schema.Types.ObjectId, ref: "Servers"}]
}, {
    timestamps: true
})

module.exports = model("Users", userSchema)