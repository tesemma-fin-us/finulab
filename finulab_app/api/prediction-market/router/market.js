const axios = require("axios");
const {JSDOM} = require("jsdom");
const nlp = require("compromise");
const datefns = require("date-fns");
const router = require("express").Router();
const createDOMPurify = require("dompurify");

const configDesc = require("../models/config");
const marketCategories = require("../models/categories");

const activityDesc = require("../models/y-n-activity");
const holdingsDesc = require("../models/y-n-holdings");
const marketDesc = require("../models/y-n-market");
const predictionsDesc = require("../models/y-n-predictions");
const predictionsApprovedDesc = require("../models/y-n-predictions-approved");
const predictionsTxsDesc = require("../models/y-n-predictions-txs");
const predictionsResolution = require("../models/y-n-predictions-resolution");
const predictionLikeDislikeDescs = require("../models/y-n-predictions-like-dislike");

const payoutAmountsTracker = require("../models/payout-amounts-tracker");

const c_activityDesc = require("../models/c-activity");
const c_holdingsDesc = require("../models/c-holdings");
const c_marketDesc = require("../models/c-market");
const c_predictionsDesc = require("../models/c-predictions");
const c_predictionsApprovedDesc = require("../models/c-predictions-approved");
const c_predictionsTxsDesc = require("../models/c-predictions-txs");

const commentsMainDescs = require("../models/comments-main-descs");
const commentsDeletedDesc = require("../models/comments-deleted-descs");
const commentsSecondaryDescs = require("../models/comments-secondary-descs");
const commentsLikeDislikeDescs = require("../models/comments-like-dislike-descs");

const calcConfidenceScore = (likes, dislikes) => {
    const n = likes + dislikes;
    if(n === 0) {
        return 0;
    } else {
        const z = 1.281551565545, p = likes / n;

        const left = p + ((1 / (2 * n)) * Math.pow(z, 2));
        const rightSupport = ((p * (1 - p)) / n) + (Math.pow(z, 2) / (4 * Math.pow(n, 2)));
        const right = z * Math.pow(rightSupport, 0.5);
        const under = 1 + ((1 / n) * Math.pow(z, 2));

        return ((left - right) / under)
    }
}

const parseResolution = (input) => {
    const match = input.match(/^(\d+)([a-zA-Z])?$/);
    if(match) {
        const numberPart = match[1]; // The number part (digits)
        const letterPart = match[2] || ''; // The letter part (if exists)
        return {numberPart, letterPart};
    } else {
        return null; // In case the input doesn't match the expected pattern
    }
}

const imgToBase64 = async (imgUrl) => {
    try {
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const base64ImageString = `data:${response.headers['content-type'].toLowerCase()};base64,${base64}`;
        return base64ImageString;
    } catch (error) {
        return imgUrl;
    }
};

const removeDuplicatesByTimestamp = (arr) => {
    let uniqueArray = [];
    const seenTimestamps = {};

    arr.forEach(item => {
        if(!seenTimestamps[item.t]) {
            seenTimestamps[item.t] = true;
            uniqueArray.push(item);
        }
    });

    uniqueArray = uniqueArray.sort((a, b) => a.t - b.t);
    return uniqueArray;
}

const levenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for(let i = 0; i <= str1.length; i++) {
        track[0][i] = i;
    }

    for(let j = 0; j <= str2.length; j++) {
        track[j][0] = j;
    }

    for(let j = 1; j <= str2.length; j++) {
        for(let i = 1; i <= str1.length; i++) {
            if(str1[i - 1] === str2[j - 1]) {
                track[j][i] = track[j - 1][i - 1];
            } else {
                track[j][i] = Math.min(
                    track[j - 1][i - 1],
                    track[j][i - 1],
                    track[j - 1][i]
                ) + 1;
            }
        }
    }
      
    return track[str2.length][str1.length];
}

const stringSimilarity = (str1, str2) => {
    const longer = Math.max(str1.length, str2.length);
    if(longer === 0) return 1;

    const distance = levenshteinDistance(str1, str2);
    return ((longer - distance) / longer) * 100;
}

const extractSubjects = (text) => {
    let subjects = [];
    let doc = nlp(text);

    let entities = doc.match('#Person #Organization #Place #Demonym #Event #Product #TitleCase');
    entities.forEach((entity) => {
        if(!subjects.includes(entity.text().toLowerCase())) {
            subjects.push(entity.text().toLowerCase());
        }
    });

    let nouns = doc.nouns().not('(#Pronoun|#Determiner)').out('array');
    nouns.forEach((noun) => {
        if (!subjects.includes(noun.toLowerCase()) && !noun.toLowerCase().startsWith('a ') && !noun.toLowerCase().startsWith('an ') && !noun.toLowerCase().startsWith('the ')) {
            subjects.push(noun.toLowerCase());
        }
    });

    return subjects;
}

const authorizedReviewers = ["tesemma.fin-us", "Rollwithdawinners", "Yanniyoh"];
const chainIds = ["0", "1", "2", "3", "4", "5", "6", "7", "8", 
    "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"
];
const leastGreaterThanTarget = (arr, target) => 
    arr.reduce((min, current) => current > target && (min === null || current < min) ? current : min, null);

