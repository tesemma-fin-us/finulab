const mongoose = require("mongoose");

const countriesStatesDescsSchema = mongoose.Schema(
    {
        country: Array,
        countryCode: String,
        state: String,
        stateCode: String,
        flagUrl: String
    }
);

module.exports = mongoose.model("countries-states-descs", countriesStatesDescsSchema, "countries-states-descs");