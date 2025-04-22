const axios = require("axios");
const datefns = require("date-fns");
const router = require("express").Router();

const communitiesDescs = require("../models/communities-descs");
const communitiesJoinedDescs = require("../models/communities-joined-descs");
const communitiesModeratorsList = require("../models/communities-moderators-list");

router.put("/recommended", async (req, res) => 
    {
        try {
            const limit = req.body.limit;
            if(isNaN(limit)) {return res.status(200).json({"status": "error"});}

            if(Array.isArray(req.body.interests)) {
                if(req.body.interests.length === 0) {
                    const communities = await communitiesDescs.find(
                        {
                            status: "active",
                            communityType: "public", 
                            profilePicture: {$ne: ""},
                            bio: {$ne: ""}
                        }
                    ).sort({todayPostCount: -1}).limit(limit).select(`communityName profilePicture bio membersCount -_id`).exec();

                    return res.status(200).json({"status": "success", "data": communities.sort((a, b) => (b.membersCount - a.membersCount))});
                } else {
                    const communitiesByInterest = await communitiesDescs.find(
                        {
                            status: "active",
                            communityType: "public",
                            profilePicture: {$ne: ""},
                            bio: {$ne: ""},
                            communityInterests: {$in: req.body.interests}
                        }
                    ).sort({todayPostCount: -1}).limit(limit).select(`communityName profilePicture bio membersCount -_id`).exec();

                    if(communitiesByInterest.length === limit) {
                        return res.status(200).json({"status": "success", "data": communitiesByInterest.sort((a, b) => (b.membersCount - a.membersCount))});
                    } else {
                        const communitiesByPostCount = await communitiesDescs.find(
                            {
                                status: "active",
                                communityType: "public",
                                profilePicture: {$ne: ""},
                                bio: {$ne: ""}
                            }
                        ).sort({todayPostCount: -1}).limit(limit - communitiesByInterest.length).select(`communityName profilePicture bio membersCount -_id`).exec();
                        
                        return res.status(200).json({"status": "success", "data": [...communitiesByInterest].concat(communitiesByPostCount).sort((a, b) => (b.membersCount - a.membersCount))});
                    }
                }
            } else {return res.status(200).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/create-community", async (req, res) => 
    {
        try {
            const bio = `${req.body.bio}`;
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            const communityName = `${req.body.communityName}`;
            const profileWallpaper = `${req.body.profileWallpaper}`;

            if(bio === "") {return res.status(200).json({"status": "error"});}
            if(bio.length > 280) {return res.status(200).json({"status": "error"});}
            if(communityName === "") {return res.status(200).json({"status": "error"});}
            if(!(communityName.slice(0, 3) === "f:-")) {return res.status(200).json({"status": "error"});}
            if(profileImage === "" || profileWallpaper === "") {return res.status(200).json({"status": "error"});}

            const communityNameFiltered = `${communityName.slice(3)}`;
            if(communityNameFiltered.length < 3 || communityNameFiltered.length > 20) {return res.status(200).json({"status": "error"});}
            
            await communitiesDescs.findOne(
                {
                    communityName: communityName
                }
            ).then(
                async(communityData) => {
                    if(communityData) {return res.status(200).json({"status": "error"});}

                    if(!communityData) {
                        const now = new Date();
                        const nowUnix = datefns.getUnixTime(now);

                        const newCommunity = new communitiesDescs(
                            {
                                communityName: communityName,
                                queryableName: communityName.toLowerCase(),
                                creator: uniqueId,
                                status: "active",
                                communityType: "public",
                                profilePicture: profileImage,
                                profileImageOptions: [],
                                profileWallpaper: profileWallpaper,
                                bio: bio,
                                rules: [],
                                watchlist: [],
                                communityInterests: [],
                                todayPostCount: 0,
                                moderators: [uniqueId],
                                moderatorsPercentages: [
                                    {"username": uniqueId, "ownership": 1}
                                ],
                                moderatorsPrivileges: [
                                    {
                                        "username": uniqueId, 
                                        "privileges": [
                                            "add-or-remove-moderator", "add-or-ban-users", 
                                            "remove-post", "remove-comment", "determine-moderators-reward-percentage"
                                        ]
                                    }
                                ],
                                membersCount: 1,
                                aggregateBalance: 0,
                                pendingBalanceMorning: 0,
                                pendingBalanceEvening: 0,
                                createdAt: nowUnix
                            }
                        );
                        await newCommunity.save();

                        const newMember = new communitiesJoinedDescs(
                            {
                                username: uniqueId,
                                joined: communityName,
                                response: "accepted",
                                timeStamp: nowUnix
                            }
                        );
                        await newMember.save();

                        const newModerator = new communitiesModeratorsList(
                            {
                                username: uniqueId,
                                community: communityName,
                                status: `active`,
                                type: `superMod`,
                                timeStamp: nowUnix
                            }
                        );
                        await newModerator.save();

                        await axios.post(`http://localhost:8802/api/userDataFeed/community-index`, 
                            {
                                "bio": bio,
                                "profileImage": profileImage,
                                "communityName": communityName,
                                "profileWallpaper": profileWallpaper
                            }
                        );
                        
                        return res.status(200).json({"status": "success"});
                    }
                } 
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;