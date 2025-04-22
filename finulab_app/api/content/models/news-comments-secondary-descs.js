const mongoose = require("mongoose");

const newsCommentsSecondaryDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        newsId: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        comment: String,
        photos: Array,
        videos: Array,
        language: String,
        translation: String,
        mainCommentId: String,
        commentId: String,
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

module.exports = mongoose.model("news-comments-secondary-descs", newsCommentsSecondaryDescsSchema, "news-comments-secondary-descs");