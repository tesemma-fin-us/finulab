const mongoose = require("mongoose");

const newsCommentsDeletedDescsSchema = mongoose.Schema(
    {
        generalId: String,
        username: String,
        profileImage: String,
        newsId: String,
        mainCommentId: String,
        commentId: String,
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

module.exports = mongoose.model("news-comments-deleted-descs", newsCommentsDeletedDescsSchema, "news-comments-deleted-descs");