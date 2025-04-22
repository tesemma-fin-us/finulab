const mongoose = require("mongoose");

const postsDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        groupProfileImage: String,
        monetized: Boolean,
        verified: Boolean,
        title: String,
        post: String,
        language: String,
        translation: String,
        repostId: String,
        photos: Array,
        videos: Array,
        taggedAssets: Array,
        spam: Boolean,
        helpful: Boolean,
        postSubjects: Array,
        likes: Number,
        validatedLikes: Number,
        dislikes: Number,
        validatedDislikes: Number,
        views: Number,
        validatedViews: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        trendingScore: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        validTags: Array,
        timeStamp: Number
    }
);

module.exports = mongoose.model("posts-descs", postsDescsSchema, "posts-descs");