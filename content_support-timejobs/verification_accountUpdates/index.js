const dotenv = require("dotenv");
const datefns = require("date-fns");
const mongoose = require("mongoose");

dotenv.config();

const master_db = mongoose.createConnection(process.env.mongo_master_db);
const market_db = mongoose.createConnection(process.env.mongo_market_db);
const content_db = mongoose.createConnection(process.env.mongo_content_db);
const finux_network_db = mongoose.createConnection(process.env.mongo_finux_network_db);

/* master db */
const usersIndexSchema = mongoose.Schema(
    {
        username: String,
        usernameEmbedding: Array,
        bio: String,
        bioEmbedding: Array,
        profilePicture: String,
        profileWallpaper: String,
        monetized: Boolean,
        verified: Boolean,
        accountType: String,
        createdAt: Number
    }
);
const usersIndex = master_db.model("users-index", usersIndexSchema, "users-index");

/* finux network db */
const accountsWalletDescsSchema = mongoose.Schema(
    {
        username: String,
        accountName: String,
        accountDesignation: String,
        publicKey: String,
        secretKey: String,
        aggregateBalance: Number,
        pendingBalanceMorning: Number,
        pendingBalanceEvening: Number,
        chain_by_chain: Object
    }
);
const accountsWalletDescs = finux_network_db.model("accounts-wallet-descs", accountsWalletDescsSchema, "accounts-wallet-descs");

const usersDescsSchema = mongoose.Schema(
    {
        username: String,
        queryableUsername: String,
        email: String,
        password: String,
        status: String,
        monetized: Boolean,
        verified: Boolean,
        accountType: String,
        oneTimeCode: Number,
        oneTimeCodeTimeStamp: Number,
        oneTimeCodeExpiresIn: Number,
        profilePicture: String,
        profileWallpaper: String,
        profileImageOptions: Array,
        bio: String,
        userInterests: Array,
        followingCount: Number,
        followersCount: Number,
        totalRewardAmount: Number,
        demonetized: Boolean,
        accountDeactivated: Boolean,
        accountDeleted: Boolean,
        inviteCode: String,
        watchlist: Array,
        walletSettings: String,
        isAuthenticated: Boolean,
        birthMonth: String,
        birthDate: Number,
        birthYear: Number,
        ipv4: Array,
        city: String,
        state: String,
        country: String,
        createdAt: Number,
        updatePasswordSession: String
    }
);
const usersDescs = finux_network_db.model("users-descs", usersDescsSchema, "users-descs");

const usersVerifiedRecordSchema = mongoose.Schema(
    {
        username: String,
        walletAddress: String,
        selectedChain: String,
        status: String,
        changeProcessed: Boolean,
        daysNotPaid: Number,
        subscriptionType: String,
        verificationStartDate: String,
        verificationNextPayDate: String,
        verificationTerminationDate: String
    }
);
const usersVerifiedRecord = finux_network_db.model("users-verified-record", usersVerifiedRecordSchema, "users-verified-record");

/* content db */
const commentsMainDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        postId: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        limit: Number,
        comment: String,
        photos: Array,
        videos: Array,
        language: String,
        translation: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);
const commentsMainDescs = content_db.model("comments-main-descs", commentsMainDescsSchema, "comments-main-descs");

const commentsSecondaryDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        postId: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        comment: String,
        photos: Array,
        videos: Array,
        mainCommentId: String,
        commentId: String,
        language: String,
        translation: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);
const commentsSecondaryDescs = content_db.model("comments-secondary-descs", commentsSecondaryDescsSchema, "comments-secondary-descs");

const newsCommentsMainDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        newsId: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        limit: Number,
        comment: String,
        photos: Array,
        videos: Array,
        language: String,
        translation: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);
const newsCommentsMainDescs = content_db.model("news-comments-main-descs", newsCommentsMainDescsSchema, "news-comments-main-descs");

const newsCommentsSecondaryDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        newsId: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        comment: String,
        photos: Array,
        videos: Array,
        language: String,
        translation: String,
        mainCommentId: String,
        commentId: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);
const newsCommentsSecondaryDescs = content_db.model("news-comments-secondary-descs", newsCommentsSecondaryDescsSchema, "news-comments-secondary-descs");

const postsDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        groupProfileImage: String,
        monetized: Boolean,
        verified: Boolean,
        title: String,
        post: String,
        language: String,
        translation: String,
        repostId: String,
        photos: Array,
        videos: Array,
        taggedAssets: Array,
        spam: Boolean,
        helpful: Boolean,
        postSubjects: Array,
        likes: Number,
        validatedLikes: Number,
        dislikes: Number,
        validatedDislikes: Number,
        views: Number,
        validatedViews: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        trendingScore: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        validTags: Array,
        timeStamp: Number
    }
);
const postsDescs = content_db.model("posts-descs", postsDescsSchema, "posts-descs");

