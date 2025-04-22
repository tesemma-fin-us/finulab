const datefns = require("date-fns");
const router = require("express").Router();

const usersIndex = require("../models/users-index");
const communitiesIndex = require("../models/communities-index");

router.put("/search/", async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;

            const queryResults = await usersIndex.aggregate(
                [
                    {
                        $search: {
                            index: "users-search-index",
                            text: {
                                query: q,
                                path: {
                                    wildcard: "*"
                                }
                            }
                      }
                    }, 
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            profilePicture: 1,
                            verified: 1
                        }
                    }, {$limit: 10}
                ]
            );

            return res.status(200).json({"status": "success", "data": queryResults});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/add-to-index", async (req, res) => 
    {
        try {
            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);

            const bio = `${req.body.bio}`;
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            const profileWallpaper = `${req.body.profileWallpaper}`;

            const newUserIndex = new usersIndex(
                {
                    username: uniqueId,
                    usernameEmbedding: [],
                    bio: bio,
                    bioEmbedding: [],
                    profilePicture: profileImage,
                    profileWallpaper: profileWallpaper,
                    monetized: false,
                    verified: false,
                    accountType: "",
                    createdAt: nowUnix
                }
            );
            await newUserIndex.save();

            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-index", async (req, res) => 
    {
        try {
            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);

            const bio = `${req.body.bio}`;
            const profileImage = `${req.body.profileImage}`;
            const communityName = `${req.body.communityName}`;
            const profileWallpaper = `${req.body.profileWallpaper}`;

            const newCommunityIndex = new communitiesIndex(
                {
                    communityName: communityName,
                    communityNameEmbedding: [],
                    communityType: "public",
                    profilePicture: profileImage,
                    profileWallpaper: profileWallpaper,
                    bio: bio,
                    bioEmbedding: [],
                    createdAt: nowUnix
                }
            );
            await newCommunityIndex.save();

            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;