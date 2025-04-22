const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/search/", auth.verify, async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;
            const result = await axios.put(`http://localhost:8802/api/stockDataFeed/search?q=${q}`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/price-history", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8802/api/stockDataFeed/price-history`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/quote", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8802/api/stockDataFeed/quote`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;