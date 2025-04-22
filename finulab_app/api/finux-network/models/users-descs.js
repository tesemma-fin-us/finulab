const mongoose = require("mongoose");

const usersDescsSchema = mongoose.Schema(
    {
        username: String,
        queryableUsername: String,
        email: String,
        password: String,
        status: String,
        monetized: Boolean,
        verified: Boolean,
        accountType: String,
        oneTimeCode: Number,
        oneTimeCodeTimeStamp: Number,
        oneTimeCodeExpiresIn: Number,
        profilePicture: String,
        profileWallpaper: String,
        profileImageOptions: Array,
        bio: String,
        userInterests: Array,
        followingCount: Number,
        followersCount: Number,
        totalRewardAmount: Number,
        demonetized: Boolean,
        accountDeactivated: Boolean,
        accountDeleted: Boolean,
        inviteCode: String,
        watchlist: Array,
        walletSettings: String,
        isAuthenticated: Boolean,
        birthMonth: String,
        birthDate: Number,
        birthYear: Number,
        ipv4: Array,
        city: String,
        state: String,
        country: String,
        createdAt: Number,
        updatePasswordSession: String
    }
);

module.exports = mongoose.model("users-descs", usersDescsSchema, "users-descs");