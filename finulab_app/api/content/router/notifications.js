const datefns = require("date-fns");
const router = require("express").Router();
const notificationsDescs = require("../models/notifications-descs");

router.put("/profile", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const p_ninclude = req.body.p_ninclude;
            const uniqueId = `${req.body.uniqueId}`;

            if(!Array.isArray(p_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await notificationsDescs.countDocuments({target: uniqueId});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const data = await notificationsDescs.find(
                        {
                            target: uniqueId
                        }
                    ).sort({timeStamp: -1}).limit(10);

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const data = await notificationsDescs.find(
                    {
                        _id: {$nin: p_ninclude},
                        target: uniqueId
                    }
                ).sort({timeStamp: -1}).limit(10);

                return res.status(200).json({"status": "success", "data": data});
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
            const p_ninclude = req.body.p_ninclude;
            const community = `${req.body.community}`;

            if(!Array.isArray(p_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await notificationsDescs.countDocuments({target: community});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const data = await notificationsDescs.find(
                        {
                            target: community
                        }
                    ).sort({timeStamp: -1}).limit(10);

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const data = await notificationsDescs.find(
                    {
                        _id: {$nin: p_ninclude},
                        target: community
                    }
                ).sort({timeStamp: -1}).limit(10);

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/latest", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const communitiesInBetween = req.body.communities;

            if(!Array.isArray(communitiesInBetween)) {return res.status(200).json({"status": "error"});}

            let communities = [];
            if(communitiesInBetween.length > 0) {
                for(let i = 0; i < communitiesInBetween.length; i++) {
                    communities.push(
                        `${communitiesInBetween[i]}`
                    );
                }
            }

            const unread = await notificationsDescs.find(
                {
                    target: uniqueId,
                    read: false
                }
            ).sort({timeStamp: -1}).limit(10);

            let communitiesUnread = {};
            if(communities.length > 0) {
                for(let j = 0; j < communities.length; j++) {
                    const f_communityPush = await notificationsDescs.find(
                        {
                            target: communities[j],
                            read: false
                        }
                    ).sort({timeStamp: -1}).limit(10);

                    communitiesUnread[communities[j]] = f_communityPush;
                }
            }

            return res.status(200).json({"status": "success", "data": unread, "communities": communitiesUnread})
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/mark-as-read", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await notificationsDescs.updateMany(
                {target: uniqueId},
                {$set: {read: true}}
            );
            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-mark-as-read", async (req, res) => 
    {
        try {
            const community = `${req.body.community}`;

            await notificationsDescs.updateMany(
                {target: community},
                {$set: {read: true}}
            );
            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/send-notification", async (req, res) => 
    {
        try {
            const by = `${req.body.by}`;
            const link = `${req.body.link}`;
            const type = `${req.body.type}`;
            const target = `${req.body.target}`;
            const message = `${req.body.message}`;
            const byProfileImage = `${req.body.byProfileImage}`;
            const secondaryMessage = `${req.body.secondaryMessage}`;
            if(!(type === "payment" || type === "network" || type === "engagement")) {return res.status(200).json({"status": "error"});}

            const notificationsCount = await notificationsDescs.countDocuments({target: target});
            if(notificationsCount > 40) {
                const notificationsToDelete = await notificationsDescs.find(
                    {
                        target: target
                    }
                ).sort({timeStamp: 1}).limit(notificationsCount - 40);

                let deleteIds = [];
                for(let i = 0; i < notificationsToDelete.length; i++) {
                    deleteIds.push(notificationsToDelete[i]["_id"]);
                }

                await notificationsDescs.deleteMany(
                    {
                        _id: {$in: deleteIds}
                    }
                );
            }
            
            const now = new Date(), nowUnix = datefns.getUnixTime(now);
            const newNotification = new notificationsDescs(
                {
                    by: by,
                    target: target,
                    byProfileImage: byProfileImage,
                    type: type,
                    message: message,
                    secondaryMessage: secondaryMessage,
                    link: link,
                    read: false,
                    timeStamp: nowUnix
                }
            );
            await newNotification.save();

            return res.status(200).json({"status": "error"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;