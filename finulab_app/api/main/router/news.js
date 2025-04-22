const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/assets/:asset", auth.verify, async (req, res) => 
    {
        try {
            const asset = req.params.asset;
            const result = await axios.put(`http://localhost:8800/api/content/news/assets/${asset}`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/for-you", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/news/for-you`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/specific-news", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/news/specific-news`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/news-engagements", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.put(`http://localhost:8900/api/users/news-engagements`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/news-engage", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };

            const result = await axios.post(`http://localhost:8900/api/users/news-engage`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/news/comments`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/news/comments-expand`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-specific-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/news/comments-specific-expand`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-engagements", auth.verify, async (req, res) => 
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
                    
                    const result = await axios.put(`http://localhost:8800/api/content/news/comments-engagements`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user
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

router.post("/comments-engage", auth.verify, async (req, res) => 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/news/comments-engage`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "accountType": user_auth.data["data"]["accountType"],
                            "profileImage": user_auth.data["data"]["profilePicture"]
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

router.post("/create-main-comment", auth.verify, async (req, res) => 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/news/create-main-comment`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "verified": user_auth.data["data"]["verified"],
                            "monetized": user_auth.data["data"]["monetized"],
                            "profileImage": user_auth.data["data"]["profilePicture"]
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

router.post("/create-secondary-comment", auth.verify, async (req, res) => 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/news/create-secondary-comment`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "verified": user_auth.data["data"]["verified"],
                            "monetized": user_auth.data["data"]["monetized"],
                            "profileImage": user_auth.data["data"]["profilePicture"]
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

router.post("/delete-comment", auth.verify, async (req, res) => 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/news/delete-comment`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user
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