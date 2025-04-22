const mongoose = require("mongoose");

const stocksIndexSchema = mongoose.Schema(
    {
        symbol: String,
        symbolEmbedding: Array,
        alphaVantageName: String,
        polygonIoName: String,
        nameEmbedding: Array,
        description: String,
        categories: Array,
        descriptionEmbedding: Array,
        exchange: String,
        assetType: String,
        ipoDate: String,
        delistingDate: String,
        marketStatus: String,
        finulabStatus: String,
        watchlistCount: Number,
        popularity: Number,
        sharesOutstanding: Number,
        marketCap: Number,
        priceToEarnings: Number,
        dividendYield: Number,
        expenseRatio: Number,
        recommendations: Array,
        priceTargets: Array,
        peers: Array,
        cik: String,
        profileImage: String,
        website: String,
        address: String,
        sector: String,
        industry: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("stocks-index", stocksIndexSchema, "stocks-index");