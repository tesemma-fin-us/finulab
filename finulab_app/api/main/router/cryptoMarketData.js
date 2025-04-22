const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/quick-descs", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/quick-descs`, req.body);

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
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/description/${symbol}`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/rankings", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/rankings`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/watchlist", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/watchlist`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/price-history", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/price-history`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/quote", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/quote`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/historical", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8801/api/crypto-market-data/historical`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;