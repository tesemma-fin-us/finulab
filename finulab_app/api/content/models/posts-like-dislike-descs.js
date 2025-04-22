const mongoose = require("mongoose");

const postsLikeDislikeDescsSchema = mongoose.Schema(
    {
        username: String,
        postId: String,
        type: String,
        status: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("posts-like-dislike-descs", postsLikeDislikeDescsSchema, "posts-like-dislike-descs");