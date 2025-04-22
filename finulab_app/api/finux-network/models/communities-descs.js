const mongoose = require("mongoose");

const communitiesDescsSchema = mongoose.Schema(
    {
        communityName: String,
        queryableName: String,
        creator: String,
        status: String,
        communityType: String,
        profilePicture: String,
        profileImageOptions: Array,
        profileWallpaper: String,
        bio: String,
        rules: Array,
        watchlist: Array,
        communityInterests: Array,
        todayPostCount: Number,
        moderators: Array,
        moderatorsPercentages: Array,
        moderatorsPrivileges: Array,
        membersCount: Number,
        aggregateBalance: Number,
        pendingBalanceMorning: Number,
        pendingBalanceEvening: Number,
        createdAt: Number
    }
);

module.exports = mongoose.model("communities-descs", communitiesDescsSchema, "communities-descs");