const mongoose = require("mongoose");

const ynPredictionsIndexSchema = mongoose.Schema(
    {
        username: String,
        usernameEmbedding: Array,
        profileImage: String,
        groupId: String,
        groupIdEmbedding: Array,
        groupProfileImage: String,
        category: String,
        categoryImage: String,
        continous: Boolean,
        endDate: Number,
        predictiveImage: String,
        predictiveQuestion: String,
        predictiveQuestionEmbedding: Array,
        language: String,
        translation: String,
        subjects: Array,
        taggedAssets: Array,
        outcomeType: String,
        outcomes: Array,
        createdTimestamp: Number
    }
);

module.exports = mongoose.model("yn_predictions-index", ynPredictionsIndexSchema, "yn_predictions-index");