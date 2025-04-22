const mongoose = require("mongoose");

const cryptosIndexSchema = mongoose.Schema(
    {
        symbol: String,
        symbolEmbedding: Array,
        polygonIoTicker: String,
        name: String,
        nameEmbedding: Array,
        profileImage: String,
        description: String,
        categories: Array,
        descriptionEmbedding: Array,
        exchanges: Array,
        cmcIndex: String,
        watchlistCount: Number,
        popularity: Number,
        circulatingSupply: Number,
        totalSupply: Number,
        maxSupply: Number,
        ath: Number,
        atl: Number,
        avgVol: Number,
        recommendations: Array,
        priceTargets: Array,
        website: String,
        whitePaper: String,
        blockExplorer: String,
        sourceCode: String,
        timeStamp: Number
    }
);

module.exports = mongoose.model("cryptos-index", cryptosIndexSchema, "cryptos-index");