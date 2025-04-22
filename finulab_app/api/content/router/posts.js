const axios = require("axios");
const {JSDOM} = require("jsdom");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const router = require("express").Router();
const createDOMPurify = require("dompurify");

const trendingDescs = require("../models/trending");
const postsDescs = require("../models/posts-descs");
const postsLikeDislikeDescs = require("../models/posts-like-dislike-descs");

const notificationsDescs = require("../models/notifications-descs");
const payoutAmountsTracker = require("../models/payout-amounts-tracker");

const commentsMainDescs = require("../models/comments-main-descs");
const commentsDeletedDesc = require("../models/comments-deleted-descs");
const commentsSecondaryDescs = require("../models/comments-secondary-descs");
const commentsLikeDislikeDescs = require("../models/comments-like-dislike-descs");

dotenv.config();

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
};

router.put("/for-you", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const interests = req.body.interests;
            const idsToExclude = req.body.idsToExclude;
            const confidenceLevel = req.body.confidenceLevel;

            if(!Array.isArray(interests)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(idsToExclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}
            if(isNaN(confidenceLevel) || !isFinite(confidenceLevel)) {return res.status(200).json({"status": "error"});}

            const trendingData = await trendingDescs.find({}).sort({timeStamp: -1}).limit(1);
            const pullSubjects = trendingData[0]["subjects"].map(t_desc => t_desc[0]).slice(0, 10);

            if(type === "primary") {
                if(interests.length === 0) {
                    const dataPullOne = await postsDescs.find(
                        {
                            postSubjects: {$in: pullSubjects},
                            status: "active",
                            $or: [
                                {"photos.0": {$exists: true}},
                                {"videos.0": {$exists: true}},
                                {$expr: { 
                                        $gt: [ 
                                            {$strLenCP: "$post"}, 
                                            25
                                        ] 
                                    }
                                }
                            ]
                        }
                    ).sort(
                        {
                            verified: -1,
                            monetized: -1,
                            timeStamp: -1,
                            confidenceScore: -1
                        }
                    ).limit(10);

                    return res.status(200).json({"status": "success", "data": dataPullOne});
                } else {
                    const allInterests = [
                        ...interests, 
                        ...pullSubjects
                    ];
                    const dataPullOne = await postsDescs.aggregate(
                        [
                            {
                                $match: {
                                    postSubjects: {$in: allInterests},
                                    status: "active",
                                    $or: [
                                        {"photos.0": {$exists: true}},
                                        {"videos.0": {$exists: true}},
                                        {$expr: { 
                                                $gt: [ 
                                                    {$strLenCP: "$post"}, 
                                                    25
                                                ] 
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    priorityScore: {
                                        $cond: {
                                            if: {$in: ["$postSubjects", interests]},
                                            then: 1,
                                            else: 0
                                        }
                                    }
                                }
                            },
                            {
                                $sort: {
                                    priorityScore: -1,
                                    verified: -1,
                                    monetized: -1,
                                    timeStamp: -1,
                                    confidenceScore: -1
                                }
                            },
                            {$limit: 10}
                        ]
                    );

                    return res.status(200).json({"status": "success", "data": dataPullOne});
                }
            } else if(type === "secondary") {
                if(interests.length === 0) {
                    const dataPullOne = await postsDescs.find(
                        {
                            _id: {$nin: idsToExclude},
                            postSubjects: {$in: pullSubjects},
                            status: "active",
                            $or: [
                                {"photos.0": {$exists: true}},
                                {"videos.0": {$exists: true}},
                                {$expr: { 
                                        $gt: [ 
                                            {$strLenCP: "$post"}, 
                                            25
                                        ] 
                                    }
                                }
                            ]
                        }
                    ).sort(
                        {
                            verified: -1,
                            monetized: -1,
                            timeStamp: -1,
                            confidenceScore: -1
                        }
                    ).limit(15);

                    return res.status(200).json({"status": "success", "data": dataPullOne});
                } else {
                    const allInterests = [
                        ...interests, 
                        ...pullSubjects
                    ];
                    const dataPullOne = await postsDescs.aggregate(
                        [
                            {
                                $match: {
                                    _id: {$nin: idsToExclude},
                                    postSubjects: {$in: allInterests},
                                    status: "active",
                                    $or: [
                                        {"photos.0": {$exists: true}},
                                        {"videos.0": {$exists: true}},
                                        {$expr: { 
                                                $gt: [ 
                                                    {$strLenCP: "$post"}, 
                                                    25
                                                ] 
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $addFields: {
                                    priorityScore: {
                                        $cond: {
                                            if: {$in: ["$postSubjects", interests]},
                                            then: 1,
                                            else: 0
                                        }
                                    }
                                }
                            },
                            {
                                $sort: {
                                    priorityScore: -1,
                                    verified: -1,
                                    monetized: -1,
                                    timeStamp: -1,
                                    confidenceScore: -1
                                }
                            },
                            {$limit: 10}
                        ]
                    );

                    return res.status(200).json({"status": "success", "data": dataPullOne});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile-post-count", async (req, res) => 
    {
        try {
            const username = `${req.body.username}`;
            const postCount = await postsDescs.countDocuments({username: username, status: "active"});

            return res.status(200).json({"status": "success", "data": postCount});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/community-post-count", async (req, res) => 
    {
        try {
            const community = `${req.body.community}`;
            const postCount = await postsDescs.countDocuments({groupId: community, status: "active"});

            return res.status(200).json({"status": "success", "data": postCount});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const username = `${req.body.username}`;
            const idsToExclude = req.body.idsToExclude;

            if(!Array.isArray(idsToExclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const postCount = await postsDescs.countDocuments({username: username, status: "active"});

                const posts = await postsDescs.find(
                    {
                        username: username, 
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(10);

                return res.status(200).json({"status": "success", "data": posts, "dataCount": postCount});
            } else if(type === "secondary") {
                const posts = await postsDescs.find(
                    {
                        _id: {$nin: idsToExclude},
                        username: username, 
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(15);

                return res.status(200).json({"status": "success", "data": posts});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/community", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const groupId = `${req.body.community}`;
            const idsToExclude = req.body.idsToExclude;

            if(!Array.isArray(idsToExclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const postCount = await postsDescs.countDocuments({groupId: groupId, status: "active"});

                const posts = await postsDescs.find(
                    {
                        groupId: groupId,
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(10);

                return res.status(200).json({"status": "success", "data": posts, "dataCount": postCount});
            } else if(type === "secondary") {
                const posts = await postsDescs.find(
                    {
                        _id: {$nin: idsToExclude},
                        groupId: groupId,
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(15);

                return res.status(200).json({"status": "success", "data": posts});
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
                const dataCount = await postsLikeDislikeDescs.countDocuments({username: uniqueId, status: "active"});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const postIds = await postsLikeDislikeDescs.find(
                        {
                            username: uniqueId,
                            status: "active"
                        }
                    ).sort({timeStamp: -1}).limit(100);
    
                    let pull_postIds = [];
                    for(let i = 0; i < postIds.length; i++) {
                        pull_postIds.push(postIds[i]["postId"]);
                    }

                    const posts = await postsDescs.find(
                        {
                            _id: {$in: pull_postIds},
                            status: "active"
                        }
                    ).limit(10);

                    const timeStampMap = new Map(postIds.map(item => [item.postId, item.timeStamp]));
                    const data = posts.sort((a, b) => {
                        const A = timeStampMap.get(a._id);
                        const B = timeStampMap.get(b._id);

                        return (B || 0) - (A || 0);
                    });

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const postIds = await postsLikeDislikeDescs.find(
                    {
                        username: uniqueId,
                        postId: {$nin: p_ninclude},
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(100);

                let pull_postIds = [];
                for(let i = 0; i < postIds.length; i++) {
                    pull_postIds.push(postIds[i]["postId"]);
                }

                const posts = await postsDescs.find(
                    {
                        _id: {$in: pull_postIds},
                        status: "active"
                    }
                ).limit(10);

                const timeStampMap = new Map(postIds.map(item => [item.postId, item.timeStamp]));
                const data = posts.sort((a, b) => {
                    const A = timeStampMap.get(a._id);
                    const B = timeStampMap.get(b._id);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/following", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const following = req.body.following;
            const idsToExclude = req.body.idsToExclude;

            if(!Array.isArray(following)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(idsToExclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const postCount = await postsDescs.countDocuments({username: {$in: following}, status: "active"});

                const posts = await postsDescs.find(
                    {
                        username: {$in: following}, 
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(10);

                return res.status(200).json({"status": "success", "data": posts, "dataCount": postCount});
            } else if(type === "secondary") {
                const posts = await postsDescs.find(
                    {
                        _id: {$nin: idsToExclude},
                        username: {$in: following}, 
                        status: "active"
                    }
                ).sort({timeStamp: -1}).limit(10);

                return res.status(200).json({"status": "success", "data": posts});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/asset-posts", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const asset = `${req.body.asset}`;
            const limit = Number(req.body.limit);
            const idsToExclude = req.body.idsToExclude;

            if(!Array.isArray(idsToExclude)) {return res.status(200).json({"status": "error"});}
            if(isNaN(limit) || !isFinite(limit)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const posts = await postsDescs.find(
                    {
                        _id: {$nin: idsToExclude},
                        taggedAssets: asset,
                        status: "active"
                    }
                ).sort(
                    {
                        verified: -1,
                        monetized: -1,
                        timeStamp: -1,
                        confidenceScore: -1
                    }
                ).limit(2 * limit);
                const postsCount = await postsDescs.countDocuments({taggedAssets: asset, status: "active"});

                return res.status(200).json({"status": "success", "data": posts, "dataCount": postsCount});
            } else if(type === "secondary") {
                const posts = await postsDescs.find(
                    {
                        _id: {$nin: idsToExclude},
                        taggedAssets: asset,
                        status: "active"
                    }
                ).sort(
                    {
                        verified: -1,
                        monetized: -1,
                        timeStamp: -1,
                        confidenceScore: -1
                    }
                ).limit(2 * limit);

                return res.status(200).json({"status": "success", "data": posts});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        } 
    }
);

router.put("/specific-post", async (req, res) => 
    {
        try {
            const postId = `${req.body.postId}`;

            const data = await postsDescs.findOne(
                {
                    _id: postId
                }
            );

            return res.status(200).json({"status": "success", "data": data});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/post-engagements", async (req, res) => 
    {
        try {
            const postIds = req.body.postIds;
            const uniqueId = `${req.body.uniqueId}`;
            if(!Array.isArray(postIds)) {return res.status(200).json({"status": "error"});}
            
            const postEngagements = await postsLikeDislikeDescs.find(
                {
                    username: uniqueId,
                    postId: {$in: postIds},
                    status: "active"
                }
            ).select(`-_id postId type`).exec();

            return res.status(200).json({"status": "success", "data": postEngagements});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/post-engage", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const postId = `${req.body.postId}`;
            const uniqueId = `${req.body.uniqueId}`;
            const accountType = `${req.body.accountType}`;
            const profileImage = `${req.body.profileImage}`;
            
            if(!(type === "like" || type === "dislike")) {return res.status(200).json({"status": "error"});}
            if(!(accountType === "" || accountType === "validated")) {return res.status(200).json({"status": "error"});}
            
            const engPostData = await postsDescs.findById(postId);
            if(!engPostData) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            await postsLikeDislikeDescs.findOne(
                {
                    username: uniqueId,
                    postId: postId
                }
            ).then(
                async (engagementData) => {
                    if(!engagementData) {
                        const newPostEngagement = new postsLikeDislikeDescs(
                            {
                                username: uniqueId,
                                postId: postId,
                                type: type,
                                status: "active",
                                timeStamp: nowUnix
                            }
                        );
                        await newPostEngagement.save();

                        if(accountType === "validated" 
                            && engPostData["verified"] && engPostData["username"] !== uniqueId
                        ) {
                            let postRewardAmount = 0;
                            const payoutAmountsDesc = await payoutAmountsTracker.find({}).sort({timeStamp: -1}).limit(1);
                            if(payoutAmountsDesc.length > 0) {
                                postRewardAmount = payoutAmountsDesc[0]["postLiked"];
                            }

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engPostData["likes"] + 1, engPostData["dislikes"]);
                                await postsDescs.updateOne(
                                    {_id: postId}, 
                                    {
                                        $inc: {
                                            likes: 1, 
                                            userRewards: engPostData["groupId"] === "" ? postRewardAmount : (1 - 0.025) * postRewardAmount,
                                            communityRewards: engPostData["groupId"] === "" ? 0 : 0.025 * postRewardAmount
                                        }, 
                                        $set: {confidenceScore: calculatedCS}
                                    }
                                );
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engPostData["likes"], engPostData["dislikes"] + 1);
                                await postsDescs.updateOne(
                                    {_id: postId}, 
                                    {
                                        $inc: {
                                            dislikes: 1, 
                                            userRewards: engPostData["groupId"] === "" ? postRewardAmount : (1 - 0.025) * postRewardAmount,
                                            communityRewards: engPostData["groupId"] === "" ? 0 : 0.025 * postRewardAmount
                                        }, 
                                        $set: {confidenceScore: calculatedCS}
                                    }
                                );
                            }

                            if(postRewardAmount > 0) {
                                const modRewardRec = await axios.post(`http://localhost:8900/api/users/modify-rewards_records`, 
                                    {
                                        "groupId": engPostData["groupId"],
                                        "groupIdAmt": engPostData["groupId"] === "" ? 0 : 0.025 * postRewardAmount,
                                        "username": engPostData["username"],
                                        "usernameAmt": engPostData["groupId"] === "" ? postRewardAmount : (1 - 0.025) * postRewardAmount,
                                        "secondaryUsername": "",
                                        "secondaryUsernameAmt": 0
                                    }
                                );
                            }
                        } else {
                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engPostData["likes"] + 1, engPostData["dislikes"]);
                                await postsDescs.updateOne({_id: postId}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engPostData["likes"], engPostData["dislikes"] + 1);
                                await postsDescs.updateOne({_id: postId}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                            }
                        }

                        if(type === "like" && engPostData["username"] !== uniqueId) {
                            const newEngagementNotification = new notificationsDescs(
                                {
                                    by: uniqueId,
                                    target: engPostData["username"],
                                    byProfileImage: profileImage,
                                    type: "engagement",
                                    message: `${uniqueId} has liked your post`,
                                    secondaryMessage: engPostData["post"],
                                    link: `/post/${postId}`,
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
                                await postsLikeDislikeDescs.updateOne(
                                    {username: uniqueId, postId: postId},
                                    {$set: {status: "inactive"}}
                                );

                                if(type === "like") {
                                    const calculatedCS = calcConfidenceScore(engPostData["likes"] - 1, engPostData["dislikes"]);
                                    await postsDescs.updateOne({_id: postId}, {$inc: {likes: -1}, $set: {confidenceScore: calculatedCS}});
                                } else if(type === "dislike") {
                                    const calculatedCS = calcConfidenceScore(engPostData["likes"], engPostData["dislikes"] - 1);
                                    await postsDescs.updateOne({_id: postId}, {$inc: {dislikes: -1}, $set: {confidenceScore: calculatedCS}});
                                }
                            } else {
                                await postsLikeDislikeDescs.updateOne(
                                    {username: uniqueId, postId: postId},
                                    {$set: {status: "active"}}
                                );

                                if(type === "like") {
                                    const calculatedCS = calcConfidenceScore(engPostData["likes"] + 1, engPostData["dislikes"]);
                                    await postsDescs.updateOne({_id: postId}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                } else if(type === "dislike") {
                                    const calculatedCS = calcConfidenceScore(engPostData["likes"], engPostData["dislikes"] + 1);
                                    await postsDescs.updateOne({_id: postId}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                }
                            }
                        } else {
                            await postsLikeDislikeDescs.updateOne(
                                {username: uniqueId, postId: postId},
                                {$set: {type: type, status: "active"}}
                            );

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engPostData["likes"] + 1, engPostData["dislikes"]);
                                await postsDescs.updateOne({_id: postId}, {$inc: {likes: 1}, $set: {confidenceScore: calculatedCS}});
                                if(prevStatus === "active") {
                                    const s_calculatedCS = calcConfidenceScore(engPostData["likes"] + 1, engPostData["dislikes"] - 1);
                                    await postsDescs.updateOne({_id: postId}, {$inc: {dislikes: -1}, $set: {confidenceScore: s_calculatedCS}});
                                }
                            } else if(type === "dislike") {
                                const calculatedCS = calcConfidenceScore(engPostData["likes"], engPostData["dislikes"] + 1);
                                await postsDescs.updateOne({_id: postId}, {$inc: {dislikes: 1}, $set: {confidenceScore: calculatedCS}});
                                if(prevStatus === "active") {
                                    const s_calculatedCS = calcConfidenceScore(engPostData["likes"] - 1, engPostData["dislikes"] + 1);
                                    await postsDescs.updateOne({_id: postId}, {$inc: {likes: -1}, $set: {confidenceScore: s_calculatedCS}});
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
            const postId = `${req.body.postId}`;
            const commentCount = Number(req.body.comments);
            if(isNaN(commentCount) & isFinite(commentCount)) {return res.status(200).json({"status": "error"});}

            if(commentCount <= 10) {
                const mainComments = await commentsMainDescs.find(
                    {
                        postId: postId
                    }
                ).sort({verified: -1, confidenceScore: -1});

                const secondaryComments = await commentsSecondaryDescs.find(
                    {
                        postId: postId
                    }
                ).sort({verified: -1, confidenceScore: -1});

                return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainComments.length});
            } else {
                const mainCommentsCount = await commentsMainDescs.countDocuments({postId: postId});

                if(mainCommentsCount <= 10) {
                    const mainComments = await commentsMainDescs.find(
                        {
                            postId: postId
                        }
                    ).sort({verified: -1, confidenceScore: -1});

                    const secondaryComments = await commentsSecondaryDescs.find(
                        {
                            postId: postId,
                            index: 1
                        }
                    ).sort({verified: -1, confidenceScore: -1}).limit(5);

                    return res.status(200).json({"status": "success", "data": mainComments, "support": secondaryComments, "dataCount": mainCommentsCount});
                } else {
                    const mainComments = await commentsMainDescs.find(
                        {
                            postId: postId
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
            const postId = `${req.body.postId}`;
            const ni_commentIds = req.body.ni_commentIds;
            if(!Array.isArray(ni_commentIds)) {return res.status(200).json({"status": "error"});}

            const mainComments = await commentsMainDescs.find(
                {
                    _id: {$nin: ni_commentIds},
                    postId: postId
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

                            let postDecrease = 0;
                            let engPostData = await postsDescs.findById(engCommentData["postId"]);
                            if(engPostData) {
                                if(engPostData["verified"]) {
                                    postDecrease = 0.025;
                                    await postsDescs.updateOne(
                                        {_id: engCommentData["postId"]},
                                        {$inc: {userRewards: 0.025 * commentRewardAmount}}
                                    );
                                }
                            }

                            if(type === "like") {
                                const calculatedCS = calcConfidenceScore(engCommentData["likes"] + 1, engCommentData["dislikes"]);
    
                                if(commentId.slice(0, 1) === "m") {
                                    await commentsMainDescs.updateOne(
                                        {_id: commentId.slice(2, commentId.length)}, 
                                        {
                                            $inc: {
                                                likes: 1,
                                                userRewards: engCommentData["groupId"] === "" ? (1 - postDecrease) * commentRewardAmount : (1 - postDecrease - 0.025) * commentRewardAmount,
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
                                                userRewards: engCommentData["groupId"] === "" ? (1 - postDecrease) * commentRewardAmount : (1 - postDecrease - 0.025) * commentRewardAmount,
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
                                                userRewards: engCommentData["groupId"] === "" ? (1 - postDecrease) * commentRewardAmount : (1 - postDecrease - 0.025) * commentRewardAmount,
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
                                                userRewards: engCommentData["groupId"] === "" ? (1 - postDecrease) * commentRewardAmount : (1 - postDecrease - 0.025) * commentRewardAmount,
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
                                        "username": !engPostData ? "" : engPostData["verified"] ? engPostData["username"] : "",
                                        "usernameAmt": !engPostData ? 0 : engPostData["verified"] ?  postDecrease * commentRewardAmount : 0,
                                        "secondaryUsername": engCommentData["username"],
                                        "secondaryUsernameAmt": engCommentData["groupId"] === "" ? (1 - postDecrease) * commentRewardAmount : (1 - postDecrease - 0.025) * commentRewardAmount
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
                                    link: `/post/${engCommentData["postId"]}`,
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
            const postId = `${req.body.postId}`;
            const monetized = req.body.monetized;
            const groupId = `${req.body.groupId}`;
            const comment = `${req.body.comment}`;
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}

            const engPostData = await postsDescs.findById(postId);
            if(!engPostData) {return res.status(200).json({"status": "error"});}

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
                    postId: postId,
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
            await postsDescs.updateOne({_id: postId}, {$inc: {comments: 1}});

            if(uniqueId !== engPostData["username"]) {
                const newEngagementNotification = new notificationsDescs(
                    {
                        by: uniqueId,
                        target: engPostData["username"],
                        byProfileImage: profileImage,
                        type: "engagement",
                        message: `${uniqueId} has commented on your post`,
                        secondaryMessage: sanitizedComment,
                        link: `/post/${postId}`,
                        read: false,
                        timeStamp: nowUnix
                    }
                );
                await newEngagementNotification.save();
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
            const postId = `${req.body.postId}`;
            const monetized = req.body.monetized;
            const groupId = `${req.body.groupId}`;
            const comment = `${req.body.comment}`;
            const uniqueId = `${req.body.uniqueId}`;
            const commentId = `${req.body.commentId}`;
            const profileImage = `${req.body.profileImage}`;
            const mainCommentId = `${req.body.mainCommentId}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}
            if(!(index === 1 || index === 2 || index === 3))  {return res.status(200).json({"status": "error"});}

            const engPostData = await postsDescs.findById(postId);
            if(!engPostData) {return res.status(200).json({"status": "error"});}

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
                                postId: postId,
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

                        await postsDescs.updateOne({_id: postId}, {$inc: {comments: 1}});
                        index === 1 ? await commentsMainDescs.updateOne({_id: mainCommentId}, {$inc: {comments: 1}}) : await commentsSecondaryDescs.updateOne({_id: commentId}, {$inc: {comments: 1}}); 

                        if(uniqueId !== engPostData["username"]) {
                            const newEngagementNotification = new notificationsDescs(
                                {
                                    by: uniqueId,
                                    target: engPostData["username"],
                                    byProfileImage: profileImage,
                                    type: "engagement",
                                    message: `${uniqueId} has commented on your post`,
                                    secondaryMessage: sanitizedComment,
                                    link: `/post/${postId}`,
                                    read: false,
                                    timeStamp: nowUnix
                                }
                            );
                            await newEngagementNotification.save();
                        }

                        if(uniqueId !== commentIdCheck["username"]
                            && engPostData["username"] !== commentIdCheck["username"] 
                        ) {
                            const newEngagementNotification = new notificationsDescs(
                                {
                                    by: uniqueId,
                                    target: commentIdCheck["username"],
                                    byProfileImage: profileImage,
                                    type: "engagement",
                                    message: `${uniqueId} has replied to your comment`,
                                    secondaryMessage: sanitizedComment,
                                    link: `/post/${postId}`,
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
                                    groupId: mainCommentData.groupId,
                                    postId: mainCommentData.postId,
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
                                    postId: secondaryCommentData.postId,
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

router.post("/create-post", async (req, res) =>
    {
        try {
            const photos = req.body.photos;
            const videos = req.body.videos;
            const post = `${req.body.post}`;
            const verified = req.body.verified;
            const monetized = req.body.monetized;
            const groupId = `${req.body.groupId}`;
            const uniqueId = `${req.body.uniqueId}`;
            const taggedUsers = req.body.taggedUsers;
            const taggedAssets = req.body.taggedAssets;
            const profileImage = `${req.body.profileImage}`;
            const groupProfileImage = `${req.body.groupProfileImage}`;
            if(!Array.isArray(photos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(videos)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(taggedUsers)) {return res.status(200).json({"status": "error"});}
            if(!Array.isArray(taggedAssets)) {return res.status(200).json({"status": "error"});}

            let postSubjects = req.body.postSubjects;
            if(!Array.isArray(postSubjects)) {return res.status(200).json({"status": "error"});}
            if(postSubjects.length > 50) {
                postSubjects = [
                    ...postSubjects.slice(0, 25), 
                    ...postSubjects.slice(postSubjects.length - 25, postSubjects.length)
                ];
            }

            const accountType = `${req.body.accountType}`;
            if(accountType !== "validated") {
                const userPostCount = await postsDescs.countDocuments({username: uniqueId});
                if(userPostCount >= 2) {
                    const modifyAccountType = await axios.post(`http://localhost:8900/api/users/modify-accountType`, {"username": uniqueId});
                }
            }

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);

            const window = new JSDOM("").window;
            const DOMPurify = createDOMPurify(window);
            const sanitizedPost = DOMPurify.sanitize(post);

            const newPost = new postsDescs(
                {
                    username: uniqueId,
                    profileImage: profileImage,
                    groupId: groupId,
                    groupProfileImage: groupProfileImage,
                    monetized: monetized,
                    verified: verified,
                    title: "",
                    post: sanitizedPost,
                    language: "",
                    translation: "",
                    repostId: "",
                    photos: photos,
                    videos: videos,
                    taggedAssets: taggedAssets,
                    spam: false,
                    helpful: true,
                    postSubjects: postSubjects,
                    likes: 0,
                    validatedLikes: 0,
                    dislikes: 0,
                    validatedDislikes: 0,
                    views: 0,
                    validatedViews: 0,
                    comments: 0,
                    reposts: 0,
                    shares: 0,
                    trendingScore: 0,
                    confidenceScore: 0,
                    userRewards: 0,
                    communityRewards: 0,
                    status: "active",
                    flair: [],
                    validTags: [],
                    timeStamp: nowUnix
                }
            );
            await newPost.save();

            if(taggedUsers.length > 0) {
                for(let j = 0; j < taggedUsers.length; j++) {
                    const newTagNotification = new notificationsDescs(
                        {
                            by: uniqueId,
                            target: taggedUsers[j],
                            byProfileImage: profileImage,
                            type: "engagement",
                            message: `${uniqueId} has tagged you in a post`,
                            secondaryMessage: sanitizedPost,
                            link: `/post/${newPost["_id"]}`,
                            read: false,
                            timeStamp: nowUnix
                        }
                    );
                    await newTagNotification.save();
                }
            }

            return res.status(200).json({"status": "success", "data": newPost["_id"]}); 
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;