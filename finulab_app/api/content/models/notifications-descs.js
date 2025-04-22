const mongoose = require("mongoose");

const notificationsDescsSchema = mongoose.Schema(
    {
        by: String,
        target: String,
        byProfileImage: String,
        type: String,
        message: String,
        secondaryMessage: String,
        link: String,
        read: Boolean,
        timeStamp: Number
    }
);

module.exports = mongoose.model("notifications-descs", notificationsDescsSchema, "notifications-descs");