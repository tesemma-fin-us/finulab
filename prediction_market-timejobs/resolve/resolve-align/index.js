const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const market_connx = mongoose.createConnection(process.env.mongo_prediction_market);

const predictionsResolutionSchema = mongoose.Schema(
    {
        predictionId: String,
        marketId: String,
        creator: String,
        chainId: String,
        outcome: String,
        resolutionOutcome: String,

        readyForClose: Boolean,
        closeNotified: Boolean,
        closed: Boolean, 
        closeSent: Boolean,
        closeValidated: Boolean,
        closeRequestKey: String,
        closeSentTimestamp: Number,
        closeValidatedTimestamp: Number,
        closeValidationAttempts: Number,

        readyForResolution: Boolean,
        resolveNotified: Boolean,
        resolved: Boolean,
        resolveSent: Boolean,
        resolveValidated: Boolean,
        resolveRequestKey: String,
        resolveSentTimestamp: Number,
        resolveValidatedTimestamp: Number,
        resolveValidationAttempts: Number,

        portfolioSubmitted: Boolean
    }
);
const predictionsResolutionDesc = market_connx.model("y-n-predictions-resolution", predictionsResolutionSchema, "y-n-predictions-resolution");

const resolveAlign = async () => {
    const marketsToAlign = await predictionsResolutionDesc.find(
        {
            resolutionOutcome: {$ne: ""},
            closed: true, 
            closeSent: true,
            closeValidated: true, 
            readyForResolution: false
        }
    );

    if(marketsToAlign.length > 0) {
        await predictionsResolutionDesc.updateMany(
            {resolutionOutcome: {$ne: ""}, closed: true, closeSent: true, closeValidated: true, readyForResolution: false}, 
            {$set: {readyForResolution: true}}
        );
    }
}

resolveAlign().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);