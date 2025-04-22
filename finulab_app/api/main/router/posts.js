const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/for-you", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/for-you`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/profile`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/community", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/community`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/engaged", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/engaged`, 
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

router.put("/following", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/following`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/asset-posts", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/asset-posts`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/specific-post", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/specific-post`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/post-engagements", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.put(`http://localhost:8900/api/users/post-engagements`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/post-engage", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };

            const result = await axios.post(`http://localhost:8900/api/users/post-engage`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/upload", auth.verify, async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const body = {"uniqueId": req.data.user};
            if(!(type === "image" || type === "video")) {return res.status(200).json({"status": "error"});}

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(
                    user_auth.data["data"]["isAuthenticated"] 
                    && !user_auth.data["data"]["accountDeleted"]
                    && !user_auth.data["data"]["accountDeactivated"]
                ) {
                    const upload_uri = await auth.generatePostS3UploadUrl(req.data.user, type);
                    
                    return res.status(200).json({"status": "success", "data": upload_uri});
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

router.put("/comments", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/comments`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/comments-expand`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-specific-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8800/api/content/posts/comments-specific-expand`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-engagements", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.put(`http://localhost:8900/api/users/comments-engagements`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/comments-engage", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };

            const result = await axios.post(`http://localhost:8900/api/users/comments-engage`, body);
            return res.status(200).json(result.data);
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/posts/create-main-comment`, 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/posts/create-secondary-comment`, 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/posts/delete-comment`, 
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

router.post("/create-post", auth.verify, async (req, res) => 
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
                    
                    const result = await axios.post(`http://localhost:8800/api/content/posts/create-post`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "verified": user_auth.data["data"]["verified"],
                            "monetized": user_auth.data["data"]["monetized"],
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

module.exports = router;