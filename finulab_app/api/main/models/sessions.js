const mongoose = require("mongoose");

const sessionsSchema = mongoose.Schema(
    {
        ipv4: String,
        uniqueId: String,
        lastVisit: Number,
        convertedUser: String,
        affiliatedUsername: String,
        attemptsToRecoverAccount: Number,
        refreshToken: String,
        city: String,
        state: String,
        country: String,
        createdAt: Number
    }
);

module.exports = mongoose.model("sessions", sessionsSchema, "sessions");