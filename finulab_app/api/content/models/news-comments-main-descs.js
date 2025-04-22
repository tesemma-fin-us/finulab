const mongoose = require("mongoose");

const newsCommentsMainDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        newsId: String,
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
        status: String,
        flair: Array,
        timeStamp: Number
    }
);

module.exports = mongoose.model("news-comments-main-descs", newsCommentsMainDescsSchema, "news-comments-main-descs");