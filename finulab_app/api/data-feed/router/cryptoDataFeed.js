const router = require("express").Router();

const cryptosIndex = require("../models/cryptos-index");

router.put("/search/", async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;

            const queryResults = await cryptosIndex.aggregate(
                [
                    {
                        $search: {
                            index: "cryptos-search-index",
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
                            symbol: 1,
                            name: 1,
                            description: 1,
                            profileImage: 1
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

module.exports = router;