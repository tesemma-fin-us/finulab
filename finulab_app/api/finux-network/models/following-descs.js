const mongoose = require("mongoose");

const followingDescsSchema = mongoose.Schema(
    {
        username: String,
        following: String,
        response: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("following-descs", followingDescsSchema, "following-descs");