const mongoose = require("mongoose");

const jwtAccessSecretSchema = mongoose.Schema(
    {
        privateKey: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("jwt-accessSecret", jwtAccessSecretSchema, "jwt-accessSecret");