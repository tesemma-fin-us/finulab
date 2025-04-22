const mongoose = require("mongoose");

const communitiesJoinedDescsSchema = mongoose.Schema(
    {
        username: String,
        joined: String,
        response: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("communities-joined-descs", communitiesJoinedDescsSchema, "communities-joined-descs");