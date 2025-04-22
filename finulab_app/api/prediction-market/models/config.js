const mongoose = require("mongoose");

const configSchema = mongoose.Schema(
    {
        alpha: Number,
        beta: Number,
        fee: Object,
        creatorStake: Number
    }
);

module.exports = mongoose.model("config", configSchema, "config");