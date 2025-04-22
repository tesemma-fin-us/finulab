const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/recommended", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/communities/recommended`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/create-community", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};
            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(
                    user_auth.data["data"]["isAuthenticated"] 
                    && !user_auth.data["data"]["accountDeleted"]
                    && !user_auth.data["data"]["accountDeactivated"]
                ) {
                    const result = await axios.post(`http://localhost:8900/api/communities/create-community`, 
                        {
                            "uniqueId": req.data.user,
                            ...req.body
                        }
                    );
            
                    return res.status(200).json(result.data);
                } else {
                    return res.status(200).json({"status": "error"});
                }
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;