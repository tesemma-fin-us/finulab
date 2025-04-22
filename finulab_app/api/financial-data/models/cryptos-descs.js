const mongoose = require("mongoose");

const cryptosDescsSchema = mongoose.Schema(
    {
        symbol: String,
        polygonIoTicker: String,
        name: String,
        profileImage: String,
        description: String,
        categories: Array,
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

module.exports = mongoose.model("cryptos-descs", cryptosDescsSchema, "cryptos-descs");