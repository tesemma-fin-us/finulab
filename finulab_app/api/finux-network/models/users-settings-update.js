const mongoose = require("mongoose");

const usersSettingsUpdateSchema = mongoose.Schema(
    {
        username: String,
        bio: String,
        profileImage: String,
        profileWallpaper: String,
        changeProcessed: Boolean
    }
);

module.exports = mongoose.model("users-settings-update", usersSettingsUpdateSchema, "users-settings-update");