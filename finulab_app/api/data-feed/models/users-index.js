const mongoose = require("mongoose");

const usersIndexSchema = mongoose.Schema(
    {
        username: String,
        usernameEmbedding: Array,
        bio: String,
        bioEmbedding: Array,
        profilePicture: String,
        profileWallpaper: String,
        monetized: Boolean,
        verified: Boolean,
        accountType: String,
        createdAt: Number
    }
);

module.exports = mongoose.model("users-index", usersIndexSchema, "users-index");