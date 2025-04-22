const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/holidays", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/stock-market-data/holidays`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/quick-descs", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/stock-market-data/quick-descs`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/description/:symbol", auth.verify, async (req, res) => 
    {
        try {
            const symbol = req.params.symbol;
            const result = await axios.put(`http://localhost:8801/api/stock-market-data/description/${symbol}`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/rankings", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/stock-market-data/rankings`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/watchlist", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/stock-market-data/watchlist`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/provided-recommendation", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body,
                "username": req.data.user
            };
            const result = await axios.put(`http://localhost:8801/api/stock-market-data/provided-recommendation`, body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;