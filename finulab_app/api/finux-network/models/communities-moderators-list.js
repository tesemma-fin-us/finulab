const mongoose = require("mongoose");

const communitiesModeratorsListsSchema = mongoose.Schema(
    {
        username: String,
        community: String,
        status: String,
        type: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("communities-moderators-lists", communitiesModeratorsListsSchema, "communities-moderators-lists");