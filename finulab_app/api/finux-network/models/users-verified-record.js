const mongoose = require("mongoose");

const usersVerifiedRecordSchema = mongoose.Schema(
    {
        username: String,
        walletAddress: String,
        selectedChain: String,
        status: String,
        changeProcessed: Boolean,
        daysNotPaid: Number,
        subscriptionType: String,
        verificationStartDate: String,
        verificationNextPayDate: String,
        verificationTerminationDate: String
    }
);

module.exports = mongoose.model("users-verified-record", usersVerifiedRecordSchema, "users-verified-record");