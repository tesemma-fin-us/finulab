const mongoose = require("mongoose");

const stockNewsStatementsSchema = mongoose.Schema(
    {
        symbol: String,
        source: String,
        title: String,
        summary: String,
        newsSubjects: Array,
        imageUrl: String,
        newsUrl: String,
        likes: Number,
        dislikes: Number,
        shares: Number,
        comments: Number,
        trendingScore: Number,
        confidenceScore: Number,
        timeStamp: Number
    }
);

module.exports = mongoose.model("stock-news-statements", stockNewsStatementsSchema, "stock-news-statements");