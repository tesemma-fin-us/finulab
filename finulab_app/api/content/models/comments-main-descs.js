const mongoose = require("mongoose");

const commentsMainDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        postId: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        limit: Number,
        comment: String,
        photos: Array,
        videos: Array,
        language: String,
        translation: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);

module.exports = mongoose.model("comments-main-descs", commentsMainDescsSchema, "comments-main-descs");