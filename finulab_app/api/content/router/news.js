const axios = require("axios");
const {JSDOM} = require("jsdom");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const router = require("express").Router();
const createDOMPurify = require("dompurify");

const stockNewsStatements = require("../models/stock-news-statements");
const cryptoNewsStatements = require("../models/crypto-news-statements");
const newsLikeDislikeDescs = require("../models/news-like-dislike-descs");

const notificationsDescs = require("../models/notifications-descs");
const payoutAmountsTracker = require("../models/payout-amounts-tracker");

const commentsMainDescs = require("../models/news-comments-main-descs");
const commentsDeletedDesc = require("../models/news-comments-deleted-descs");
const commentsSecondaryDescs = require("../models/news-comments-secondary-descs");
const commentsLikeDislikeDescs = require("../models/news-comments-like-dislike-descs");

dotenv.config();

const chunkArray = (arr, size) => {
    let chunkedArray = [];
    for(let i = 0; i < arr.length; i += size) {
        chunkedArray.push(arr.slice(i, i + size));
    }

    return chunkedArray
}

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

router.put("/assets/:asset", async(req, res) => 
    {
        try {
            const asset = req.params.asset;
            const ninclude = req.body.ninclude;
            if(!Array.isArray(ninclude)) {return res.status(500).json({"status": "error"});}

            if(asset.slice(0, 2) === "S:") {
                const newsStatements = await stockNewsStatements.find(
                    {
                        _id: {$nin: ninclude},
                        symbol: `${asset}`.slice(3, `${asset}`.length)
                    }
                ).sort(
                    {
                        timeStamp: -1
                    }
                ).limit(16);

                if(newsStatements.length === 0) {
                    return res.status(200).json({"status": "success", "data": []});
                } else {
                    const structuredNewsStatements = chunkArray(newsStatements, 4);
                    return res.status(200).json({"status": "success", "data": structuredNewsStatements});
                }
            } else if(asset === "finulab-general") {
                const newsStatements = await stockNewsStatements.find(
                    {
                        _id: {$nin: ninclude},
                        symbol: `${asset}`
                    }
                ).sort(
                    {
                        timeStamp: -1
                    }
                ).limit(16);

                if(newsStatements.length === 0) {
                    return res.status(200).json({"status": "success", "data": []});
                } else {
                    const structuredNewsStatements = chunkArray(newsStatements, 4);
                    return res.status(200).json({"status": "success", "data": structuredNewsStatements});
                }
            } else if(asset === "c_finulab-general") {
                const newsStatements = await cryptoNewsStatements.find(
                    {
                        _id: {$nin: ninclude},
                        symbol: `finulab-general`
                    }
                ).sort(
                    {
                        timeStamp: -1
                    }
                ).limit(16);

                if(newsStatements.length === 0) {
                    return res.status(200).json({"status": "success", "data": []});
                } else {
                    const structuredNewsStatements = chunkArray(newsStatements, 4);
                    return res.status(200).json({"status": "success", "data": structuredNewsStatements});
                }
            } else if(asset.slice(0, 2) === "C:") {
                const newsStatements = await cryptoNewsStatements.find(
                    {
                        _id: {$nin: ninclude},
                        symbol: `${asset}`.slice(3, `${asset}`.length)
                    }
                ).sort(
                    {
                        timeStamp: -1
                    }
                ).limit(16);

                if(newsStatements.length === 0) {
                    return res.status(200).json({"status": "success", "data": []});
                } else {
                    const structuredNewsStatements = chunkArray(newsStatements, 4);
                    return res.status(200).json({"status": "success", "data": structuredNewsStatements});
                }
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/for-you", async (req, res) => 
    {
        try {
            const limit = Number(req.body.limit);
            const s_ninclude = req.body.s_ninclude;
            const c_ninclude = req.body.c_ninclude;
            const targetSubjects = req.body.interests;

            if(isNaN(limit)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(s_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(c_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(targetSubjects)) {return res.status(200).json({"status": "error"});}

            if(targetSubjects.length === 0) {
                let stockNews = await stockNewsStatements.find(
                    {
                        _id: {$nin: s_ninclude}
                    }
                ).sort(
                    {
                        trendingScore: -1
                    }
                ).limit(limit);

                let cryptoNews = await cryptoNewsStatements.find(
                    {
                        _id: {$nin: c_ninclude}
                    }
                ).sort(
                    {
                        trendingScore: -1
                    }
                ).limit(limit);

                let data = [];
                for(let i = 0; i < limit; i++) {
                    data.push(
                        {
                            "type": "stock",
                            ...stockNews[i]["_doc"]
                        }
                    );
                    data.push(
                        {
                            "type": "crypto",
                            ...cryptoNews[i]["_doc"]
                        }
                    );
                }
    
                return res.status(200).json({"status": "success", "data": data});
            } else {
                let secondaryStockNews = [], returnStockNews = [];
                let stockNews = await stockNewsStatements.find(
                    {
                        _id: {$nin: s_ninclude},
                        newsSubjects: {$in: targetSubjects}
                    }
                ).sort(
                    {
                        trendingScore: -1
                    }
                ).limit(limit);
                if(stockNews.length !== limit) {
                    secondaryStockNews = await stockNewsStatements.find(
                        {
                            _id: {$nin: s_ninclude}
                        }
                    ).sort(
                        {
                            trendingScore: -1
                        }
                    ).limit(limit - stockNews.length);
                }
                returnStockNews = [...stockNews].concat([...secondaryStockNews])

                let secondaryCryptoNews = [], returnCryptoNews = [];
                let cryptoNews = await cryptoNewsStatements.find(
                    {
                        _id: {$nin: c_ninclude},
                        newsSubjects: {$in: targetSubjects}
                    }
                ).sort(
                    {
                        trendingScore: -1
                    }
                ).limit(limit);
                if(cryptoNews.length !== limit) {
                    secondaryCryptoNews = await cryptoNewsStatements.find(
                        {
                            _id: {$nin: c_ninclude}
                        }
                    ).sort(
                        {
                            trendingScore: -1
                        }
                    ).limit(limit - cryptoNews.length);
                }
                returnCryptoNews = [...cryptoNews].concat([...secondaryCryptoNews]);

                let data = [];
                for(let i = 0; i < limit; i++) {
                    data.push(
                        {
                            "type": "stock",
                            ...returnStockNews[i]["_doc"]
                        }
                    );
                    data.push(
                        {
                            "type": "crypto",
                            ...returnCryptoNews[i]["_doc"]
                        }
                    );
                }
    
                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/specific-news", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const newsId = `${req.body.newsId}`;

            if(type === "stock") {
                const data = await stockNewsStatements.findOne(
                    {
                        _id: newsId
                    }
                );

                return res.status(200).json({"status": "success", "data": data});
            } else if(type === "crypto") {
                const data = await cryptoNewsStatements.findOne(
                    {
                        _id: newsId
                    }
                );

                return res.status(200).json({"status": "success", "data": data});
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/news-engagements", async (req, res) => 
    {
        try {
            const newsIds = req.body.newsIds;
            const uniqueId = `${req.body.uniqueId}`;
            if(!Array.isArray(newsIds)) {return res.status(200).json({"status": "error"});}
            
            const newsEngagements = await newsLikeDislikeDescs.find(
                {
                    username: uniqueId,
                    newsId: {$in: newsIds},
                    status: "active"
                }
            ).select(`-_id newsId type`).exec();

            return res.status(200).json({"status": "success", "data": newsEngagements});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);


router.post("/news-engage", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const newsId = `${req.body.newsId}`;
            const uniqueId = `${req.body.uniqueId}`;
            if(!(type === "like" || type === "dislike")) {return res.status(200).json({"status": "error"});}
            if(!(newsId.slice(0, 1) === "S" || newsId.slice(0, 1) === "C")) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            await newsLikeDislikeDescs.findOne(
                {
                    username: uniqueId,
                    newsId: newsId
                }
            ).then(
                async (engagementData) => {
                    if(!engagementData) {
                        const newEngagement = new newsLikeDislikeDescs(
                            {
                                username: uniqueId,
                                newsId: newsId,
                                type: type,
                                status: "active",
                                timeStamp: nowUnix
                            }
                        );
                        await newEngagement.save();

                        if(type === "like") {
                            if(newsId.slice(0, 1) === "S") {
                                await stockNewsStatements.updateOne(
                                    {_id: newsId.slice(3, newsId.length)},
                                    {$inc: {likes: 1}}
                                );
                            } else if(newsId.slice(0, 1) === "C") {
                                await cryptoNewsStatements.updateOne(
                                    {_id: newsId.slice(3, newsId.length)},
                                    {$inc: {likes: 1}}
                                );
                            }
                        } else if(type === "dislike") {
                            if(newsId.slice(0, 1) === "S") {
                                await stockNewsStatements.updateOne(
                                    {_id: newsId.slice(3, newsId.length)},
                                    {$inc: {dislikes: 1}}
                                );
                            } else if(newsId.slice(0, 1) === "C") {
                                await cryptoNewsStatements.updateOne(
                                    {_id: newsId.slice(3, newsId.length)},
                                    {$inc: {dislikes: 1}}
                                );
                            }
                        }

                        return res.status(200).json({"status": "success"});
                    }

                    if(engagementData) {
                        const prevType = engagementData["type"];
                        const prevStatus = engagementData["status"];

                        if(type === prevType) {
                            if(prevStatus === "active") {
                                await newsLikeDislikeDescs.updateOne(
                                    {username: uniqueId, newsId: newsId},
                                    {$set: {status: "inactive"}}
                                );

                                if(type === "like") {
                                    if(newsId.slice(0, 1) === "S") {
                                        await stockNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {likes: -1}}
                                        );
                                    } else if(newsId.slice(0, 1) === "C") {
                                        await cryptoNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {likes: -1}}
                                        );
                                    }
                                } else if(type === "dislike") {
                                    if(newsId.slice(0, 1) === "S") {
                                        await stockNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {dislikes: -1}}
                                        );
                                    } else if(newsId.slice(0, 1) === "C") {
                                        await cryptoNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {dislikes: -1}}
                                        );
                                    }
                                }
                            } else {
                                await newsLikeDislikeDescs.updateOne(
                                    {username: uniqueId, newsId: newsId},
                                    {$set: {status: "active"}}
                                );

                                if(type === "like") {
                                    if(newsId.slice(0, 1) === "S") {
                                        await stockNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {likes: 1}}
                                        );
                                    } else if(newsId.slice(0, 1) === "C") {
                                        await cryptoNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {likes: 1}}
                                        );
                                    }
                                } else if(type === "dislike") {
                                    if(newsId.slice(0, 1) === "S") {
                                        await stockNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {dislikes: 1}}
                                        );
                                    } else if(newsId.slice(0, 1) === "C") {
                                        await cryptoNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {dislikes: 1}}
                                        );
                                    }
                                }
                            }
                        } else {
                            await newsLikeDislikeDescs.updateOne(
                                {username: uniqueId, newsId: newsId},
                                {$set: {type: type, status: "active"}}
                            );

                            if(type === "like") {
                                if(newsId.slice(0, 1) === "S") {
                                    await stockNewsStatements.updateOne(
                                        {_id: newsId.slice(3, newsId.length)},
                                        {$inc: {likes: 1}}
                                    );

                                    if(prevStatus === "active") {
                                        await stockNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {dislikes: -1}}
                                        );
                                    }
                                } else if(newsId.slice(0, 1) === "C") {
                                    await cryptoNewsStatements.updateOne(
                                        {_id: newsId.slice(3, newsId.length)},
                                        {$inc: {likes: 1}}
                                    );

                                    if(prevStatus === "active") {
                                        await cryptoNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {dislikes: -1}}
                                        );
                                    }
                                }
                            } else if(type === "dislike") {
                                if(newsId.slice(0, 1) === "S") {
                                    await stockNewsStatements.updateOne(
                                        {_id: newsId.slice(3, newsId.length)},
                                        {$inc: {dislikes: 1}}
                                    );

                                    if(prevStatus === "active") {
                                        await stockNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {likes: -1}}
                                        );
                                    }
                                } else if(newsId.slice(0, 1) === "C") {
                                    await cryptoNewsStatements.updateOne(
                                        {_id: newsId.slice(3, newsId.length)},
                                        {$inc: {dislikes: 1}}
                                    );

                                    if(prevStatus === "active") {
                                        await cryptoNewsStatements.updateOne(
                                            {_id: newsId.slice(3, newsId.length)},
                                            {$inc: {likes: -1}}
                                        );
                                    }
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
            const newsId = `${req.body.newsId}`;
            const commentCount = Number(req.body.comments);
            if(isNaN(commentCount) & isFinite(commentCount)) {return res.status(200).json({"status": "error"});}

            if(commentCount <= 10) {
                const mainComments = await commentsMainDescs.find(
                    {
                        newsId: newsId
                    }
                ).sort({verified: -1, confidenceScore: -1});

                const secondaryComments = await commentsSecondaryDescs.find(
                    {
                        newsId: newsId
                    }
                ).sort({verified: -1, confidenceScore: -1});

                return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainComments.length});
            } else {
                const mainCommentsCount = await commentsMainDescs.countDocuments({newsId: newsId});

                if(mainCommentsCount <= 10) {
                    const mainComments = await commentsMainDescs.find(
                        {
                            newsId: newsId
                        }
                    ).sort({verified: -1, confidenceScore: -1});

                    const secondaryComments = await commentsSecondaryDescs.find(
                        {
                            newsId: newsId,
                            index: 1
                        }
                    ).sort({verified: -1, confidenceScore: -1}).limit(5);

                    return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainCommentsCount});
                } else {
                    const mainComments = await commentsMainDescs.find(
                        {
                            newsId: newsId
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
            const newsId = `${req.body.newsId}`;
            const ni_commentIds = req.body.ni_commentIds;
            if(!Array.isArray(ni_commentIds)) {return res.status(200).json({"status": "error"});}

            const mainComments = await commentsMainDescs.find(
                {
                    _id: {$nin: ni_commentIds},
                    newsId: newsId
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

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"] + 1, engCommentData["dislikes"]);
    
                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne(
                                        {_id: commentId.slice(2, commentId.length)}, 
                                        {
                                            $inc: {
                                                likes: 1,
                                                userRewards: commentRewardAmount
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
                                                userRewards: commentRewardAmount
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
                                                userRewards: commentRewardAmount
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
                                                userRewards: commentRewardAmount
                                            }, 
                                            $set: {confidenceScore: calculatedCS}
                                        }
                                    );
                                }
                            }

                            if(commentRewardAmount > 0) {
                                const modRewardRec = await axios.post(`http://localhost:8900/api/users/modify-rewards_records`, 
                                    {
                                        "groupId": "",
                                        "groupIdAmt": 0,
                                        "username": engCommentData["username"],
                                        "usernameAmt": commentRewardAmount,
                                        "secondaryUsername": "",
                                        "secondaryUsernameAmt": 0
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
                            const newEngagementNotification = new notificationsDescs(
                                {
                                    by: uniqueId,
                                    target: engCommentData["username"],
                                    byProfileImage: profileImage,
                                    type: "engagement",
                                    message: `${uniqueId} has liked your comment`,
                                    secondaryMessage: engCommentData["comment"],
                                    link: `/news/${engCommentData["newsId"]}`,
                                    read: false,
                                    timeStamp: nowUnix
                                }
                            );
                            await newEngagementNotification.save();
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
            const newsId = `${req.body.newsId}`;
            const monetized = req.body.monetized;
            const comment = `${req.body.comment}`;
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);

            const window = new JSDOM("").window;
            const DOMPurify = createDOMPurify(window);
            const sanitizedComment = DOMPurify.sanitize(comment);
            const newMainComment = new commentsMainDescs(
                {
                    username: uniqueId,
                    profileImage: profileImage,
                    newsId: newsId,
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
                    status: "active",
                    flair: [],
                    timeStamp: nowUnix
                }
            );
            await newMainComment.save();

            if(newsId.slice(0, 1) === "S") {
                await stockNewsStatements.updateOne({_id: newsId.slice(3, newsId.length)}, {$inc: {comments: 1}});
            } else if(newsId.slice(0, 1) === "C") {
                await cryptoNewsStatements.updateOne({_id: newsId.slice(3, newsId.length)}, {$inc: {comments: 1}});
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
            const newsId = `${req.body.newsId}`;
            const monetized = req.body.monetized;
            const comment = `${req.body.comment}`;
            const uniqueId = `${req.body.uniqueId}`;
            const commentId = `${req.body.commentId}`;
            const profileImage = `${req.body.profileImage}`;
            const mainCommentId = `${req.body.mainCommentId}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}
            if(!(index === 1 || index === 2 || index === 3))  {return res.status(200).json({"status": "error"});}

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
                                newsId: newsId,
                                monetized: monetized,
                                verified: verified,
                                index: index,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                language: "",
                                translation: "",
                                mainCommentId: mainCommentId,
                                commentId: commentId,
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        );
                        await newSecondaryComment.save();

                        if(newsId.slice(0, 1) === "S") {
                            await stockNewsStatements.updateOne({_id: newsId.slice(3, newsId.length)}, {$inc: {comments: 1}});
                        } else if(newsId.slice(0, 1) === "C") {
                            await cryptoNewsStatements.updateOne({_id: newsId.slice(3, newsId.length)}, {$inc: {comments: 1}});
                        }
                        index === 1 ? await commentsMainDescs.updateOne({_id: mainCommentId}, {$inc: {comments: 1}}) : await commentsSecondaryDescs.updateOne({_id: commentId}, {$inc: {comments: 1}}); 

                        if(uniqueId !== commentIdCheck["username"]) {
                            const newEngagementNotification = new notificationsDescs(
                                {
                                    by: uniqueId,
                                    target: commentIdCheck["username"],
                                    byProfileImage: profileImage,
                                    type: "engagement",
                                    message: `${uniqueId} has replied to your comment`,
                                    secondaryMessage: sanitizedComment,
                                    link: `/news/${newsId}`,
                                    read: false,
                                    timeStamp: nowUnix
                                }
                            );
                            await newEngagementNotification.save();
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
                                    newsId: mainCommentData.newsId,
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
                                    newsId: secondaryCommentData.newsId,
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

module.exports = router;