const router = require("express").Router();

const yn_predictionsIndex = require("../models/yn-predictions-index");

router.put("/search/", async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;

            const queryResults = await yn_predictionsIndex.aggregate(
                [
                    {
                        $search: {
                            index: "yn_predictions-search-index",
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
                            _id: 1
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