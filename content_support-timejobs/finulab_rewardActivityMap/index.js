const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");
const pact = require("pact-lang-api");

dotenv.config();

const market_connx = mongoose.createConnection(process.env.mongo_market);
const content_connx = mongoose.createConnection(process.env.mongo_content_db);

const market_payoutAmountsTrackerSchema = mongoose.Schema(
    {
        postLiked: Number,
        postDisliked: Number,
        commentLiked: Number,
        commentDisliked: Number,
        postViewed: Number,
        commentViewed: Number,
        priceTargetSubmission: Number,
        recommendationSubmission: Number,
        timeStamp: Number
    }
);
const market_payoutAmountsTracker = market_connx.model("payout-amounts-tracker", market_payoutAmountsTrackerSchema, "payout-amounts-tracker");

const content_payoutAmountsTrackerSchema = mongoose.Schema(
    {
        postLiked: Number,
        postDisliked: Number,
        commentLiked: Number,
        commentDisliked: Number,
        postViewed: Number,
        commentViewed: Number,
        priceTargetSubmission: Number,
        recommendationSubmission: Number,
        timeStamp: Number
    }
);
const content_payoutAmountsTracker = content_connx.model("payout-amounts-tracker", content_payoutAmountsTrackerSchema, "payout-amounts-tracker");

const networkId = "mainnet01";
const chainwebLocal_one = "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/", chainwebLocal_two = "/pact/api/v1/local";

const adjustPayoutAmountsTracker = async () => {
    const accountId = "finulab-bank";

    const ttl = 28800;
    const now = new Date();
    const creationTime = datefns.getUnixTime(now);

    const chainId = "2";
    const gasLimit = 2320;
    const gasPrice = 0.000000010000;

    const sender = "chainweaver";
    const code = `{"${accountId}": (try false (free.finux.details "${accountId}"))}`;

    const pactCmd = pact.simple.exec.createCommand(undefined, undefined,
        code,
        undefined, pact.lang.mkMeta(sender, chainId, gasPrice, gasLimit, creationTime, ttl), networkId
    );
    
    let specific_balance = [];
    const chainResponse = await axios.post(`${chainwebLocal_one}${chainId}${chainwebLocal_two}`, pactCmd["cmds"][0]);
    if(chainResponse.data["result"]["status"] === "success"
        && chainResponse.data["result"]["data"][accountId] !== false
    ) {
        const valBal = Number(chainResponse.data["result"]["data"][accountId]["balance"]);
        if(isNaN(valBal) || !isFinite(valBal)) {
            const s_valBal = Number(chainResponse.data["result"]["data"][accountId]["balance"]["decimal"]);
            if(!isNaN(s_valBal) && isFinite(s_valBal)) {
                specific_balance = [
                    chainResponse.data["metaData"]["publicMeta"]["chainId"],
                    chainResponse.data["result"]["data"][accountId]["balance"]["decimal"]
                ];
            }
        } else {
            specific_balance = [
                chainResponse.data["metaData"]["publicMeta"]["chainId"],
                chainResponse.data["result"]["data"][accountId]["balance"]
            ];
        }
    }

    if(specific_balance.length === 2) {
        const bal = Number(specific_balance[1]);
        if(!isNaN(bal) && isFinite(bal)) {
            const newDistributionSet = {
                postLiked: (1 / 86795725.94524045) * bal,
                postDisliked: (1 / 86795725.94524045) * bal,
                commentLiked: (0.5 / 86795725.94524045) * bal,
                commentDisliked: (0.5 / 86795725.94524045) * bal,
                postViewed: (0.01 / 86795725.94524045) * bal,
                commentViewed: (0.001 / 86795725.94524045) * bal,
                priceTargetSubmission: 0,
                recommendationSubmission: 0,
                timeStamp: creationTime
            }

            await market_payoutAmountsTracker.insertMany([newDistributionSet]);
            await content_payoutAmountsTracker.insertMany([newDistributionSet]);

            const cutOff_timeStamp = creationTime - 1800;
            const afterCutOff_count = await market_payoutAmountsTracker.countDocuments({timeStamp: {$lte: cutOff_timeStamp}});
            if(afterCutOff_count > 0) {await market_payoutAmountsTracker.deleteMany({timeStamp: {$lte: cutOff_timeStamp}});}
        }
    }
}

adjustPayoutAmountsTracker().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);