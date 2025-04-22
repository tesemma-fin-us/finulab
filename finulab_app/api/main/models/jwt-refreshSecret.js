const mongoose = require("mongoose");

const jwtRefreshSecret = mongoose.Schema(
    {
        privateKey: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("jwt-refreshSecret", jwtRefreshSecret, "jwt-refreshSecret");