/* market db */
const market_commentsMainDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        predictionId: String,
        predictionType: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        limit: Number,
        comment: String,
        photos: Array,
        videos: Array,
        language: String,
        translation: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);
const market_commentsMainDescs = market_db.model("comments-main-descs", market_commentsMainDescsSchema, "comments-main-descs");

const market_commentsSecondaryDescsSchema = mongoose.Schema(
    {
        username: String,
        profileImage: String,
        groupId: String,
        predictionId: String,
        predictionType: String,
        monetized: Boolean,
        verified: Boolean,
        index: Number,
        comment: String,
        photos: Array,
        videos: Array,
        mainCommentId: String,
        commentId: String,
        language: String,
        translation: String,
        likes: Number,
        dislikes: Number,
        views: Number,
        comments: Number,
        reposts: Number,
        shares: Number,
        confidenceScore: Number,
        userRewards: Number,
        communityRewards: Number,
        status: String,
        flair: Array,
        timeStamp: Number
    }
);
const market_commentsSecondaryDescs = market_db.model("comments-secondary-descs", market_commentsSecondaryDescsSchema, "comments-secondary-descs");

const ynMarketSchema = mongoose.Schema(
    {
        predictionId: String,
        predictiveImage: String,
        predictiveQuestion: String,
        creator: String,
        creatorAccountType: String,
        creatorWalletAddress: String,
        outcome: String, 
        outcomeImage: String,
        continous: Boolean,
        chains: Array,
        participantsTotal: Number,
        participantsYes: Number,
        participantsNo: Number,
        quantityYes: Number,
        quantityNo: Number,
        priceYes: Number,
        priceNo: Number,
        probabilityYes: Number,
        probabilityNo: Number,
        costFunction: Number,
        costFunctionDesc: Object,
        rules: String,
        status: String,
        resolved: Boolean,
        resolutionOutcome: String,
        createdTimestamp: Number,
        requestKey: String,
        endDate: Number,
        resolutionTimeStamp: Number
    }
);
const ynMarket = market_db.model("y-n-market", ynMarketSchema, "y-n-market");

/* Processes Handler */
const processId = "67e903f635ea001a5d48533e";
const usersSettingsProcessesSchema = mongoose.Schema(
    {
        settings: Boolean,
        verification: Boolean
    }
);
const usersSettingsProcesses = finux_network_db.model("users-settings-processes", usersSettingsProcessesSchema, "users-settings-processes");

const processVerifiedUsers = async () => {
    const isProcessRunningDesc = await usersSettingsProcesses.findById(processId);
    const isProcessRunning = isProcessRunningDesc["verification"];

    if(!isProcessRunning) {
        await usersSettingsProcesses.updateOne(
            {_id: processId},
            {$set: {verification: true}}
        );

        const userRecords_toProcess = await usersVerifiedRecord.find({changeProcessed: false});
        if(userRecords_toProcess.length > 0) {
            for(let i = 0; i < userRecords_toProcess.length; i++) {
                /* master */
                // 1. users index
                await usersIndex.updateOne(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                /* finux network */
                // 2. wallets descs
                await accountsWalletDescs.updateOne(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            accountDesignation: "validated"
                        }
                    }
                );

                // 3. users descs
                await usersDescs.updateOne(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active",
                            accountType: "validated"
                        }
                    }
                );

                /* content */
                // 5. comments main descs
                await commentsMainDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                // 6. comments secondary descs
                await commentsSecondaryDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                // 7. news comments main descs
                await newsCommentsMainDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                // 8. news comments secondary descs
                await newsCommentsSecondaryDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                // 9. posts descs
                await postsDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                /* market */
                // 10. market comments main descs
                await market_commentsMainDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                // 11. market comments secondary descs
                await market_commentsSecondaryDescs.updateMany(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            monetized: userRecords_toProcess[i]["status"] === "active",
                            verified: userRecords_toProcess[i]["status"] === "active"
                        }
                    }
                );

                // 12. y-n-market
                await ynMarket.updateMany(
                    {creator: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            creatorAccountType: userRecords_toProcess[i]["status"] === "active" ? "verified" : ""
                        }
                    }
                );

                /* back to finux network */
                // 4. users verified record
                await usersVerifiedRecord.updateOne(
                    {username: userRecords_toProcess[i]["username"]},
                    {
                        $set: {
                            changeProcessed: true
                        }
                    }
                );
            }
        }

        await usersSettingsProcesses.updateOne(
            {_id: processId},
            {$set: {verification: false}}
        );
    }
}

processVerifiedUsers().then(
    () => {process.exit();}
).catch(
    (error) => {console.log(error); process.exit();}
);