router.put("/config", async (req, res) => 
    {
        try {
            await configDesc.findOne(
                {}
            ).then(
                (configData) => {
                    if(!configData) {return res.status(200).json({"status": "error"});}

                    if(configData) {
                        return res.status(200).json({"status": "success", "data": configData});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/categories", async (req, res) => 
    {
        try {
            await marketCategories.find(
                {}
            ).then(
                async (marketCategoriesData) => {
                    if(!marketCategoriesData) {return res.status(200).json({"status": "error"});}
                    if(marketCategoriesData) {return res.status(200).json({"status": "success", "data": marketCategoriesData});}
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/chain-pended-balance", async (req, res) => 
    {
        try {
            const chainId = `${req.body.chainId}`;
            const uniqueId = `${req.body.uniqueId}`;
            if(!chainIds.includes(chainId)) {return res.status(200).json({"status": "error"});}

            const pendedBalanceDesc = await predictionsDesc.aggregate(
                [
                    {
                        $match: {
                            username: uniqueId,
                            creationChain: chainId
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const pendedBalance = pendedBalanceDesc.length > 0 ? pendedBalanceDesc[0].totalPendedBalance : 0;
            
            const c_pendedBalanceDesc = await c_predictionsDesc.aggregate(
                [
                    {
                        $match: {
                            username: uniqueId,
                            creationChain: chainId
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const c_pendedBalance = c_pendedBalanceDesc.length > 0 ? c_pendedBalanceDesc[0].totalPendedBalance : 0;

            const secondaryPendedBalanceDesc = await predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {
                            username: uniqueId, 
                            function: "credit",
                            chainId: chainId
                        }
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const secondaryPendedBalance = secondaryPendedBalanceDesc.length > 0 ? secondaryPendedBalanceDesc[0].totalPendedBalance : 0;

            const c_secondaryPendedBalanceDesc = await c_predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {
                            username: uniqueId, 
                            function: "credit",
                            chainId: chainId
                        }
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const c_secondaryPendedBalance = c_secondaryPendedBalanceDesc.length > 0 ? c_secondaryPendedBalanceDesc[0].totalPendedBalance : 0;

            const tertiaryPendedBalanceDesc = await predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {
                            username: uniqueId, 
                            function: "debit",
                            chainId: chainId
                        }
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const tertiaryPendedBalance = tertiaryPendedBalanceDesc.length > 0 ? tertiaryPendedBalanceDesc[0].totalPendedBalance : 0;

            const c_tertiaryPendedBalanceDesc = await c_predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {
                            username: uniqueId, 
                            function: "debit",
                            chainId: chainId
                        }
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const c_tertiaryPendedBalance = c_tertiaryPendedBalanceDesc.length > 0 ? c_tertiaryPendedBalanceDesc[0].totalPendedBalance : 0;

            return res.status(200).json(
                {
                    "status": "success", 
                    "data": (pendedBalance + c_pendedBalance) + (secondaryPendedBalance + c_secondaryPendedBalance), 
                    "awaiting": tertiaryPendedBalance + c_tertiaryPendedBalance
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/pended-balance", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            const pendedBalanceDesc = await predictionsDesc.aggregate(
                [
                    {
                        $match: {username: uniqueId}
                    },
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const pendedBalance = pendedBalanceDesc.length > 0 ? pendedBalanceDesc[0].totalPendedBalance : 0;
            
            const c_pendedBalanceDesc = await c_predictionsDesc.aggregate(
                [
                    {
                        $match: {username: uniqueId}
                    },
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const c_pendedBalance = c_pendedBalanceDesc.length > 0 ? c_pendedBalanceDesc[0].totalPendedBalance : 0;

            const secondaryPendedBalanceDesc = await predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {username: uniqueId, function: "credit"}
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const secondaryPendedBalance = secondaryPendedBalanceDesc.length > 0 ? secondaryPendedBalanceDesc[0].totalPendedBalance : 0;

            const c_secondaryPendedBalanceDesc = await c_predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {username: uniqueId, function: "credit"}
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const c_secondaryPendedBalance = c_secondaryPendedBalanceDesc.length > 0 ? c_secondaryPendedBalanceDesc[0].totalPendedBalance : 0;

            const tertiaryPendedBalanceDesc = await predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {username: uniqueId, function: "debit"}
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const tertiaryPendedBalance = tertiaryPendedBalanceDesc.length > 0 ? tertiaryPendedBalanceDesc[0].totalPendedBalance : 0;

            const c_tertiaryPendedBalanceDesc = await c_predictionsTxsDesc.aggregate(
                [
                    {
                        $match: {username: uniqueId, function: "debit"}
                    }, 
                    {
                        $group: {
                            _id: null,
                            totalPendedBalance: {$sum: "$pendedBalance"}
                        }
                    }
                ]
            );
            const c_tertiaryPendedBalance = c_tertiaryPendedBalanceDesc.length > 0 ? c_tertiaryPendedBalanceDesc[0].totalPendedBalance : 0;

            return res.status(200).json(
                {
                    "status": "success", 
                    "data": (pendedBalance + c_pendedBalance) + (secondaryPendedBalance + c_secondaryPendedBalance), 
                    "awaiting": tertiaryPendedBalance + c_tertiaryPendedBalance
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile-pred-count", async (req, res) => 
    {
        try {
            const username = `${req.body.username}`;
            const predictionCount = await predictionsDesc.countDocuments({username: username});

            return res.status(200).json({"status": "success", "data": predictionCount});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const p_ninclude = req.body.p_ninclude;
            const username = `${req.body.username}`;
            
            if(!Array.isArray(p_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await predictionsDesc.countDocuments({username: username});

                const predictions = await predictionsDesc.find(
                    {
                        username: username
                    }
                ).sort({decisionTimestamp: -1}).limit(5).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();
                
                let predictionIds = [];
                for(let i = 0; i < predictions.length; i++) {
                    predictionIds.push(predictions[i]["_id"]);
                }

                const markets = await marketDesc.find(
                    {
                        predictionId: {$in: predictionIds}
                    }
                );

                return res.status(200).json({"status": "success", "data": predictions, "markets": markets, "dataCount": dataCount});
            } else if(type === "secondary") {
                const predictions = await predictionsDesc.find(
                    {
                        _id: {$nin: p_ninclude},
                        username: username
                    }
                ).sort({decisionTimestamp: -1}).limit(5).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();
                
                let predictionIds = [];
                for(let i = 0; i < predictions.length; i++) {
                    predictionIds.push(predictions[i]["_id"]);
                }

                const markets = await marketDesc.find(
                    {
                        predictionId: {$in: predictionIds}
                    }
                );

                return res.status(200).json({"status": "success", "data": predictions, "markets": markets});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/engaged", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const p_ninclude = req.body.p_ninclude;
            const uniqueId = `${req.body.uniqueId}`;

            if(!Array.isArray(p_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await predictionLikeDislikeDescs.countDocuments({username: uniqueId, status: "active"});
                
                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "markets": [], "dataCount": dataCount});
                } else {
                    const predictionIds = await predictionLikeDislikeDescs.find(
                        {
                            username: uniqueId, 
                            status: "active"
                        }
                    ).sort({timeStamp: -1}).limit(5);

                    let pull_predictionIds = [];
                    for(let i = 0; i < predictionIds.length; i++) {
                        pull_predictionIds.push(predictionIds[i]["predictionId"]);
                    }

                    const predictions = await predictionsDesc.find(
                        {
                            _id: {$in: pull_predictionIds}
                        }
                    );

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: pull_predictionIds}
                        }
                    );

                    const timeStampMap = new Map(predictionIds.map(item => [item.predictionId, item.timeStamp]));
                    const data = predictions.sort((a, b) => {
                        const A = timeStampMap.get(a._id);
                        const B = timeStampMap.get(b._id);

                        return (B || 0) - (A || 0);
                    });

                    return res.status(200).json({"status": "success", "data": data, "markets": markets, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const predictionIds = await predictionLikeDislikeDescs.find(
                    {
                        username: uniqueId, 
                        predictionId: {$nin: p_ninclude},
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(5);

                let pull_predictionIds = [];
                for(let i = 0; i < predictionIds.length; i++) {
                    pull_predictionIds.push(predictionIds[i]["predictionId"]);
                }

                const predictions = await predictionsDesc.find(
                    {
                        _id: {$in: pull_predictionIds}
                    }
                );

                const markets = await marketDesc.find(
                    {
                        predictionId: {$in: pull_predictionIds}
                    }
                );

                const timeStampMap = new Map(predictionIds.map(item => [item.predictionId, item.timeStamp]));
                const data = predictions.sort((a, b) => {
                    const A = timeStampMap.get(a._id);
                    const B = timeStampMap.get(b._id);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data, "markets": markets});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/update-stat", async (req, res) => 
    {
        try {
            const predictionId = `${req.body.predictionId}`;

            const prediction = await predictionsDesc.findOne(
                {
                    "_id": predictionId
                }
            ).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

            if(!prediction) {
                return res.status(200).json({"status": "error"});
            } else {
                const prediction_keys = Object.keys(prediction);
                if(prediction_keys.length === 0) {
                    return res.status(200).json({"status": "error"});
                } else {
                    const markets = await marketDesc.find(
                        {
                            predictionId: predictionId
                        }
                    );
        
                    return res.status(200).json({"status": "success", "data": prediction, "markets": markets});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/recommended", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const limit = Number(req.body.limit);
            const p_ninclude = req.body.p_ninclude;
            
            if(isNaN(limit)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(p_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(Array.isArray(req.body.interests)) {
                let predictionsCount;
                if(type === "primary") {predictionsCount = await predictionsDesc.countDocuments({"status": "live"});}

                if(req.body.interests.length === 0) {
                    const predictions = await predictionsDesc.find(
                        {
                            "_id": {$nin: p_ninclude},
                            "status": "live"
                        }
                    ).sort({liquidity: -1, decisionTimestamp: -1, confidenceScore: -1}).limit(2 * limit).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();
                    
                    let predictionIds = [];
                    for(let i = 0; i < predictions.length; i++) {
                        predictionIds.push(predictions[i]["_id"]);
                    }

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );
                    
                    if(type === "primary") {
                        return res.status(200).json({"status": "success", "data": predictions.sort((a, b) => (b.liquidity - a.liquidity)), "markets": markets, "count": predictionsCount});
                    } else {
                        return res.status(200).json({"status": "success", "data": predictions.sort((a, b) => (b.liquidity - a.liquidity)), "markets": markets});
                    }
                } else {
                    const predictionsByInterest = await predictionsDesc.find(
                        {
                            "_id": {$nin: p_ninclude},
                            "status": "live",
                            "subjects": {$in: req.body.interests}
                        }
                    ).sort({liquidity: -1, decisionTimestamp: -1, confidenceScore: -1}).limit(2 * limit).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();
                    
                    let predictionIds = [], predictionIdsToEliminate = [...p_ninclude];
                    for(let i = 0; i < predictionsByInterest.length; i++) {
                        predictionIds.push(predictionsByInterest[i]["_id"]);
                        predictionIdsToEliminate.push(predictionsByInterest[i]["_id"]);
                    }

                    if(predictionsByInterest.length === (2 * limit)) {
                        const markets = await marketDesc.find(
                            {
                                predictionId: {$in: predictionIds}
                            }
                        );

                        if(type === "primary") {
                            return res.status(200).json({"status": "success", "data": predictionsByInterest.sort((a, b) => (b.liquidity - a.liquidity)), "markets": markets, "count": predictionsCount});
                        } else {
                            return res.status(200).json({"status": "success", "data": predictionsByInterest.sort((a, b) => (b.liquidity - a.liquidity)), "markets": markets});
                        }
                    } else {
                        const predictionsByTrendingScore = await predictionsDesc.find(
                            {
                                "_id": {$nin: predictionIdsToEliminate},
                                "status": "live"
                            }
                        ).sort({liquidity: -1, decisionTimestamp: -1, confidenceScore: -1}).limit((2 * limit) - predictionsByInterest.length).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

                        for(let j = 0; j < predictionsByTrendingScore.length; j++) {
                            predictionIds.push(predictionsByTrendingScore[j]["_id"]);
                        }

                        const markets = await marketDesc.find(
                            {
                                predictionId: {$in: predictionIds}
                            }
                        );

                        if(type === "primary") {
                            return res.status(200).json({"status": "success", "data": [...predictionsByInterest].concat(predictionsByTrendingScore).sort((a, b) => (b.liquidity - a.liquidity)), "markets": markets, "count": predictionsCount});
                        } else {
                            return res.status(200).json({"status": "success", "data": [...predictionsByInterest].concat(predictionsByTrendingScore).sort((a, b) => (b.liquidity - a.liquidity)), "markets": markets});
                        }
                    }
                }
            } else {return res.status(200).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/prediction", async (req, res) => 
    {
        try {
            const predictionId = `${req.body.predictionId}`;
            const prediction = await predictionsDesc.findOne(
                {
                    "_id": predictionId
                }
            ).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();
            
            const markets = await marketDesc.find(
                {
                    predictionId: predictionId
                }
            );

            return res.status(200).json({"status": "success", "data": prediction, "markets": markets});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }   
    }
);

router.put("/category-predictions", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const limit = Number(req.body.limit);
            const p_ninclude = req.body.p_ninclude;
            const category = `${req.body.category}`;

            if(isNaN(limit)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(p_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(category === "For Review" || category === "For Resolution") {
                let auth_pullQuery = {};
                if(category === "For Review") {
                    type === "primary" ? 
                        auth_pullQuery = {"status": "in-review", "finulabDecision": "pending"} :
                        auth_pullQuery = {"_id": {$nin: p_ninclude}, "status": "in-review", "finulabDecision": "pending"};
                } else if(category === "For Resolution") {
                    type === "primary" ? 
                        auth_pullQuery = {"status": "ended", "finulabDecision": "approved"} : 
                        auth_pullQuery = {"_id": {$nin: p_ninclude}, "status": "ended", "finulabDecision": "approved"};
                }

                if(type === "primary") {
                    const predictionsCount = await predictionsDesc.countDocuments(auth_pullQuery);

                    const predictions = await predictionsDesc.find(auth_pullQuery).sort(
                        {createdTimestamp: 1}
                    ).limit(2 * limit).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

                    let predictionIds = [];
                    for(let i = 0; i < predictions.length; i++) {
                        predictionIds.push(predictions[i]["_id"]);
                    }

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );

                    return res.status(200).json({"status": "success", "data": predictions, "markets": markets, "count": predictionsCount});
                } else if(type === "secondary") {
                    const predictions = await predictionsDesc.find(auth_pullQuery).sort(
                        {createdTimestamp: 1}
                    ).limit(2 * limit).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

                    let predictionIds = [];
                    for(let i = 0; i < predictions.length; i++) {
                        predictionIds.push(predictions[i]["_id"]);
                    }

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );

                    return res.status(200).json({"status": "success", "data": predictions, "markets": markets});
                }
            } else {
                const categories = await marketCategories.find({});
                const availableCategories = categories.map(cat_desc => cat_desc["desc"]);

                if(availableCategories.length === 0) {return res.status(200).json({"status": "error"});}
                if(!availableCategories.includes(category)) {return res.status(200).json({"status": "error"});}

                if(type === "primary") {
                    const predictionsCount = await predictionsDesc.countDocuments({"category": category, "status": "live"});

                    const predictions = await predictionsDesc.find(
                        {
                            "category": category,
                            "status": "live"
                        }
                    ).sort({liquidity: -1, decisionTimestamp: -1, confidenceScore: -1}).limit(2 * limit).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

                    let predictionIds = [];
                    for(let i = 0; i < predictions.length; i++) {
                        predictionIds.push(predictions[i]["_id"]);
                    }

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );

                    return res.status(200).json({"status": "success", "data": predictions, "markets": markets, "count": predictionsCount});
                } else if(type === "secondary") {
                    const predictions = await predictionsDesc.find(
                        {
                            "_id": {$nin: p_ninclude},
                            "category": category,
                            "status": "live"
                        }
                    ).sort({liquidity: -1, decisionTimestamp: -1, confidenceScore: -1}).limit(2 * limit).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

                    let predictionIds = [];
                    for(let i = 0; i < predictions.length; i++) {
                        predictionIds.push(predictions[i]["_id"]);
                    }

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );

                    return res.status(200).json({"status": "success", "data": predictions, "markets": markets});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/search/", async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;
            const result = await axios.put(`http://localhost:8802/api/marketDataFeed/search?q=${q}`);

            if(result.data["status"] === "success") {
                if(result.data["data"].length > 0) {
                    let predictionIds = [];
                    for(let i = 0; i < result.data["data"].length; i++) {
                        predictionIds.push(result.data["data"][i]["_id"]);
                    }

                    const predictions = await predictionsDesc.find(
                        {
                            "_id": {$in: predictionIds},
                            "finulabDecision": "approved"
                        }
                    ).select(`_id username profileImage groupId groupProfileImage category categoryImage continous endDate predictiveImage predictiveQuestion outcomeType participants volume liquidity status likes dislikes comments reposts`).exec();

                    const markets = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );

                    return res.status(200).json({"status": "success", "data": predictions, "markets": markets});
                } else {
                    return res.status(200).json({"status": "success", "data": [], "markets": []});
                }
            } else {
                return res.status(200).json({"status": "success", "data": [], "markets": []});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/specific-holdings", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const predictionIds = req.body.predictionIds;
            if(!Array.isArray(predictionIds)) {return res.status(200).json({"status": "error"});}

            const holdingsData = await holdingsDesc.find(
                {
                    username: uniqueId,
                    predictionId: {$in: predictionIds},
                    resolutionRequestKeys: {$eq: []},
                    $or: [
                        {yesQuantity: {$gt: 0}}, 
                        {noQuantity: {$gt: 0}}
                    ]
                }
            ).select(`predictionId predictiveImage predictiveQuestion marketId outcome outcomeImage yesQuantity yesAveragePrice yesQuantityDesc noQuantity noAveragePrice noQuantityDesc boughtTimestamp resolutionOutcome resolutionRequestKeys earnings predictionEndTimestamp`).exec();
            
            return res.status(200).json({"status": "success", "data": holdingsData});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/live-holdings", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            const holdingsData = await holdingsDesc.find(
                {
                    username: uniqueId,
                    resolutionRequestKeys: {$eq: []},
                    $or: [
                        {yesQuantity: {$gt: 0}}, 
                        {noQuantity: {$gt: 0}}
                    ]
                }
            ).select(`predictionId predictiveImage predictiveQuestion marketId outcome outcomeImage yesQuantity yesAveragePrice yesQuantityDesc noQuantity noAveragePrice noQuantityDesc boughtTimestamp resolutionOutcome resolutionRequestKeys earnings predictionEndTimestamp`).exec();
            
            if(holdingsData.length > 0) {
                let predictionIds = [];
                for(let i = 0; i < holdingsData.length; i++) {
                    predictionIds.push(holdingsData[i]["predictionId"]);
                }

                const openedTimestamps = await predictionsDesc.find(
                    {
                        "_id": {$in: predictionIds}
                    }
                ).select(`createdTimestamp`).exec();

                let updatedHoldingsData = [];
                for(let j = 0; j < holdingsData.length; j++) {
                    updatedHoldingsData.push(
                        {
                            ...holdingsData[j]["_doc"],
                            "createdTimestamp": openedTimestamps.filter(opnd_desc => String(opnd_desc["_id"]) === holdingsData[j]["predictionId"])[0]["createdTimestamp"]
                        }
                    );
                }

                return res.status(200).json({"status": "success", "data": updatedHoldingsData});
            } else {
                return res.status(200).json({"status": "success", "data": holdingsData});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/closed-holdings", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            const holdingsData = await holdingsDesc.find(
                {
                    username: uniqueId,
                    resolutionRequestKeys: {$ne: []},
                    $or: [
                        {yesQuantity: {$gt: 0}}, 
                        {noQuantity: {$gt: 0}}
                    ]
                }
            ).select(`predictionId predictiveImage predictiveQuestion marketId outcome outcomeImage yesQuantity yesAveragePrice yesQuantityDesc noQuantity noAveragePrice noQuantityDesc boughtTimestamp resolutionOutcome resolutionRequestKeys earnings predictionEndTimestamp`).exec();

            return res.status(200).json({"status": "success", "data": holdingsData});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/price-history", async (req, res) => 
    {
        try {
            const to = req.body.to;
            const from = req.body.from;
            const countBack = req.body.countBack;
            const selection = `${req.body.selection}`;
            const marketId = `${req.body.marketId}`.split("-")[0];
            const resolution = parseResolution(req.body.resolution);

            if(isNaN(countBack) || !isFinite(countBack)) {return res.status(200).json({"status": "error"});}
            if(!(selection === "priceYes" || selection === "priceNo")) {return res.status(200).json({"status": "error"});}
            if(isNaN(to) || isNaN(from) || !isFinite(to) || !isFinite(from)) {return res.status(200).json({"status": "error"});}

            let intervalInSeconds = 0
            if(resolution === undefined || resolution === null) {
                return res.status(200).json({"status": "error"});
            } else if(Object.keys(resolution).length === 0) {
                return res.status(200).json({"status": "error"});
            } else {
                if(resolution.letterPart === '') {
                    intervalInSeconds = Number(resolution.numberPart) * 60;
                } else if(resolution.letterPart === 'S') {
                    intervalInSeconds = Number(resolution.numberPart);
                } else if(resolution.letterPart === 'D') {
                    intervalInSeconds = Number(resolution.numberPart) * 86400;
                } else if(resolution.letterPart === 'W') {
                    intervalInSeconds = Number(resolution.numberPart) * 604800;
                } else if(resolution.letterPart === 'M') {
                    intervalInSeconds = Number(resolution.numberPart) * 604800 * 4;
                } else if(resolution.letterPart === 'Y') {
                    intervalInSeconds = Number(resolution.numberPart) * 604800 * 52;
                } else {
                    return res.status(200).json({"status": "error"});
                }
            }
            if(intervalInSeconds === 0) {return res.status(200).json({"status": "error"});}

            let priceHistory = [], data = await activityDesc.find(
                {
                    marketId: marketId,
                    openedTimestamp: {$gte: from, $lte: to}
                }
            ).sort({openedTimestamp: 1}).select(`openedTimestamp costFunctionDesc prevCostFunctionDesc -_id`).exec();

            if(data.length === 0) { 
                data = await activityDesc.find(
                    {
                        marketId: marketId
                    }
                ).sort({openedTimestamp: -1}).limit(1).select(`openedTimestamp costFunctionDesc prevCostFunctionDesc -_id`).exec();
            }

            if(data.length === 0) {return res.status(200).json({"status": "error"});}

            const interval = Math.floor((to - from) / intervalInSeconds);
            priceHistory = new Array(interval + 1).fill(null).map((_, index) => 
                {
                    const n = index;
                    return {
                        "o": 0,
                        "h": 0,
                        "l": 0,
                        "c": 0,
                        "v": 0,
                        "t": from + ((n - 1) * intervalInSeconds)
                    }
                }
            );

            let dataInputSupport = [];
            for(let k = 0; k < data.length; k++) {
                dataInputSupport.push(
                    {
                        "o": 0,
                        "h": 0,
                        "l": 0,
                        "c": 0,
                        "v": 0,
                        "t": data[k]["openedTimestamp"]
                    }
                );
            }
            priceHistory = priceHistory.concat(dataInputSupport);
            priceHistory = removeDuplicatesByTimestamp(priceHistory);

            let m = 0;
            let lastDataPointHit = false;
            let firstDataPointHit = false;
            for(let i = 0; i < priceHistory.length; i++) {
                if(priceHistory[i]["t"] < data[0]["openedTimestamp"]) {
                    if(data[0]["prevCostFunctionDesc"]["costFunction"] === 0) continue;

                    priceHistory[i].o = data[0]["prevCostFunctionDesc"][selection];
                    priceHistory[i].h = data[0]["prevCostFunctionDesc"][selection];
                    priceHistory[i].l = data[0]["prevCostFunctionDesc"][selection];
                    priceHistory[i].c = data[0]["prevCostFunctionDesc"][selection];
                    priceHistory[i].v = 0;
                }

                if(!firstDataPointHit && m === 0) {
                    priceHistory[i].o = data[0]["prevCostFunctionDesc"][selection];
                    priceHistory[i].h = Math.max(data[0]["costFunctionDesc"][selection], data[0]["prevCostFunctionDesc"][selection]);
                    priceHistory[i].l = Math.min(data[0]["costFunctionDesc"][selection], data[0]["prevCostFunctionDesc"][selection]);
                    priceHistory[i].c = data[0]["costFunctionDesc"][selection];
                    selection === "priceYes" ?
                        priceHistory[i].v = Math.abs(data[0]["costFunctionDesc"]["quantityYes"] - data[0]["prevCostFunctionDesc"]["quantityYes"]) :
                        priceHistory[i].v = Math.abs(data[0]["costFunctionDesc"]["quantityNo"] - data[0]["prevCostFunctionDesc"]["quantityNo"]);

                    if((m + 1) <= (data.length - 1)) {m++;}
                    firstDataPointHit = true;
                    data.length === 1 ? lastDataPointHit = true : lastDataPointHit = false;
                } else {
                    if(priceHistory[i].t < data[m]["openedTimestamp"]) {
                        priceHistory[i].o = priceHistory[i - 1].c;
                        priceHistory[i].h = priceHistory[i - 1].c;
                        priceHistory[i].l = priceHistory[i - 1].c;
                        priceHistory[i].c = priceHistory[i - 1].c;
                        priceHistory[i].v = 0;
                    } else {
                        if(!lastDataPointHit) {
                            const data_forPeriod = data.filter(act_desc => act_desc["openedTimestamp"] === priceHistory[i].t);
                            if(data_forPeriod.length > 0) {
                                for(let j = 0; j < data_forPeriod.length; j++) {
                                    i = i + j;

                                    if(i <= priceHistory.length - 1) {
                                        priceHistory[i].o = data_forPeriod[j]["prevCostFunctionDesc"][selection];
                                        priceHistory[i].h = Math.max(data_forPeriod[j]["costFunctionDesc"][selection], data_forPeriod[j]["prevCostFunctionDesc"][selection]);
                                        priceHistory[i].l = Math.min(data_forPeriod[j]["costFunctionDesc"][selection], data_forPeriod[j]["prevCostFunctionDesc"][selection]);
                                        priceHistory[i].c = data_forPeriod[j]["costFunctionDesc"][selection];
                                        selection === "priceYes" ?
                                            priceHistory[i].v = Math.abs(data_forPeriod[j]["costFunctionDesc"]["quantityYes"] - data_forPeriod[j]["prevCostFunctionDesc"]["quantityYes"]) :
                                            priceHistory[i].v = Math.abs(data_forPeriod[j]["costFunctionDesc"]["quantityNo"] - data_forPeriod[j]["prevCostFunctionDesc"]["quantityNo"]);
                                    } else {
                                        priceHistory[priceHistory.length - 1].o = data_forPeriod[j]["prevCostFunctionDesc"][selection];
                                        priceHistory[priceHistory.length - 1].h = Math.max(data_forPeriod[j]["costFunctionDesc"][selection], data_forPeriod[j]["prevCostFunctionDesc"][selection]);
                                        priceHistory[priceHistory.length - 1].l = Math.min(data_forPeriod[j]["costFunctionDesc"][selection], data_forPeriod[j]["prevCostFunctionDesc"][selection]);
                                        priceHistory[priceHistory.length - 1].c = data_forPeriod[j]["costFunctionDesc"][selection];
                                        selection === "priceYes" ?
                                            priceHistory[priceHistory.length - 1].v = Math.abs(data_forPeriod[j]["costFunctionDesc"]["quantityYes"] - data_forPeriod[j]["prevCostFunctionDesc"]["quantityYes"]) :
                                            priceHistory[priceHistory.length - 1].v = Math.abs(data_forPeriod[j]["costFunctionDesc"]["quantityNo"] - data_forPeriod[j]["prevCostFunctionDesc"]["quantityNo"]);
                                    }
                                }
                                
                                if((m + data_forPeriod.length) <= (data.length - 1)) {m = m + data_forPeriod.length;}
                                if(m === data.length - 1) {lastDataPointHit = true;}
                            } else {
                                priceHistory[i].o = priceHistory[i - 1].c;
                                priceHistory[i].h = priceHistory[i - 1].c;
                                priceHistory[i].l = priceHistory[i - 1].c;
                                priceHistory[i].c = priceHistory[i - 1].c;
                                priceHistory[i].v = 0;
                            }
                        } else {
                            priceHistory[i].o = priceHistory[i - 1].c;
                            priceHistory[i].h = priceHistory[i - 1].c;
                            priceHistory[i].l = priceHistory[i - 1].c;
                            priceHistory[i].c = priceHistory[i - 1].c;
                            priceHistory[i].v = 0;
                        }
                    }
                }
            }
            
            if(priceHistory.length < countBack) {
                priceHistory = Array(countBack - priceHistory.length).fill().map((_, index) => {
                    const o = index + 1;
                    const firstElement = priceHistory[0];
            
                    return {
                        "o": firstElement["o"],
                        "h": firstElement["o"],
                        "l": firstElement["o"],
                        "c": firstElement["o"],
                        "v": 0,
                        "t": firstElement["t"] - (o * intervalInSeconds),
                    };
                }).concat(priceHistory);
            }

            if(priceHistory[priceHistory.length - 1]["t"] > to) {
                priceHistory[priceHistory.length - 1]["t"] = to;
            }

            return res.status(200).json({"status": "success", "marketId": marketId, "selection": selection,  "data": priceHistory});
        } catch(error) {
            console.log(error);
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/probability-history", async (req, res) => 
    {
        try {
            const to = req.body.to;
            const from = req.body.from;
            const countBack = req.body.countBack;
            const marketId = `${req.body.marketId}`;
            const resolution = parseResolution(req.body.resolution);
            
            if(isNaN(countBack) || !isFinite(countBack)) {return res.status(200).json({"status": "error"});}
            if(isNaN(to) || isNaN(from) || !isFinite(to) || !isFinite(from)) {return res.status(200).json({"status": "error"});}

            let intervalInSeconds = 0
            if(resolution === undefined || resolution === null) {
                return res.status(200).json({"status": "error"});
            } else if(Object.keys(resolution).length === 0) {
                return res.status(200).json({"status": "error"});
            } else {
                if(resolution.letterPart === '') {
                    intervalInSeconds = Number(resolution.numberPart) * 60;
                } else if(resolution.letterPart === 'S') {
                    intervalInSeconds = Number(resolution.numberPart);
                } else if(resolution.letterPart === 'D') {
                    intervalInSeconds = Number(resolution.numberPart) * 86400;
                } else if(resolution.letterPart === 'W') {
                    intervalInSeconds = Number(resolution.numberPart) * 604800;
                } else if(resolution.letterPart === 'M') {
                    intervalInSeconds = Number(resolution.numberPart) * 604800 * 4;
                } else if(resolution.letterPart === 'Y') {
                    intervalInSeconds = Number(resolution.numberPart) * 604800 * 52;
                } else {
                    return res.status(200).json({"status": "error"});
                }
            }
            if(intervalInSeconds === 0) {return res.status(200).json({"status": "error"});}
            
            let probabilityHistory = [], data = await activityDesc.find(
                {
                    marketId: marketId,
                    openedTimestamp: {$gte: from, $lte: to}
                }
            ).sort({openedTimestamp: 1}).select(`openedTimestamp costFunctionDesc prevCostFunctionDesc -_id`).exec();

            if(data.length === 0) { 
                data = await activityDesc.find(
                    {
                        marketId: marketId
                    }
                ).sort({openedTimestamp: -1}).limit(1).select(`openedTimestamp costFunctionDesc prevCostFunctionDesc -_id`).exec();
            }

            if(data.length === 0) {return res.status(200).json({"status": "error"});}

            const interval = Math.floor((to - from) / intervalInSeconds);
            probabilityHistory = new Array(interval).fill(null).map((_, index) => 
                {
                    const n = index + 1;
                    return {
                        "p_y": undefined,
                        "t": from + n * intervalInSeconds
                    }
                }
            );

            let m = 0;
            for(let i = 0; i < probabilityHistory.length; i++) {
                if(i === 0) {
                    if(data[0]["prevCostFunctionDesc"]["priceYes"] === 0 || data[0]["prevCostFunctionDesc"]["priceNo"] === 0) {
                        probabilityHistory[i].p_y = data[0]["costFunctionDesc"]["priceYes"] / (data[0]["costFunctionDesc"]["priceYes"] + data[0]["costFunctionDesc"]["priceNo"]);
                    } else {
                        probabilityHistory[i].p_y = data[0]["prevCostFunctionDesc"]["priceYes"] / (data[0]["prevCostFunctionDesc"]["priceYes"] + data[0]["prevCostFunctionDesc"]["priceNo"]);
                    }

                    if((m + 1) <= (data.length - 1)) {m++;}
                } else {
                    if(probabilityHistory[i].t < data[m]["openedTimestamp"]) {
                        if(m === 0) {
                            probabilityHistory[i].p_y = data[m]["costFunctionDesc"]["priceYes"] / (data[m]["costFunctionDesc"]["priceYes"] + data[m]["costFunctionDesc"]["priceNo"]);
                        } else {
                            probabilityHistory[i].p_y = data[m - 1]["costFunctionDesc"]["priceYes"] / (data[m - 1]["costFunctionDesc"]["priceYes"] + data[m - 1]["costFunctionDesc"]["priceNo"]);
                        }
                    } else {
                        probabilityHistory[i].p_y = data[m]["costFunctionDesc"]["priceYes"] / (data[m]["costFunctionDesc"]["priceYes"] + data[m]["costFunctionDesc"]["priceNo"]);
                        if((m+ 1) <= (data.length - 1)) {m++;}
                    }
                }
            }
            if(probabilityHistory.at(-1)["p_y"] !== (data.at(-1)["costFunctionDesc"]["priceYes"] / (data.at(-1)["costFunctionDesc"]["priceYes"] + data.at(-1)["costFunctionDesc"]["priceNo"]))) {
                probabilityHistory.push(
                    {
                        "p_y": data.at(-1)["costFunctionDesc"]["priceYes"] / (data.at(-1)["costFunctionDesc"]["priceYes"] + data.at(-1)["costFunctionDesc"]["priceNo"]),
                        "t": data.at(-1)["openedTimestamp"]
                    }
                );
            }

            if(probabilityHistory.length < countBack) {
                probabilityHistory = Array(countBack - probabilityHistory.length).fill().map((_, index) => {
                    const o = index + 1;
                    const firstElement = probabilityHistory[0];
            
                    return {
                        "p_y": firstElement["p_y"],
                        "t": firstElement["t"] - (o * intervalInSeconds)
                    };
                }).concat(probabilityHistory);
            }

            return res.status(200).json({"status": "success", "data": probabilityHistory});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/pull-activity", async (req, res) => 
    {
        try {
            const to = req.body.to;
            const from = req.body.from;
            const uniqueId = `${req.body.uniqueId}`;
            if(isNaN(to) || isNaN(from) || !isFinite(to) || !isFinite(from)) {return res.status(200).json({"status": "error"});}

            await activityDesc.find(
                {
                    username: uniqueId,
                    openedTimestamp: {$gte: from, $lte: to}
                }
            ).sort({openedTimestamp: -1}).then(
                (activityData) => {
                    if(!activityData) {
                        return res.status(200).json({"status": "success", "data": []});
                    }

                    if(activityData) {
                        return res.status(200).json({"status": "success", "data": activityData});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/pull-history", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const uniqueId = `${req.body.uniqueId}`;
            const ids_ninclude = req.body.ids_ninclude;

            if(!Array.isArray(ids_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const activityCount = await activityDesc.countDocuments({username: uniqueId});
                if(activityCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": activityCount});
                } else {
                    const activity = await activityDesc.find(
                        {
                            username: uniqueId
                        }
                    ).sort({openedTimestamp: -1}).limit(15);

                    return res.status(200).json({"status": "success", "data": activity, "dataCount": activityCount});
                }
            } else if(type === "secondary") {
                const activity = await activityDesc.find(
                    {
                        _id: {$nin: ids_ninclude},
                        username: uniqueId
                    }
                ).sort({openedTimestamp: -1}).limit(15);

                return res.status(200).json({"status": "success", "data": activity});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/prediction-engagements", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const predictionIds = req.body.predictionIds;
            if(!Array.isArray(predictionIds)) {return res.status(200).json({"status": "error"});}
            
            const predictionEngagements = await predictionLikeDislikeDescs.find(
                {
                    username: uniqueId,
                    predictionId: {$in: predictionIds},
                    status: "active"
                }
            ).select(`-_id predictionId type`).exec();

            return res.status(200).json({"status": "success", "data": predictionEngagements});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/prediction-engage", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const uniqueId = `${req.body.uniqueId}`;
            const predictionId = `${req.body.predictionId}`;

            const accountType = `${req.body.accountType}`;
            const profileImage = `${req.body.profileImage}`;

            if(!(type === "like" || type === "dislike")) {return res.status(200).json({"status": "error"});}
            if(!(accountType === "" || accountType === "validated")) {return res.status(200).json({"status": "error"});}

            const engPredData = await predictionsDesc.findById(predictionId);
            if(!engPredData) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            await predictionLikeDislikeDescs.findOne(
                {
                    username: uniqueId,
                    predictionId: predictionId
                }
            ).then(
                async (engagementData) => {
                    if(!engagementData) {
                        const newEngagement = new predictionLikeDislikeDescs(
                            {
                                username: uniqueId,
                                predictionId: predictionId,
                                type: type,
                                status: "active",
                                timeStamp: nowUnix
                            }
                        );
                        await newEngagement.save();

                        if(accountType === "validated"
                            && engPredData["username"] !== uniqueId
                        ) {
                            let predictionRewardAmount = 0;
                            const payoutAmountsDesc = await payoutAmountsTracker.find({}).sort({timeStamp: -1}).limit(1);
                            if(payoutAmountsDesc.length > 0) {
                                predictionRewardAmount = payoutAmountsDesc[0]["postLiked"];
                            }

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engPredData["likes"] + 1, engPredData["dislikes"]);
                                await predictionsDesc.updateOne(
                                    {_id: predictionId}, 
                                    {
                                        $inc: {
                                            likes: 1,
                                            userRewards: engPredData["groupId"] === "" ? predictionRewardAmount : (1 - 0.025) * predictionRewardAmount,
                                            communityRewards: engPredData["groupId"] === "" ? 0 : 0.025 * predictionRewardAmount
                                        }, 
                                        $set: {confidenceScore: calculatedCS}
                                    }
                                );
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engPredData["likes"], engPredData["dislikes"] + 1);
                                await predictionsDesc.updateOne(
                                    {_id: predictionId}, 
                                    {
                                        $inc: {
                                            dislikes: 1,
                                            userRewards: engPredData["groupId"] === "" ? predictionRewardAmount : (1 - 0.025) * predictionRewardAmount,
                                            communityRewards: engPredData["groupId"] === "" ? 0 : 0.025 * predictionRewardAmount
                                        }, 
                                        $set: {confidenceScore: calculatedCS}
                                    }
                                );
                            }

                            if(predictionRewardAmount > 0) {
                                const modRewardRec = await axios.post(`http://localhost:8900/api/users/modify-rewards_records`, 
                                    {
                                        "groupId": engPredData["groupId"],
                                        "groupIdAmt": engPredData["groupId"] === "" ? 0 : 0.025 * predictionRewardAmount,
                                        "username": engPredData["username"],
                                        "usernameAmt": engPredData["groupId"] === "" ? predictionRewardAmount : (1 - 0.025) * predictionRewardAmount,
                                        "secondaryUsername": "",
                                        "secondaryUsernameAmt": 0
                                    }
                                );
                            }
                        } else {
                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engPredData["likes"] + 1, engPredData["dislikes"]);
                                await predictionsDesc.updateOne({_id: predictionId}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engPredData["likes"], engPredData["dislikes"] + 1);
                                await predictionsDesc.updateOne({_id: predictionId}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                            }
                        }

                        if(type === "like" && engPredData["username"] !== uniqueId) {
                            await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                {
                                    "by": uniqueId,
                                    "link": `/market/prediction/${predictionId}`,
                                    "type": "engagement",
                                    "target": engPredData["username"],
                                    "message": `${uniqueId} liked your prediction`,
                                    "byProfileImage": profileImage,
                                    "secondaryMessage": engPredData["predictiveQuestion"]
                                }
                            );
                        }

                        return res.status(200).json({"status": "success"});
                    }

                    if(engagementData) {
                        const prevType = engagementData["type"];
                        const prevStatus = engagementData["status"];

                        if(type === prevType) {
                            if(prevStatus === "active") {
                                await predictionLikeDislikeDescs.updateOne(
                                    {username: uniqueId, predictionId: predictionId},
                                    {$set: {status: "inactive"}}
                                );

                                if(type === "like") {
                                    const calculatedCS = calcConfidenceScore(engPredData["likes"] - 1, engPredData["dislikes"]);
                                    await predictionsDesc.updateOne({_id: predictionId}, {$inc: {likes: -1}, $set: {confidenceScore: calculatedCS}});
                                } else if(type === "dislike") {
                                    const calculatedCS = calcConfidenceScore(engPredData["likes"], engPredData["dislikes"] - 1);
                                    await predictionsDesc.updateOne({_id: predictionId}, {$inc: {dislikes: -1}, $set: {confidenceScore: calculatedCS}});
                                }
                            } else {
                                await predictionLikeDislikeDescs.updateOne(
                                    {username: uniqueId, predictionId: predictionId},
                                    {$set: {status: "active"}}
                                );

                                if(type === "like") {
                                    const calculatedCS = calcConfidenceScore(engPredData["likes"] + 1, engPredData["dislikes"]);
                                    await predictionsDesc.updateOne({_id: predictionId}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                } else if(type === "dislike") {
                                    const calculatedCS = calcConfidenceScore(engPredData["likes"], engPredData["dislikes"] + 1);
                                    await predictionsDesc.updateOne({_id: predictionId}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                }
                            }
                        } else {
                            await predictionLikeDislikeDescs.updateOne(
                                {username: uniqueId, predictionId: predictionId},
                                {$set: {type: type, status: "active"}}
                            );

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engPredData["likes"] + 1, engPredData["dislikes"]);
                                await predictionsDesc.updateOne({_id: predictionId}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                if(prevStatus === "active") {
                                    const s_calculatedCS = calcConfidenceScore(engPredData["likes"] + 1, engPredData["dislikes"] - 1);
                                    await predictionsDesc.updateOne({_id: predictionId}, {$inc: {dislikes: -1}, $set: {confidenceScore: s_calculatedCS}});
                                }
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engPredData["likes"], engPredData["dislikes"] + 1);
                                await predictionsDesc.updateOne({_id: predictionId}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                if(prevStatus === "active") {
                                    const s_calculatedCS = calcConfidenceScore(engPredData["likes"] - 1, engPredData["dislikes"] + 1);
                                    await predictionsDesc.updateOne({_id: predictionId}, {$inc: {likes: -1}, $set: {confidenceScore: s_calculatedCS}});
                                }
                            }
                        }

                        return res.status(200).json({"status": "success"});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments", async (req, res) => 
    {
        try {
            const predType = `${req.body.predType}`;
            const commentCount = Number(req.body.comments);
            const predictionId = `${req.body.predictionId}`;
            if(isNaN(commentCount) & isFinite(commentCount)) {return res.status(200).json({"status": "error"});}
            if(!(predType === "y-n" || predType === "categorical")) {return res.status(200).json({"status": "error"});}

            if(commentCount <= 10) {
                const mainComments = await commentsMainDescs.find(
                    {
                        predictionId: predictionId,
                        predictionType: predType
                    }
                ).sort({verified: -1, confidenceScore: -1});

                const secondaryComments = await commentsSecondaryDescs.find(
                    {
                        predictionId: predictionId,
                        predictionType: predType
                    }
                ).sort({verified: -1, confidenceScore: -1});

                return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainComments.length});
            } else {
                const mainCommentsCount = await commentsMainDescs.countDocuments({predictionId: predictionId, predictionType: predType});

                if(mainCommentsCount <= 10) {
                    const mainComments = await commentsMainDescs.find(
                        {
                            predictionId: predictionId,
                            predictionType: predType
                        }
                    ).sort({verified: -1, confidenceScore: -1});

                    const secondaryComments = await commentsSecondaryDescs.find(
                        {
                            predictionId: predictionId,
                            predictionType: predType,
                            index: 1
                        }
                    ).sort({verified: -1, confidenceScore: -1}).limit(5);

                    return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainCommentsCount});
                } else {
                    const mainComments = await commentsMainDescs.find(
                        {
                            predictionId: predictionId,
                            predictionType: predType
                        }
                    ).sort({verified: -1, confidenceScore: -1}).limit(10);

                    let mainCommentIds = [];
                    for(let i = 0; i < mainComments.length; i++) {
                        mainCommentIds.push(String(mainComments[i]["_id"]));
                    }

                    const secondaryComments = await commentsSecondaryDescs.find(
                        {
                            mainCommentId: {$in: mainCommentIds},
                            index: 1
                        }
                    ).sort({verified: -1, confidenceScore: -1}).limit(5);

                    return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainCommentsCount});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-expand", async (req, res) => 
    {
        try {
            const predType = `${req.body.predType}`;
            const ni_commentIds = req.body.ni_commentIds;
            const predictionId = `${req.body.predictionId}`;
            if(!Array.isArray(ni_commentIds)) {return res.status(200).json({"status": "error"});}
            if(!(predType === "y-n" || predType === "categorical")) {return res.status(200).json({"status": "error"});}

            const mainComments = await commentsMainDescs.find(
                {
                    _id: {$nin: ni_commentIds},
                    predictionId: predictionId,
                    predictionType: predType
                }
            ).sort({verified: -1, confidenceScore: -1}).limit(25);

            let mainCommentIds = [];
            for(let i = 0; i < mainComments.length; i++) {
                mainCommentIds.push(String(mainComments[i]["_id"]));
            }

            const secondaryComments = await commentsSecondaryDescs.find(
                {
                    mainCommentId: {$in: mainCommentIds},
                    index: 1
                }
            ).sort({verified: -1, confidenceScore: -1}).limit(10);

            return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-specific-expand", async (req, res) => 
    {
        try {
            const commentId = `${req.body.commentId}`;
            const mainCommentId = `${req.body.mainCommentId}`;
            const commentIndex = Number(req.body.commentIndex);
            const commentIdsToExlude = req.body.commentIdsToExlude;
            if(!Array.isArray(commentIdsToExlude)) {return res.status(200).json({"status": "error"});}
            if(isNaN(commentIndex) || !(commentIndex === 0 || commentIndex === 1)) {return res.status(200).json({"status": "error"});}

            if(commentIndex === 0) {
                const data = await commentsSecondaryDescs.find(
                    {
                        _id: {$nin: commentIdsToExlude},
                        mainCommentId: mainCommentId,
                    }
                ).sort({verified: -1, confidenceScore: -1});

                return res.status(200).json({"status": "success", "data": data});
            } else {
                const dataOne = await commentsSecondaryDescs.find(
                    {
                        mainCommentId: mainCommentId,
                        index: 2,
                        commentId: commentId
                    }
                ).sort({verified: -1, confidenceScore: -1});

                let supportingCommentIds = [];
                for(let i = 0; i < dataOne.length; i++) {
                    supportingCommentIds.push(String(dataOne[i]["_id"]));
                }

                const dataTwo = await commentsSecondaryDescs.find(
                    {
                        mainCommentId: mainCommentId,
                        index: 3,
                        commentId: {$in: supportingCommentIds}
                    }
                ).sort({verified: -1, confidenceScore: -1});

                return res.status(200).json({"status": "success", "data": [...dataOne, ...dataTwo]});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-engagements", async (req, res) => 
    {
        try {
            const commentIds = req.body.commentIds;
            const uniqueId = `${req.body.uniqueId}`;
            if(!Array.isArray(commentIds)) {return res.status(200).json({"status": "error"});}
            
            const commentsEngagements = await commentsLikeDislikeDescs.find(
                {
                    username: uniqueId,
                    commentId: {$in: commentIds},
                    status: "active"
                }
            ).select(`-_id commentId type`).exec();

            return res.status(200).json({"status": "success", "data": commentsEngagements});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/comments-engage", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const uniqueId = `${req.body.uniqueId}`;
            const commentId = `${req.body.commentId}`;

            const accountType = `${req.body.accountType}`;
            const profileImage = `${req.body.profileImage}`;

            if(!(type === "like" || type === "dislike")) {return res.status(200).json({"status": "error"});}
            if(!(accountType === "" || accountType === "validated")) {return res.status(200).json({"status": "error"});}
            if(!(commentId.slice(0, 1) === "m" || commentId.slice(0, 1) === "s")) {return res.status(200).json({"status": "error"});}

            let engCommentData = null;
            if(commentId.slice(0, 1) === "m") {
                engCommentData = await commentsMainDescs.findById(commentId.slice(2, commentId.length));
            } else if(commentId.slice(0, 1) === "s") {
                engCommentData = await commentsSecondaryDescs.findById(commentId.slice(2, commentId.length));
            }
            if(!engCommentData) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            await commentsLikeDislikeDescs.findOne(
                {
                    username: uniqueId,
                    commentId: commentId
                }
            ).then(
                async (engagementData) => {
                    if(!engagementData) {
                        const newCommentEngagement = new commentsLikeDislikeDescs(
                            {
                                username: uniqueId,
                                commentId: commentId,
                                type: type,
                                status: "active",
                                timeStamp: nowUnix
                            }
                        );
                        await newCommentEngagement.save();

                        if(accountType === "validated"
                            && engCommentData["verified"] && engCommentData["username"] !== uniqueId
                        ) {
                            let commentRewardAmount = 0;
                            const payoutAmountsDesc = await payoutAmountsTracker.find({}).sort({timeStamp: -1}).limit(1);
                            if(payoutAmountsDesc.length > 0) {
                                commentRewardAmount = payoutAmountsDesc[0]["commentLiked"];
                            }

                            let predDecrease = 0;
                            let engPredData = await predictionsDesc.findById(engCommentData["predictionId"]);
                            if(engPredData) {
                                predDecrease = 0.025;
                                await predictionsDesc.updateOne(
                                    {_id: engCommentData["predictionId"]},
                                    {$inc: {userRewards: 0.025 * commentRewardAmount}}
                                );
                            }

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"] + 1, engCommentData["dislikes"]);
    
                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne(
                                        {_id: commentId.slice(2, commentId.length)}, 
                                        {
                                            $inc: {
                                                likes: 1,
                                                userRewards: engCommentData["groupId"] === "" ? (1 - predDecrease) * commentRewardAmount : (1 - predDecrease - 0.025) * commentRewardAmount,
                                                communityRewards: engCommentData["groupId"] === "" ? 0 : 0.025 * commentRewardAmount
                                            }, 
                                            $set: {confidenceScore: calculatedCS}
                                        }
                                    );
                                } else if(commentId.slice(0, 1) === "s") {
                                    await commentsSecondaryDescs.updateOne(
                                        {_id: commentId.slice(2, commentId.length)}, 
                                        {
                                            $inc: {
                                                likes: 1,
                                                userRewards: engCommentData["groupId"] === "" ? (1 - predDecrease) * commentRewardAmount : (1 - predDecrease - 0.025) * commentRewardAmount,
                                                communityRewards: engCommentData["groupId"] === "" ? 0 : 0.025 * commentRewardAmount
                                            }, 
                                            $set: {confidenceScore: calculatedCS}
                                        }
                                    );
                                }
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"], engCommentData["dislikes"] + 1);
    
                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne(
                                        {_id: commentId.slice(2, commentId.length)}, 
                                        {
                                            $inc: {
                                                dislikes: 1,
                                                userRewards: engCommentData["groupId"] === "" ? (1 - predDecrease) * commentRewardAmount : (1 - predDecrease - 0.025) * commentRewardAmount,
                                                communityRewards: engCommentData["groupId"] === "" ? 0 : 0.025 * commentRewardAmount
                                            }, 
                                            $set: {confidenceScore: calculatedCS}
                                        }
                                    );
                                } else if(commentId.slice(0, 1) === "s") {
                                    await commentsSecondaryDescs.updateOne(
                                        {_id: commentId.slice(2, commentId.length)}, 
                                        {
                                            $inc: {
                                                dislikes: 1,
                                                userRewards: engCommentData["groupId"] === "" ? (1 - predDecrease) * commentRewardAmount : (1 - predDecrease - 0.025) * commentRewardAmount,
                                                communityRewards: engCommentData["groupId"] === "" ? 0 : 0.025 * commentRewardAmount
                                            }, 
                                            $set: {confidenceScore: calculatedCS}
                                        }
                                    );
                                }
                            }

                            if(commentRewardAmount > 0) {
                                const modRewardRec = await axios.post(`http://localhost:8900/api/users/modify-rewards_records`, 
                                    {
                                        "groupId": engCommentData["groupId"],
                                        "groupIdAmt": engCommentData["groupId"] === "" ? 0 : 0.025 * commentRewardAmount,
                                        "username": engPredData ? engPredData["username"] : "",
                                        "usernameAmt": engPredData ? predDecrease * commentRewardAmount : 0,
                                        "secondaryUsername": engCommentData["username"],
                                        "secondaryUsernameAmt": engCommentData["groupId"] === "" ? (1 - predDecrease) * commentRewardAmount : (1 - predDecrease - 0.025) * commentRewardAmount
                                    }
                                );
                            }
                        } else {
                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"] + 1, engCommentData["dislikes"]);
    
                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                } else if(commentId.slice(0, 1) === "s") {
                                    await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                }
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"], engCommentData["dislikes"] + 1);
    
                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                } else if(commentId.slice(0, 1) === "s") {
                                    await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                }
                            }
                        }

                        if(type === "like" && engCommentData["username"] !== uniqueId) {
                            await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                {
                                    "by": uniqueId,
                                    "link": `/market/prediction/${engCommentData["predictionId"]}`,
                                    "type": "engagement",
                                    "target": engCommentData["username"],
                                    "message": `${uniqueId} liked your comment`,
                                    "byProfileImage": profileImage,
                                    "secondaryMessage": engCommentData["comment"]
                                }
                            );
                        }

                        return res.status(200).json({"status": "success"});
                    }

                    if(engagementData) {
                        const prevType = engagementData["type"];
                        const prevStatus = engagementData["status"];

                        if(type === prevType) {
                            if(prevStatus === "active") {
                                await commentsLikeDislikeDescs.updateOne(
                                    {username: uniqueId, commentId: commentId},
                                    {$set: {status: "inactive"}}
                                );

                                if(type === "like") {
                                    const calculatedCS = calcConfidenceScore(engCommentData["likes"] - 1, engCommentData["dislikes"]);

                                    if(commentId.slice(0, 1) === "m") {
                                        await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {likes: -1}, $set: {confidenceScore: calculatedCS}});
                                    } else if(commentId.slice(0, 1) === "s") {
                                        await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {likes: -1}, $set: {confidenceScore: calculatedCS}});
                                    }
                                } else if(type === "dislike") {
                                    const calculatedCS = calcConfidenceScore(engCommentData["likes"], engCommentData["dislikes"] - 1);

                                    if(commentId.slice(0, 1) === "m") {
                                        await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {dislikes: -1}, $set: {confidenceScore: calculatedCS}});
                                    } else if(commentId.slice(0, 1) === "s") {
                                        await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {dislikes: -1}, $set: {confidenceScore: calculatedCS}});
                                    }
                                }
                            } else {
                                await commentsLikeDislikeDescs.updateOne(
                                    {username: uniqueId, commentId: commentId},
                                    {$set: {status: "active"}}
                                );

                                if(type === "like") {
                                    const calculatedCS = calcConfidenceScore(engCommentData["likes"] + 1, engCommentData["dislikes"]);

                                    if(commentId.slice(0, 1) === "m") {
                                        await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                    } else if(commentId.slice(0, 1) === "s") {
                                        await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                    }
                                } else if(type === "dislike") {
                                    const calculatedCS = calcConfidenceScore(engCommentData["likes"], engCommentData["dislikes"] + 1);

                                    if(commentId.slice(0, 1) === "m") {
                                        await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                    } else if(commentId.slice(0, 1) === "s") {
                                        await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                    }
                                }
                            }
                        } else {
                            await commentsLikeDislikeDescs.updateOne(
                                {username: uniqueId, commentId: commentId},
                                {$set: {type: type, status: "active"}}
                            );

                            if(type === "like") {
                                let csDislike = 0, 
                                    incrementQuery = {likes: 1};
                                if(prevStatus === "active") {
                                    csDislike = -1;
                                    incrementQuery["dislikes"] = -1;
                                }
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"] + 1, engCommentData["dislikes"] + csDislike);

                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: incrementQuery, $set: {confidenceScore: calculatedCS}});
                                } else if(commentId.slice(0, 1) === "s") {
                                    await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: incrementQuery, $set: {confidenceScore: calculatedCS}});
                                }
                            } else if(type === "dislike") {
                                let csLike = 0, 
                                    incrementQuery = {dislikes: 1};
                                if(prevStatus === "active") {
                                    csLike = -1;
                                    incrementQuery["likes"] = -1;
                                }
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"] + csLike, engCommentData["dislikes"] + 1);

                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: incrementQuery, $set: {confidenceScore: calculatedCS}});
                                } else if(commentId.slice(0, 1) === "s") {
                                    await commentsSecondaryDescs.updateOne({_id: commentId.slice(2, commentId.length)}, {$inc: incrementQuery, $set: {confidenceScore: calculatedCS}});
                                }
                            }
                        }

                        return res.status(200).json({"status": "success"});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/create-main-comment", async (req, res) => 
    {
        try {
            const photos = req.body.photos;
            const videos = req.body.videos;
            const verified = req.body.verified;
            const monetized = req.body.monetized;
            const groupId = `${req.body.groupId}`;
            const comment = `${req.body.comment}`;
            const predType = `${req.body.predType}`;
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            const predictionId = `${req.body.predictionId}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}
            if(!(predType === "y-n" || predType === "categorical")) {return res.status(200).json({"status": "error"});}

            let engPredData = null;
            if(predType === "y-n") {
                engPredData = await predictionsDesc.findById(predictionId);
            } else if(predType === "categorical") {
                engPredData = await c_predictionsDesc.findById(predictionId);
            }
            if(!engPredData) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);

            const window = new JSDOM("").window;
            const DOMPurify = createDOMPurify(window);
            const sanitizedComment = DOMPurify.sanitize(comment);
            const newMainComment = new commentsMainDescs(
                {
                    username: uniqueId,
                    profileImage: profileImage,
                    groupId: groupId,
                    predictionId: predictionId,
                    predictionType: predType,
                    monetized: monetized,
                    verified: verified,
                    index: 0,
                    limit: 0,
                    comment: sanitizedComment,
                    photos: photos,
                    videos: videos,
                    language: "",
                    translation: "",
                    likes: 0,
                    dislikes: 0,
                    views: 0,
                    comments: 0,
                    reposts: 0,
                    shares: 0,
                    confidenceScore: 0,
                    userRewards: 0,
                    communityRewards: 0,
                    status: "active",
                    flair: [],
                    timeStamp: nowUnix
                }
            );
            await newMainComment.save();

            if(predType === "y-n") {
                await predictionsDesc.updateOne({_id: predictionId}, {$inc: {comments: 1}});
            } else if(predType === "categorical") {
                await c_predictionsDesc.updateOne({_id: predictionId}, {$inc: {comments: 1}});
            }

            if(engPredData["username"] !== uniqueId) {
                await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                    {
                        "by": uniqueId,
                        "link": `/market/prediction/${predictionId}`,
                        "type": "engagement",
                        "target": engPredData["username"],
                        "message": `${uniqueId} has commented on your prediction`,
                        "byProfileImage": profileImage,
                        "secondaryMessage": sanitizedComment
                    }
                );
            }
            
            return res.status(200).json({"status": "success", "data": newMainComment["_id"]});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/create-secondary-comment", async (req, res) => 
    {
        try {
            const index = req.body.index;
            const photos = req.body.photos;
            const videos = req.body.videos;
            const verified = req.body.verified;
            const monetized = req.body.monetized;
            const groupId = `${req.body.groupId}`;
            const comment = `${req.body.comment}`;
            const predType = `${req.body.predType}`;
            const uniqueId = `${req.body.uniqueId}`;
            const commentId = `${req.body.commentId}`;
            const profileImage = `${req.body.profileImage}`;
            const predictionId = `${req.body.predictionId}`;
            const mainCommentId = `${req.body.mainCommentId}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}
            if(!(index === 1 || index === 2 || index === 3))  {return res.status(200).json({"status": "error"});}
            if(!(predType === "y-n" || predType === "categorical")) {return res.status(200).json({"status": "error"});}

            let engPredData = null;
            if(predType === "y-n") {
                engPredData = await predictionsDesc.findById(predictionId);
            } else if(predType === "categorical") {
                engPredData = await c_predictionsDesc.findById(predictionId);
            }
            if(!engPredData) {return res.status(200).json({"status": "error"});}

            await commentsMainDescs.findById(mainCommentId).then(
                async (mainCommentData) => {
                    if(!mainCommentData) {return res.status(200).json({"status": "error"});}
                    if(mainCommentData) {
                        const now = new Date();
                        const nowUnix = datefns.getUnixTime(now);

                        let commentIdCheck = null;
                        index === 1 ? commentIdCheck = mainCommentData : commentIdCheck = await commentsSecondaryDescs.findById(commentId);
                        if(commentIdCheck) {
                            if(commentIdCheck["index"] !== index - 1) {return res.status(200).json({"status": "error"});}
                        } else {return res.status(200).json({"status": "error"});}

                        const window = new JSDOM("").window;
                        const DOMPurify = createDOMPurify(window);
                        const sanitizedComment = DOMPurify.sanitize(comment);
                        const newSecondaryComment = new commentsSecondaryDescs(
                            {
                                username: uniqueId,
                                profileImage: profileImage,
                                groupId: groupId,
                                predictionId: predictionId,
                                predictionType: predType,
                                monetized: monetized,
                                verified: verified,
                                index: index,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                mainCommentId: mainCommentId,
                                commentId: commentId,
                                language: "",
                                translation: "",
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                communityRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        );
                        await newSecondaryComment.save();

                        if(predType === "y-n") {
                            await predictionsDesc.updateOne({_id: predictionId}, {$inc: {comments: 1}});
                        } else if(predType === "categorical") {
                            await c_predictionsDesc.updateOne({_id: predictionId}, {$inc: {comments: 1}});
                        }
                        index === 1 ? await commentsMainDescs.updateOne({_id: mainCommentId}, {$inc: {comments: 1}}) : await commentsSecondaryDescs.updateOne({_id: commentId}, {$inc: {comments: 1}}); 

                        if(uniqueId !== engPredData["username"]) {
                            await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                {
                                    "by": uniqueId,
                                    "link": `/market/prediction/${predictionId}`,
                                    "type": "engagement",
                                    "target": engPredData["username"],
                                    "message": `${uniqueId} has commented on your prediction`,
                                    "byProfileImage": profileImage,
                                    "secondaryMessage": sanitizedComment
                                }
                            );
                        }

                        if(uniqueId !== commentIdCheck["username"]
                            && engPredData["username"] !== commentIdCheck["username"]
                        ) {
                            await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                {
                                    "by": uniqueId,
                                    "link": `/market/prediction/${predictionId}`,
                                    "type": "engagement",
                                    "target": commentIdCheck["username"],
                                    "message": `${uniqueId} has replied to your comment`,
                                    "byProfileImage": profileImage,
                                    "secondaryMessage": sanitizedComment
                                }
                            );
                        }

                        if(mainCommentData.limit >= 3) {
                            return res.status(200).json({"status": "success", "data": newSecondaryComment["_id"]});
                        } else {
                            if(mainCommentData.limit >= index) {
                                return res.status(200).json({"status": "success", "data": newSecondaryComment["_id"]});
                            } else {
                                await commentsMainDescs.updateOne({_id: mainCommentId}, {$set: {limit: index}});
                                return res.status(200).json({"status": "success", "data": newSecondaryComment["_id"]});
                            }
                        }
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/delete-comment", async (req, res) => 
    {
        try {
            const index = req.body.index;
            const uniqueId = `${req.body.uniqueId}`;
            const commentId = `${req.body.commentId}`;
            if(!(index === 0 || index === 1 || index === 2 || index === 3))  {return res.status(200).json({"status": "error"});}

            if(index === 0) {
                await commentsMainDescs.findById(commentId).then(
                    async (mainCommentData) => {
                        if(!mainCommentData) {return res.status(200).json({"status": "error"});}

                        if(mainCommentData) {
                            if(mainCommentData.status !== "active") {return res.status(200).json({"status": "error"});}
                            if(mainCommentData.username !== uniqueId) {return res.status(200).json({"status": "error"});}

                            const newDeletedMainComment = new commentsDeletedDesc(
                                {
                                    generalId: mainCommentData._id,
                                    username: mainCommentData.username,
                                    profileImage: mainCommentData.profileImage,
                                    groupId: mainCommentData.groupId,
                                    predictionId: mainCommentData.predictionId,
                                    predictionType: mainCommentData.predictionType,
                                    mainCommentId: "",
                                    commentId: "",
                                    monetized: mainCommentData.monetized,
                                    verified: mainCommentData.verified,
                                    index: 0,
                                    limit: mainCommentData.limit,
                                    comment: mainCommentData.comment,
                                    photos: mainCommentData.photos,
                                    videos: mainCommentData.videos,
                                    language: mainCommentData.language,
                                    translation: mainCommentData.translation,
                                    likes: mainCommentData.likes,
                                    dislikes: mainCommentData.dislikes,
                                    views: mainCommentData.views,
                                    comments: mainCommentData.comments,
                                    reposts: mainCommentData.reposts,
                                    shares: mainCommentData.shares,
                                    confidenceScore: mainCommentData.confidenceScore,
                                    userRewards: mainCommentData.userRewards,
                                    communityRewards: mainCommentData.communityRewards,
                                    status: mainCommentData.status,
                                    flair: mainCommentData.flair,
                                    timeStamp: mainCommentData.timeStamp
                                }
                            );
                            await newDeletedMainComment.save();

                            await commentsMainDescs.updateOne(
                                {_id: commentId},
                                {
                                    username: "[deleted]",
                                    profileImage: "",
                                    comment: "[removed]",
                                    photos: [],
                                    videos: [],
                                    status: "inactive"
                                }
                            );
                            return res.status(200).json({"status": "success"});
                        }
                    }
                );
            } else {
                await commentsSecondaryDescs.findById(commentId).then(
                    async (secondaryCommentData) => {
                        if(!secondaryCommentData) {return res.status(200).json({"status": "error"});}

                        if(secondaryCommentData) {
                            if(secondaryCommentData.status !== "active") {return res.status(200).json({"status": "error"});}
                            if(secondaryCommentData.username !== uniqueId) {return res.status(200).json({"status": "error"});}

                            const newDeletedSecondaryComment = new commentsDeletedDesc(
                                {
                                    generalId: secondaryCommentData._id,
                                    username: secondaryCommentData.username,
                                    profileImage: secondaryCommentData.profileImage,
                                    groupId: secondaryCommentData.groupId,
                                    predictionId: secondaryCommentData.predictionId,
                                    predictionType: secondaryCommentData.predictionType,
                                    mainCommentId: secondaryCommentData.mainCommentId,
                                    commentId: secondaryCommentData.commentId,
                                    monetized: secondaryCommentData.monetized,
                                    verified: secondaryCommentData.verified,
                                    index: secondaryCommentData.index,
                                    limit: -1,
                                    comment: secondaryCommentData.comment,
                                    photos: secondaryCommentData.photos,
                                    videos: secondaryCommentData.videos,
                                    language: secondaryCommentData.language,
                                    translation: secondaryCommentData.translation,
                                    likes: secondaryCommentData.likes,
                                    dislikes: secondaryCommentData.dislikes,
                                    views: secondaryCommentData.views,
                                    comments: secondaryCommentData.comments,
                                    reposts: secondaryCommentData.reposts,
                                    shares: secondaryCommentData.shares,
                                    confidenceScore: secondaryCommentData.confidenceScore,
                                    userRewards: secondaryCommentData.userRewards,
                                    communityRewards: secondaryCommentData.communityRewards,
                                    status: secondaryCommentData.status,
                                    flair: secondaryCommentData.flair,
                                    timeStamp: secondaryCommentData.timeStamp
                                }
                            );
                            await newDeletedSecondaryComment.save();

                            await commentsSecondaryDescs.updateOne(
                                {_id: commentId},
                                {
                                    username: "[deleted]",
                                    profileImage: "",
                                    comment: "[removed]",
                                    photos: [],
                                    videos: [],
                                    status: "inactive"
                                }
                            );

                            return res.status(200).json({"status": "success"});
                        }
                    }
                );
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/market-desc", async (req, res) => 
    {
        try {
            const marketId = `${req.body.marketId}`;

            await marketDesc.findOne(
                {
                   _id: marketId 
                }
            ).then(
                async (marketData) => {
                    if(!marketData) { return res.status(200).json({"status": "error"}); }
                    if(marketData) {
                        const now = new Date();
                        const nowUnix = datefns.getUnixTime(now);

                        let quoteData = await activityDesc.find(
                            {
                                marketId: marketId,
                                openedTimestamp: {$gte: (nowUnix - 86400)}
                            }
                        ).sort({openedTimestamp: 1}).select(`openedTimestamp costFunctionDesc prevCostFunctionDesc -_id`).exec();

                        if(quoteData.length === 0) {
                            quoteData = await activityDesc.find(
                                {
                                    marketId: marketId
                                }
                            ).sort({openedTimestamp: -1}).limit(1).select(`openedTimestamp costFunctionDesc prevCostFunctionDesc -_id`).exec();
                        }

                        let priceYesHist = [], priceNoHist = [];
                        for(let i = 0; i < quoteData.length; i++) {
                            if(i === 0) {
                                if(quoteData[i]["openedTimestamp"] >= (nowUnix - 86400)) {
                                    priceYesHist.push(
                                        quoteData[0]["prevCostFunctionDesc"]["priceYes"]
                                    );
                                    priceNoHist.push(
                                        quoteData[0]["prevCostFunctionDesc"]["priceNo"]
                                    );
                                }  
                            }

                            priceYesHist.push(
                                quoteData[0]["costFunctionDesc"]["priceYes"]
                            );
                            priceNoHist.push(
                                quoteData[0]["costFunctionDesc"]["priceNo"]
                            );
                        }

                        const groupIdCall = await predictionsDesc.findOne({_id: marketData.predictionId});
                        return res.status(200).json(
                            {
                                "status": "success", 
                                "data": {
                                    "symbol": marketData._id,
                                    "groupId": groupIdCall["groupId"],
                                    "comments": groupIdCall["comments"],
                                    "predictionId": marketData.predictionId,
                                    "predictiveImage": marketData.predictiveImage,
                                    "predictiveQuestion": marketData.predictiveQuestion,
                                    "outcome": marketData.outcome,
                                    "outcomeImage": marketData.outcomeImage,
                                    "continous": marketData.continous,
                                    "participantsTotal": marketData.participantsTotal,
                                    "participantsYes": marketData.participantsYes,
                                    "participantsNo": marketData.participantsNo,
                                    "quantityYes": marketData.quantityYes,
                                    "quantityNo": marketData.quantityNo,
                                    "priceYes": marketData.priceYes,
                                    "priceNo": marketData.priceNo,
                                    "probabilityYes": marketData.probabilityYes,
                                    "probabilityNo": marketData.probabilityNo,
                                    "costFunction": marketData.costFunction,
                                    "rules": marketData.rules,
                                    "status": marketData.status,
                                    "resolved": marketData.resolved,
                                    "resolutionOutcome": marketData.resolutionOutcome,
                                    "createdTimestamp": marketData.createdTimestamp,
                                    "endDate": marketData.endDate
                                },
                                "quote": {
                                    "yes": {
                                        "open": priceYesHist[0],
                                        "low": Math.min(priceYesHist),
                                        "high": Math.max(priceYesHist),
                                        "close": marketData.priceYes
                                    }, 
                                    "no": {
                                        "open": priceNoHist[0],
                                        "low": Math.min(priceNoHist),
                                        "high": Math.max(priceNoHist),
                                        "close": marketData.priceNo
                                    }
                                }
                            }
                        );
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/search-markets/", async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;
            const result = await axios.put(`http://localhost:8802/api/marketDataFeed/search?q=${q}`);

            if(result.data["status"] === "success") {
                if(result.data["data"].length > 0) {
                    let predictionIds = [];
                    for(let i = 0; i < result.data["data"].length; i++) {
                        predictionIds.push(result.data["data"][i]["_id"]);
                    }

                    const markets_inPrediction = await marketDesc.find(
                        {
                            predictionId: {$in: predictionIds}
                        }
                    );

                    let data = [];
                    for(let j = 0; j < markets_inPrediction.length; j++) {
                        let logo_url = "";
                        if(markets_inPrediction[j]["outcomeImage"] === "") {
                            logo_url = await imgToBase64(markets_inPrediction[j]["predictiveImage"]);
                        } else {
                            logo_url = await imgToBase64(markets_inPrediction[j]["outcomeImage"]);
                        }
                         
                        data = data.concat(
                            [
                                {
                                    "ticker": `${markets_inPrediction[j]["_id"]}-YES`,
                                    "symbol": markets_inPrediction[j]["outcome"] === "" ? `YES` : `${markets_inPrediction[j]["outcome"]}-YES`,
                                    "name": markets_inPrediction[j]["outcome"] === "" ? `YES` : `${markets_inPrediction[j]["outcome"]}-YES`,
                                    "description": markets_inPrediction[j]["predictiveQuestion"],
                                    "logo_urls": [logo_url],
                                    "exchange": "FINULAB"
                                },
                                {
                                    "ticker": `${markets_inPrediction[j]["_id"]}-NO`,
                                    "symbol": markets_inPrediction[j]["outcome"] === "" ? `NO` : `${markets_inPrediction[j]["outcome"]}-NO`,
                                    "name": markets_inPrediction[j]["outcome"] === "" ? `NO` : `${markets_inPrediction[j]["outcome"]}-NO`,
                                    "description": markets_inPrediction[j]["predictiveQuestion"],
                                    "logo_urls": [logo_url],
                                    "exchange": "FINULAB"
                                }
                            ]
                        );
                    }

                    return res.status(200).json({"status": "success", "data": data});
                } else {
                    return res.status(200).json({"status": "success", "data": []});
                }
            } else {
                return res.status(200).json({"status": "success", "data": []});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/resolve-market-selection", async (req, res) => 
    {
        try {
            const market_selection = `${req.body.market_selection}`;
            const parsed_market_selection = market_selection.split("-");

            await marketDesc.findOne(
                {
                    _id: parsed_market_selection[0]
                }
            ).then(
                async (marketData) => {
                    if(!marketData) { return res.status(200).json({"status": "error"}); }

                    if(marketData) {
                        let logo_url = "";
                        if(marketData["outcomeImage"] === "") {
                            logo_url = await imgToBase64(marketData["predictiveImage"]);
                        } else {
                            logo_url = await imgToBase64(marketData["outcomeImage"]);
                        }

                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": {
                                    "symbol": market_selection,
                                    "name": marketData["outcome"] === "" ? `${parsed_market_selection[1]}` : `${marketData["outcome"]}-${parsed_market_selection[1]}`,
                                    "description": marketData["predictiveQuestion"],
                                    "logo_urls": [logo_url],
                                    "exchange": "FINULAB"
                                }
                            }
                        );
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/market-activity-history", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const marketId = `${req.body.marketId}`;
            const selection = `${req.body.selection}`;
            const ids_ninclude = req.body.ids_ninclude;

            if(!Array.isArray(ids_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const activityCount = await activityDesc.countDocuments({marketId: marketId, selection: selection});
                if(activityCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": activityCount, "uniqueUsernames": []});
                } else {
                    const activity = await activityDesc.find(
                        {
                            marketId: marketId,
                            selection: selection
                        }
                    ).sort({openedTimestamp: -1}).limit(15).select(`_id username action quantity averagePrice openedTimestamp`).exec();

                    let uniqueUsernames = [];
                    for(let i = 0; i < activity.length; i++) {
                        if(!uniqueUsernames.includes(activity[i]["username"])) {
                            uniqueUsernames.push(activity[i]["username"]);
                        }
                    }

                    return res.status(200).json({"status": "success", "data": activity, "dataCount": activityCount, "uniqueUsernames": uniqueUsernames});
                }
            } else if(type === "secondary") {
                const activity = await activityDesc.find(
                    {
                        _id: {$nin: ids_ninclude},
                        marketId: marketId,
                        selection: selection
                    }
                ).sort({openedTimestamp: -1}).limit(15).select(`_id username action quantity averagePrice openedTimestamp`).exec();;

                let uniqueUsernames = [];
                for(let i = 0; i < activity.length; i++) {
                    if(!uniqueUsernames.includes(activity[i]["username"])) {
                        uniqueUsernames.push(activity[i]["username"]);
                    }
                }

                return res.status(200).json({"status": "success", "data": activity, "uniqueUsernames": uniqueUsernames});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/market-top-holders", async (req, res) => 
    {
        try {
            const marketId = `${req.body.marketId}`;

            const topYesHolders = await holdingsDesc.find(
                {
                    marketId: marketId,
                }
            ).sort({yesQuantity: -1}).limit(10).select(`-_id username yesQuantity`).exec();
            
            const topNoHolders = await holdingsDesc.find(
                {
                    marketId: marketId,
                }
            ).sort({noQuantity: -1}).limit(10).select(`-_id username noQuantity`).exec();

            let uniqueUsernames = [];
            for(let i = 0; i < topYesHolders.length; i++) {
                if(!uniqueUsernames.includes(topYesHolders[i]["username"])) {
                    uniqueUsernames.push(topYesHolders[i]["username"]);
                }
            }
            for(let j = 0; j < topNoHolders.length; j++) {
                if(!uniqueUsernames.includes(topNoHolders[j]["username"])) {
                    uniqueUsernames.push(topNoHolders[j]["username"]);
                }
            }

            return res.status(200).json({"status": "success", "data": {"yes": topYesHolders, "no": topNoHolders}, "uniqueUsernames": uniqueUsernames});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/create-prediction", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            const walletAddress = `${req.body.walletAddress}`;

            const endDate = req.body.endDate;
            const markets = req.body.markets;
            const category = req.body.category;
            const groupId = `${req.body.groupId}`;
            const chainId = `${req.body.chainId}`;
            const outcomes = req.body.outcomes;
            const topOutcomes = req.body.topOutcomes;
            const costToCreate = req.body.costToCreate;
            const outcomeType = `${req.body.outcomeType}`;
            const predictiveImage = `${req.body.predictiveImage}`;
            const groupProfileImage = `${req.body.groupProfileImage}`;
            const predictiveQuestion = `${req.body.predictiveQuestion}`;
            const officialValidationSource = `${req.body.officialValidationSource}`;

            if(!chainIds.includes(chainId)) {return res.status(200).json({"status": "error"});}

            if(!Array.isArray(markets)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(category)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(outcomes)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(topOutcomes)) {return res.status(200).json({"status": "error"});}

            if(isNaN(endDate) || !isFinite(endDate)) {return res.status(200).json({"status": "error"});}
            if(isNaN(costToCreate) || !isFinite(costToCreate)) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            if(endDate - nowUnix < 259200) {return res.status(200).json({"status": "error"});}

            const availableBalance = Number(req.body.availableBalance);
            if(isNaN(availableBalance) || !isFinite(availableBalance)) {return res.status(200).json({"status": "error"});}
            if(costToCreate > availableBalance) {return res.status(200).json({"status": "error"});}

            let reqKeys = [];
            let predSubjects = [];
            let creationVolume = 0, creationLiquidity = 0;
            for(let i = 0; i < markets.length; i++) {
                reqKeys.push("");
                if(markets[i]["outcome"] !== "") {
                    predSubjects.push(`${markets[i]["outcome"]}`.toLowerCase());
                }

                creationLiquidity = creationLiquidity + markets[i]["costFunction"];
                creationVolume = creationVolume + markets[i]["quantityYes"] + markets[i]["quantityNo"];
            }

            const nlpPredSubjects = extractSubjects(predictiveQuestion);
            if(predSubjects.length === 0) {
                predSubjects = nlpPredSubjects;
            } else {
                for(let nlp_p = 0; nlp_p < nlpPredSubjects.length; nlp_p++) {
                    if(predSubjects.includes(nlpPredSubjects[nlp_p])) continue;

                    const similaritiesIndex = predSubjects.map(sub => stringSimilarity(nlpPredSubjects[nlp_p], sub));
                    if(Math.max(similaritiesIndex) >= 90) continue;

                    predSubjects.push(nlpPredSubjects[nlp_p]);
                }
            }

            const newPrediction = new predictionsDesc(
                {
                    username: uniqueId, 
                    profileImage: profileImage, 
                    creatorWalletAddress: walletAddress,
                    groupId: groupId,
                    groupProfileImage: groupProfileImage,
                    category: category[0],
                    categoryImage: category[1],
                    continous: false,
                    endDate: endDate + 86400 - 1,
                    predictiveImage: predictiveImage,
                    predictiveQuestion: predictiveQuestion,
                    language: "",
                    translation: "",
                    subjects: predSubjects,
                    taggedAssets: [],
                    outcomeType: outcomeType,
                    outcomes: outcomes,
                    topOutcomes: topOutcomes,
                    resolutionOutcome: [],
                    officialValidationSource: officialValidationSource,
                    participants: 1,
                    volume: creationVolume,
                    liquidity: creationLiquidity,
                    status: "in-review",
                    finulabDecision: "pending",
                    denialReason: "",
                    likes: 0,
                    validatedLikes: 0,
                    dislikes: 0, 
                    validatedDislikes: 0,
                    validatedViews: 0,
                    comments: 0,
                    reposts: 0,
                    trendingScore: 0,
                    confidenceScore: 0, 
                    earned: 0,
                    finulabTake: 0,
                    feesCollected: 0,
                    userRewards: 0,
                    communityRewards: 0,
                    creationChain: chainId,
                    costToCreate: costToCreate,
                    pendedBalance: costToCreate,
                    requestKeys: reqKeys,
                    createdTimestamp: nowUnix,
                    decisionTimestamp: 0
                }
            );
            await newPrediction.save();

            const predictionId = newPrediction._id
            for(let j = 0; j < markets.length; j++) {
                const newMarketStock = new marketDesc(
                    {
                        predictionId: predictionId,
                        predictiveImage: predictiveImage,
                        predictiveQuestion: predictiveQuestion,
                        creator: uniqueId,
                        creatorAccountType: "verified",
                        creatorWalletAddress: walletAddress,
                        outcome: markets[j]["outcome"], 
                        outcomeImage: markets[j]["outcomeImage"],
                        continous: false,
                        chains: [chainId],
                        participantsTotal: 1,
                        participantsYes: markets[j]["participantsYes"],
                        participantsNo: markets[j]["participantsNo"],
                        quantityYes: markets[j]["quantityYes"],
                        quantityNo: markets[j]["quantityNo"],
                        priceYes: markets[j]["priceYes"],
                        priceNo: markets[j]["priceNo"],
                        probabilityYes: markets[j]["probabilityYes"],
                        probabilityNo: markets[j]["probabilityNo"],
                        costFunction: markets[j]["costFunction"],
                        costFunctionDesc: {},
                        rules: markets[j]["rules"],
                        status: "in-review",
                        resolved: false,
                        resolutionOutcome: "",
                        createdTimestamp: nowUnix,
                        requestKey: "",
                        endDate: endDate + 86400 - 1,
                        resolutionTimeStamp: 0
                    }
                );
                await newMarketStock.save();
            }

            return res.status(200).json({"status": "success", "predictionId": predictionId});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/prediction-decision", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const decision = `${req.body.decision}`;
            const predictionId = `${req.body.predictionId}`;

            if(!authorizedReviewers.includes(uniqueId)) {return res.status(200).json({"status": "error"});}
            if(!(decision === "approved" || decision === "denied")) {return res.status(200).json({"status": "error"});}

            if(decision === "approved") {
                await marketDesc.find(
                    {
                        predictionId: predictionId
                    }
                ).then(
                    async (marketData) => {
                        if(!marketData) {return res.status(200).json({"status": "error"});}

                        if(marketData) {
                            const didFinulabMakeDecision = await predictionsDesc.findById(predictionId);
                            if(!didFinulabMakeDecision) {return res.status(200).json({"status": "error"});}
                            if(didFinulabMakeDecision["finulabDecision"] !== "pending") {return res.status(200).json({"status": "error"});}

                            await predictionsDesc.updateOne(
                                {_id: predictionId}, 
                                {$set: {finulabDecision: "pending-approval"}}
                            );

                            for(let i = 0; i < marketData.length; i++) {
                                const newPredictionsApproved = new predictionsApprovedDesc(
                                    {
                                        predictionId: predictionId,
                                        marketId: `${marketData[i]["_id"]}`,
                                        creator: marketData[i]["creator"],
                                        creatorWalletAddress: marketData[i]["creatorWalletAddress"],
                                        chainId: marketData[i]["chains"][0],
                                        sent: false,
                                        validated: false,
                                        requestKey: "",
                                        sentTimestamp: 0,
                                        validatedTimestamp: 0,
                                        validationAttempts: 0
                                    }
                                );
                                await newPredictionsApproved.save();
                            }
                            
                            return res.status(200).json({"status": "success"});
                        }
                    }
                );
            } else if(decision === "denied") {
                await predictionsDesc.updateOne(
                    {_id: predictionId}, 
                    {$set: {status: "denied", finulabDecision: "denied", pendedBalance: 0}}
                );
                await marketDesc.updateMany(
                    {predictionId: predictionId}, 
                    {$set: {status: "denied"}}
                );

                return res.status(200).json({"status": "success"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/tx-finalize", async (req, res) => 
    {
        try {
            const fee = Number(req.body.fee);
            const total = Number(req.body.total);
            const quantity = Number(req.body.quantity);
            const averagePrice = Number(req.body.averagePrice);

            const action = `${req.body.action}`;
            const marketId = `${req.body.marketId}`;
            const selection = `${req.body.selection}`;
            const predictionId = `${req.body.predictionId}`;
            
            const chainId = `${req.body.chainId}`;
            const uniqueId = `${req.body.uniqueId}`;
            const walletAddress = `${req.body.walletAddress}`;
            const availableBalance = Number(req.body.availableBalance);
            
            if(isNaN(fee) || !isFinite(fee)) {return res.status(200).json({"status": "error"});}
            if(isNaN(total) || !isFinite(total)) {return res.status(200).json({"status": "error"});}
            if(isNaN(quantity) || !isFinite(quantity)) {return res.status(200).json({"status": "error"});}
            if(isNaN(averagePrice) || !isFinite(averagePrice)) {return res.status(200).json({"status": "error"});}
            if(isNaN(availableBalance) || !isFinite(availableBalance)) {return res.status(200).json({"status": "error"});}

            if(!chainIds.includes(chainId)) {return res.status(200).json({"status": "error"});}
            if(!(action === "buy" || action === "sell")) {return res.status(200).json({"status": "error"});}
            if(!(selection === "yes" || selection === "no")) {return res.status(200).json({"status": "error"});}

            if(fee < 0) {return res.status(200).json({"status": "error"});}
            if(total <= 0) {return res.status(200).json({"status": "error"});}
            if(quantity <= 0) {return res.status(200).json({"status": "error"});}
            if(averagePrice <= 0) {return res.status(200).json({"status": "error"});}
            if(Math.abs(total - ((averagePrice * quantity) + fee)) > 0.0001) {return res.status(200).json({"status": "error"});}

            await marketDesc.findById(marketId).then(
                async (marketData) => {
                    if(!marketData) {return res.status(200).json({"status": "error"});}

                    if(marketData) {
                        const now = new Date();
                        const nowUnix = datefns.getUnixTime(now);
                        let bq = 0, sectionOne = 0, quantity_yes = marketData.quantityYes, quantity_no = marketData.quantityNo;

                        if(selection === "yes") {
                            if(action === "buy") {
                                quantity_yes = quantity_yes + quantity;
                            } else if(action === "sell") {
                                quantity_yes = quantity_yes - quantity;
                            }
                        } else if(selection === "no") {
                            if(action === "buy") {
                                quantity_no = quantity_no + quantity;
                            } else if(action === "sell") {
                                quantity_no = quantity_no - quantity;
                            }
                        }

                        if(quantity_no < 1) {return res.status(200).json({"status": "error"});}
                        if(quantity_yes < 1) {return res.status(200).json({"status": "error"});}

                        const marketConfig = await configDesc.findOne({});
                        if(!marketConfig) {
                            return res.status(200).json({"status": "error"});
                        } else {
                            if(marketConfig === null) {return res.status(200).json({"status": "error"});}
                            if(Object.keys(marketConfig).length === 0) {return res.status(200).json({"status": "error"});}
                        }

                        bq = marketConfig["alpha"] * (quantity_yes + quantity_no);
                        sectionOne = Math.log(Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq));
                        const costFunctionCalc = bq * sectionOne;

                        if(isNaN(costFunctionCalc) || !isFinite(costFunctionCalc)) {return res.status(200).json({"status": "error"});}
                        if(costFunctionCalc < 0) {return res.status(200).json({"status": "error"});}

                        let fee_keys = [];
                        let fee_supportKeys = Object.keys(marketConfig["fee"]);
                        for(let i = 0; i < fee_supportKeys.length; i++) {
                            const fee_value = Number(fee_supportKeys[i]);
                            
                            if(isNaN(fee_value)) {
                                continue;
                            } else {
                                fee_keys.push(fee_value);
                            }
                        }

                        let util_fee = 0, lstGt_val = leastGreaterThanTarget(fee_keys, quantity);
                        if(lstGt_val === null) {
                            util_fee = marketConfig["fee"][`${fee_keys.at(-1)}+`];
                        } else {
                            util_fee = marketConfig["fee"][`${lstGt_val}`];
                        }

                        let pricePaid = 0;
                        let incCostFunct = costFunctionCalc - marketData.costFunction;
                        if(action === "buy") {
                            pricePaid = incCostFunct * (1 + (util_fee / 100));
                        } else if(action === "sell") {
                            pricePaid = -incCostFunct;
                        }
                        
                        if(pricePaid <= 0) {return res.status(200).json({"status": "error"});}
                        if(action === "buy") {
                            if(pricePaid > availableBalance) {return res.status(200).json({"status": "error"});}
                        }
                        if(Math.abs((total - pricePaid) / pricePaid) > 0.0001) {return res.status(200).json({"status": "error"});}
                        
                        let positiveNum_yes = 0, positiveNum_no = 0, negativeNum = 0, denominator = 0;
                        positiveNum_yes = (quantity_yes * Math.exp(quantity_yes / bq)) + (quantity_no * Math.exp(quantity_yes / bq));
                        positiveNum_no = (quantity_yes * Math.exp(quantity_no / bq)) + (quantity_no * Math.exp(quantity_no / bq));
                        negativeNum = (quantity_yes * Math.exp(quantity_yes / bq)) + (quantity_no * Math.exp(quantity_no / bq));
                        denominator = (quantity_yes * (Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq))) + (quantity_no * (Math.exp(quantity_yes / bq) + Math.exp(quantity_no / bq)));

                        const priceYes = (marketConfig["alpha"] * sectionOne) + ((positiveNum_yes - negativeNum) / denominator);
                        const priceNo = (marketConfig["alpha"] * sectionOne) + ((positiveNum_no - negativeNum) / denominator);
                        const probabilityYes = priceYes / (priceYes + priceNo);
                        const probabilityNo = priceNo / (priceYes + priceNo);

                        if(isNaN(priceYes) || isNaN(priceNo) || isNaN(probabilityYes) || isNaN(probabilityNo)) {return res.status(200).json({"status": "error"});}
                        if(!isFinite(priceYes) || !isFinite(priceNo) || !isFinite(probabilityYes) || !isFinite(probabilityNo)) {return res.status(200).json({"status": "error"});}

                        let modifiedTopOutcomes = []
                        const predictionDataForTopOutcomes = await predictionsDesc.findById(predictionId);
                        if(!predictionDataForTopOutcomes) {
                            return res.status(200).json({"status": "error"});
                        } else {
                            if(predictionDataForTopOutcomes === null) {return res.status(200).json({"status": "error"});}
                            if(Object.keys(predictionDataForTopOutcomes).length === 0) {return res.status(200).json({"status": "error"});}
                        }

                        if(predictionDataForTopOutcomes.outcomeType === "categorical") {
                            if(predictionDataForTopOutcomes.outcomes.length === 1) {
                                modifiedTopOutcomes = [[marketData.outcome, marketData.outcomeImage, priceYes, probabilityYes]];
                            } else {
                                let modifiedTopOutcomesInterlude = [...predictionDataForTopOutcomes.topOutcomes];
                                let modifyOutcomeIndex = modifiedTopOutcomesInterlude.findIndex(innerArray => innerArray[0] === marketData.outcome);

                                if(modifyOutcomeIndex === -1) {
                                    if(probabilityYes > modifiedTopOutcomesInterlude[0][3]) {
                                        modifiedTopOutcomesInterlude[1] = modifiedTopOutcomesInterlude[0];
                                        modifiedTopOutcomesInterlude[0] = [marketData.outcome, marketData.outcomeImage, priceYes, probabilityYes];
                                    } else if(probabilityYes > modifiedTopOutcomesInterlude[1][3]) {
                                        modifiedTopOutcomesInterlude[1] = [marketData.outcome, marketData.outcomeImage, priceYes, probabilityYes];
                                    }
                                } else {
                                    modifiedTopOutcomesInterlude[modifyOutcomeIndex] = [marketData.outcome, marketData.outcomeImage, priceYes, probabilityYes];
                                }
                                
                                modifiedTopOutcomes = modifiedTopOutcomesInterlude.sort((a, b) => b[3] - a[3]);
                            }
                        } else if(predictionDataForTopOutcomes.outcomeType === "yes-or-no") {
                            probabilityYes >= probabilityNo ? 
                            modifiedTopOutcomes = [
                                ["yes", priceYes, probabilityYes], 
                                ["no", priceNo, probabilityNo]
                            ] : 
                            modifiedTopOutcomes = [
                                ["no", priceNo, probabilityNo],
                                ["yes", priceYes, probabilityYes]
                            ];
                        }

                        const earnedFee = marketData.creatorAccountType === "verified" && marketData.creatorWalletAddress !== walletAddress ? marketConfig["creatorStake"] * fee : 0;
                        const finulabTakeFee = marketData.creatorAccountType === "verified" && marketData.creatorWalletAddress !== walletAddress ? (1 - marketConfig["creatorStake"]) * fee : fee;

                        await holdingsDesc.findOne(
                            {
                                username: uniqueId,
                                predictionId: predictionId,
                                marketId: marketId
                            }
                        ).then(
                            async (holdingsData) => {
                                if(!holdingsData) {
                                    if(action === "sell") {return res.status(200).json({"status": "error"});}

                                    const newHoldings = new holdingsDesc(
                                        {
                                            predictionId: predictionId,
                                            predictiveImage: marketData.predictiveImage,
                                            predictiveQuestion: marketData.predictiveQuestion,
                                            marketId: marketId,
                                            continous: marketData.continous,
                                            username: uniqueId,
                                            walletAddress: walletAddress,
                                            outcome: marketData.outcome,
                                            outcomeImage: marketData.outcomeImage,
                                    
                                            yesQuantity: selection === "yes" ? quantity : 0,
                                            yesAveragePrice: selection === "yes" ? averagePrice : 0,
                                            yesQuantityDesc: selection === "yes" ? [[chainId, quantity]] : [],
                                            noQuantity: selection === "no" ? quantity : 0,
                                            noAveragePrice: selection === "no" ? averagePrice : 0,
                                            noQuantityDesc: selection === "no" ? [[chainId, quantity]] : [],
                                            boughtTimestamp: nowUnix,
                                    
                                            soldYesQuantity: 0,
                                            soldYesCollateral: 0,
                                            soldYesAveragePrice: 0,
                                            soldYesQuantityDesc: [],
                                            soldYesCollateralDesc: [],
                                            soldNoQuantity: 0,
                                            soldNoCollateral: 0,
                                            soldNoAveragePrice: 0,
                                            soldNoQuantityDesc: [],
                                            soldNoCollateralDesc: [],
                                            soldTimestamp: 0,
                                            
                                            resolutionOutcome: "",
                                            resolutionRequestKeys: [],
                                            earnings: 0,
                                            predictionEndTimestamp: marketData.endDate,
                                            resolvedTimestamp: 0
                                        }
                                    );
                                    await newHoldings.save();

                                    let marketChains = marketData.chains;
                                    if(!marketChains.includes(chainId)) {marketChains.push(chainId);}

                                    await predictionsDesc.updateOne(
                                        {_id: predictionId},
                                        {
                                            $inc: {
                                                participants: 1, 
                                                volume: quantity, 
                                                liquidity: incCostFunct,
                                                earned: earnedFee,
                                                finulabTake: finulabTakeFee,
                                                feesCollected: fee
                                            },
                                            $set: {topOutcomes: modifiedTopOutcomes}
                                        }
                                    );
                                    await marketDesc.updateOne(
                                        {_id: marketId}, 
                                        {
                                            $inc: {participantsTotal: 1, participantsYes: selection === "yes" ? 1 : 0, participantsNo: selection === "no" ? 1 : 0},
                                            $set: {chains: marketChains, quantityYes: quantity_yes, quantityNo: quantity_no, priceYes: priceYes, priceNo: priceNo, probabilityYes: probabilityYes, probabilityNo: probabilityNo, costFunction: costFunctionCalc}
                                        }
                                    );
                                }
                                
                                if(holdingsData) {
                                    let newQuant = 0, newAvgPrice = 0, newEarnings = 0, newQuantityDesc = [];
                                    let incVolume = 0, incParticipants = 0, incParticipantsYes = 0, incParticipantsNo = 0;
                                    if(selection === "yes") {
                                        if(action === "buy") {
                                            incVolume = quantity;
                                            if(incParticipants === 0) {
                                                holdingsData.yesQuantity === 0 ? incParticipants = 1 : incParticipants = 0;
                                            }
                                            if(incParticipantsYes === 0) {
                                                holdingsData.yesQuantity === 0 ? incParticipantsYes = 1 : incParticipantsYes = 0;
                                            }

                                            let chainIdIncluded = false;
                                            const newQuantityDescSupport = holdingsData.yesQuantityDesc;
                                            for(let nq_i = 0; nq_i < newQuantityDescSupport.length; nq_i++) {
                                                if(newQuantityDescSupport[nq_i][0] === chainId) {
                                                    newQuantityDesc.push([newQuantityDescSupport[nq_i][0], newQuantityDescSupport[nq_i][1] + quantity]);
                                                    chainIdIncluded = true;
                                                } else {
                                                    newQuantityDesc.push(newQuantityDescSupport[nq_i]);
                                                }
                                            }
                                            if(!chainIdIncluded) {
                                                newQuantityDesc.push([chainId, quantity]);
                                            }

                                            newQuant = holdingsData.yesQuantity + quantity;
                                            newAvgPrice = ((holdingsData.yesQuantity * holdingsData.yesAveragePrice) + (averagePrice * quantity)) / (holdingsData.yesQuantity + quantity);

                                            await holdingsDesc.updateOne(
                                                {predictionId: predictionId, marketId: marketId, username: uniqueId}, 
                                                {$set: 
                                                    {
                                                        yesQuantity: newQuant, 
                                                        yesAveragePrice: newAvgPrice,
                                                        yesQuantityDesc: newQuantityDesc
                                                    }
                                                }
                                            );
                                        } else if(action === "sell") {
                                            newQuant = holdingsData.yesQuantity - quantity;
                                            if(newQuant < 0) {return res.status(200).json({"status": "error"});}
                                            newQuant === 0 ? newAvgPrice = 0 : newAvgPrice = holdingsData.yesAveragePrice;
                                            newEarnings = total - (quantity * holdingsData.yesAveragePrice);

                                            incVolume = -quantity;
                                            if(incParticipants === 0) {
                                                newQuant === 0 && holdingsData.noQuantity === 0 ? incParticipants = -1 : incParticipants = 0;
                                            }
                                            if(incParticipantsYes === 0) {
                                                newQuant === 0 ? incParticipantsYes = -1 : incParticipantsYes = 0;
                                            }

                                            let chainIdIncluded = false;
                                            const newQuantityDescSupport = holdingsData.yesQuantityDesc;
                                            for(let nq_i = 0; nq_i < newQuantityDescSupport.length; nq_i++) {
                                                if(newQuantityDescSupport[nq_i][0] === chainId) {
                                                    newQuantityDesc.push([newQuantityDescSupport[nq_i][0], newQuantityDescSupport[nq_i][1] - quantity]);
                                                    chainIdIncluded = true;
                                                } else {
                                                    newQuantityDesc.push(newQuantityDescSupport[nq_i]);
                                                }
                                            }
                                            if(!chainIdIncluded) {return res.status(200).json({"status": "error"});}

                                            await holdingsDesc.updateOne(
                                                {predictionId: predictionId, marketId: marketId, username: uniqueId}, 
                                                {
                                                    $set: {yesQuantity: newQuant, yesAveragePrice: newAvgPrice, yesQuantityDesc: newQuantityDesc},
                                                    $inc: {earnings: newEarnings}
                                                }
                                            );
                                        }
                                    } else if(selection === "no") {
                                        if(action === "buy") {
                                            incVolume = quantity;
                                            if(incParticipants === 0) {
                                                holdingsData.noQuantity === 0 ? incParticipants = 1 : incParticipants = 0;
                                            }
                                            if(incParticipantsNo === 0) {
                                                holdingsData.noQuantity === 0 ? incParticipantsNo = 1 : incParticipantsNo = 0;
                                            }
                                            
                                            let chainIdIncluded = false;
                                            const newQuantityDescSupport = holdingsData.noQuantityDesc;
                                            for(let nq_i = 0; nq_i < newQuantityDescSupport.length; nq_i++) {
                                                if(newQuantityDescSupport[nq_i][0] === chainId) {
                                                    newQuantityDesc.push([newQuantityDescSupport[nq_i][0], newQuantityDescSupport[nq_i][1] + quantity]);
                                                    chainIdIncluded = true;
                                                } else {
                                                    newQuantityDesc.push(newQuantityDescSupport[nq_i]);
                                                }
                                            }
                                            if(!chainIdIncluded) {
                                                newQuantityDesc.push([chainId, quantity]);
                                            }

                                            newQuant = holdingsData.noQuantity + quantity;
                                            newAvgPrice = ((holdingsData.noQuantity * holdingsData.noAveragePrice) + (averagePrice * quantity)) / (holdingsData.noQuantity + quantity);

                                            await holdingsDesc.updateOne(
                                                {predictionId: predictionId, marketId: marketId, username: uniqueId}, 
                                                {$set: 
                                                    {
                                                        noQuantity: newQuant, 
                                                        noAveragePrice: newAvgPrice,
                                                        noQuantityDesc: newQuantityDesc
                                                    }
                                                }
                                            );
                                        } else if(action === "sell") {
                                            newQuant = holdingsData.noQuantity - quantity;
                                            if(newQuant < 0) {return res.status(200).json({"status": "error"});}
                                            newQuant === 0 ? newAvgPrice = 0 : newAvgPrice = holdingsData.noAveragePrice;
                                            newEarnings = total - (quantity * holdingsData.noAveragePrice);

                                            incVolume = -quantity;
                                            if(incParticipants === 0) {
                                                newQuant === 0 && holdingsData.yesQuantity === 0 ? incParticipants = -1 : incParticipants = 0;
                                            }
                                            if(incParticipantsNo === 0) {
                                                newQuant === 0 ? incParticipantsNo = -1 : incParticipantsNo = 0;
                                            }

                                            let chainIdIncluded = false;
                                            const newQuantityDescSupport = holdingsData.noQuantityDesc;
                                            for(let nq_i = 0; nq_i < newQuantityDescSupport.length; nq_i++) {
                                                if(newQuantityDescSupport[nq_i][0] === chainId) {
                                                    newQuantityDesc.push([newQuantityDescSupport[nq_i][0], newQuantityDescSupport[nq_i][1] - quantity]);
                                                    chainIdIncluded = true;
                                                } else {
                                                    newQuantityDesc.push(newQuantityDescSupport[nq_i]);
                                                }
                                            }
                                            if(!chainIdIncluded) {return res.status(200).json({"status": "error"});}

                                            await holdingsDesc.updateOne(
                                                {predictionId: predictionId, marketId: marketId, username: uniqueId}, 
                                                {
                                                    $set: {noQuantity: newQuant, noAveragePrice: newAvgPrice, noQuantityDesc: newQuantityDesc},
                                                    $inc: {earnings: newEarnings}
                                                }
                                            );
                                        }
                                    }

                                    let marketChains = marketData.chains;
                                    if(!marketChains.includes(chainId)) {marketChains.push(chainId);}

                                    await predictionsDesc.updateOne(
                                        {_id: predictionId},
                                        {
                                            $inc: {
                                                participants: incParticipants, 
                                                volume: incVolume, 
                                                liquidity: incCostFunct, 
                                                earned: earnedFee,
                                                finulabTake: finulabTakeFee,
                                                feesCollected: fee
                                            },
                                            $set: {topOutcomes: modifiedTopOutcomes}
                                        }
                                    );
                                    await marketDesc.updateOne(
                                        {_id: marketId}, 
                                        {
                                            $inc: {participantsTotal: incParticipants, participantsYes: incParticipantsYes, participantsNo: incParticipantsNo},
                                            $set: {chains: marketChains, quantityYes: quantity_yes, quantityNo: quantity_no, priceYes: priceYes, priceNo: priceNo, probabilityYes: probabilityYes, probabilityNo: probabilityNo, costFunction: costFunctionCalc}
                                        }
                                    );
                                }

                                const newActivityDesc = new activityDesc(
                                    {
                                        predictionId: predictionId,
                                        predictiveImage: marketData.predictiveImage,
                                        predictiveQuestion: marketData.predictiveQuestion,
                                        marketId: marketId,
                                        continous: false,
                                        username: uniqueId,
                                        walletAddress: walletAddress,
                                        outcome: marketData.outcome,
                                        outcomeImage: marketData.outcomeImage,
                                        chainId: chainId,
                                        selection: selection,
                                        action: action,
                                        quantity: quantity,
                                        averagePrice: averagePrice,
                                        fee: fee,
                                        collateral: 0,
                                        costFunctionDesc: {
                                            "quantityYes": quantity_yes, 
                                            "quantityNo": quantity_no, 
                                            "priceYes": priceYes, 
                                            "priceNo": priceNo, 
                                            "costFunction": costFunctionCalc
                                        },
                                        prevCostFunctionDesc: {
                                            "quantityYes": marketData.quantityYes, 
                                            "quantityNo": marketData.quantityNo, 
                                            "priceYes": marketData.priceYes, 
                                            "priceNo": marketData.priceNo, 
                                            "costFunction": marketData.costFunction
                                        },
                                        orderStatus: "opened",
                                        resolutionOutcome: "",
                                        requestKey: "",
                                        openedTimestamp: nowUnix,
                                        sentTimestamp: 0,
                                        validatedTimestamp: 0
                                    }
                                );
                                await newActivityDesc.save();

                                const theAcivityId = newActivityDesc._id;
                                const newPredictionsTxsDesc = new predictionsTxsDesc(
                                    {
                                        predictionId: predictionId,
                                        marketId: marketId,
                                        activityId: theAcivityId,
                                        username: uniqueId,
                                        walletAddress: walletAddress,
                                        continous: false,
                                        chainId: chainId,
                                        type: selection,
                                        function: action === "buy" ? "credit" : "debit",
                                        txDesc: {
                                            "quantity": quantity,
                                            "priceYes": priceYes,
                                            "priceNo": priceNo,
                                            "creatorFee": earnedFee,
                                            "fee": finulabTakeFee,
                                            "cost": (averagePrice * quantity),
                                            "total": total
                                        },
                                        pendedBalance: total,
                                        sent: false,
                                        validated: false,
                                        notified: false,
                                        requestKey: "",
                                        sentTimestamp: 0,
                                        validatedTimestamp: 0,
                                        validationAttempts: 0
                                    }
                                );
                                await newPredictionsTxsDesc.save();
                                
                                return res.status(200).json({"status": "success"});
                            }
                        );
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/prediction-resolve", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const marketId = `${req.body.marketId}`;
            const resolutionOutcome = `${req.body.resolutionOutcome}`;
            
            if(!authorizedReviewers.includes(uniqueId)) {return res.status(200).json({"status": "error"});}
            if(!(resolutionOutcome === "yes" || resolutionOutcome === "no")) {return res.status(200).json({"status": "error"});}
            
            await predictionsResolution.findOne(
                {
                    marketId: marketId
                }
            ).then(
                async (predictionResolutionData) => {
                    if(!predictionResolutionData) {return res.status(200).json({"status": "error"});}

                    if(predictionResolutionData) {
                        if(predictionResolutionData["resolutionOutcome"] === "") {
                            await predictionsResolution.updateOne(
                                {marketId: marketId},
                                {$set: {resolutionOutcome: resolutionOutcome}}
                            );

                            return res.status(200).json({"status": "success"});
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;