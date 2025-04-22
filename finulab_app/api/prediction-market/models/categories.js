const mongoose = require("mongoose");

const categoriesSchema = mongoose.Schema(
    {
        desc: String, 
        profileImage: String, 
        livePredictions: Number,
        totalPredictions: Number, 
        liveParticipants: Number, 
        liveVolume: Number, 
        liveLiquidity: Number, 
    }
);

module.exports = mongoose.model("categories", categoriesSchema, "categories");