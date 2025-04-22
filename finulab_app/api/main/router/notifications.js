const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/profile", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/notifications/profile`, 
                {
                    ...req.body,
                    "uniqueId": req.data.user
                }
            );
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/community", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/notifications/community`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/latest", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/notifications/latest`, 
                {
                    ...req.body,
                    "uniqueId": req.data.user
                }
            );
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/mark-as-read", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8800/api/content/notifications/mark-as-read`, 
                {
                    "uniqueId": req.data.user
                }
            );
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-mark-as-read", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8800/api/content/notifications/community-mark-as-read`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;