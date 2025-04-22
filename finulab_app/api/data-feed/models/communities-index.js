const mongoose = require("mongoose");

const communitiesIndexSchema = mongoose.Schema(
    {
        communityName: String,
        communityNameEmbedding: Array,
        communityType: String,
        profilePicture: String,
        profileWallpaper: String,
        bio: String,
        bioEmbedding: Array,
        createdAt: Number
    }
);

module.exports = mongoose.model("communities-index", communitiesIndexSchema, "communities-index");