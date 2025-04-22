const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/config", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/config`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/categories", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/categories`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/profile`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/engaged", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/engaged`, 
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

router.put("/update-stat", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/update-stat`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/recommended", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/recommended`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/prediction", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/prediction`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/category-predictions", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/category-predictions`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/search/", auth.verify, async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;
            const result = await axios.put(`http://localhost:8901/api/market/search?q=${q}`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/specific-holdings", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.put(`http://localhost:8900/api/users/market-specific-holdings`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/live-holdings", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const result = await axios.put(`http://localhost:8901/api/market/live-holdings`, body);
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

router.put("/closed-holdings", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const result = await axios.put(`http://localhost:8901/api/market/closed-holdings`, body);
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

router.put("/price-history", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/price-history`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/probability-history", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/probability-history`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/pull-activity", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const result = await axios.put(`http://localhost:8901/api/market/pull-activity`, 
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

router.put("/pull-history", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const result = await axios.put(`http://localhost:8901/api/market/pull-history`, 
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

router.put("/prediction-engagements", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.put(`http://localhost:8900/api/users/prediction-engagements`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/prediction-engage", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };

            const result = await axios.post(`http://localhost:8900/api/users/prediction-engage`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/comments`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/comments-expand`, req.body);
            
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-specific-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/comments-specific-expand`, req.body);
            
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
                    
                    const result = await axios.put(`http://localhost:8901/api/market/comments-engagements`, 
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
                    
                    const result = await axios.post(`http://localhost:8901/api/market/comments-engage`, 
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
                    
                    const result = await axios.post(`http://localhost:8901/api/market/create-main-comment`, 
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
                    
                    const result = await axios.post(`http://localhost:8901/api/market/create-secondary-comment`, 
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
                    
                    const result = await axios.post(`http://localhost:8901/api/market/delete-comment`, 
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

router.put("/market-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/market-desc`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/search-markets/", auth.verify, async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;
            const result = await axios.put(`http://localhost:8901/api/market/search-markets?q=${q}`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/resolve-market-selection", auth.verify, async (req, res) =>
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/resolve-market-selection`, req.body);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/market-activity-history", auth.verify, async (req, res) =>
    {
        try {
            const type = `${req.body.type}`;
            const result = await axios.put(`http://localhost:8901/api/market/market-activity-history`, req.body);

            if(result.data["status"] === "success") {
                const body = {"uniqueUsernames": [...result.data["uniqueUsernames"]]};
                const users_quickDesc = await axios.put(`http://localhost:8900/api/users/quick-desc`, body);

                if(users_quickDesc.data["status"] === "success") {
                    if(type === "primary") {
                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": result.data["data"],
                                "dataCount": result.data["dataCount"],
                                "activeUsers": users_quickDesc.data["data"]
                            }
                        );
                    } else if(type === "secondary") {
                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": result.data["data"],
                                "activeUsers": users_quickDesc.data["data"]
                            }
                        );
                    }
                } else {
                    if(type === "primary") {
                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": result.data["data"],
                                "dataCount": result.data["dataCount"],
                                "activeUsers": []
                            }
                        );
                    } else if(type === "secondary") {
                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": result.data["data"],
                                "activeUsers": []
                            }
                        );
                    }
                }
            } else {
                return res.status(200).json(result.data);
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/market-top-holders", auth.verify, async (req, res) =>
    {
        try {
            const result = await axios.put(`http://localhost:8901/api/market/market-top-holders`, req.body);

            if(result.data["status"] === "success") {
                const body = {"uniqueUsernames": [...result.data["uniqueUsernames"]]};
                const users_quickDesc = await axios.put(`http://localhost:8900/api/users/quick-desc`, body);

                if(users_quickDesc.data["status"] === "success") {
                    return res.status(200).json(
                        {
                            "status": "success",
                            "data": {
                                "yes": result.data["data"]["yes"],
                                "no": result.data["data"]["no"],
                                "holders": users_quickDesc.data["data"]
                            }
                        }
                    );
                } else {
                    return res.status(200).json(
                        {
                            "status": "success",
                            "data": {
                                "yes": result.data["data"]["yes"],
                                "no": result.data["data"]["no"],
                                "holders": []
                            }
                        }
                    );
                }
            } else {
                return res.status(200).json(result.data);
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/create-prediction", auth.verify, async (req, res) =>
    {
        try {
            const body = {"uniqueId": req.data.user};
            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            
            if(user_auth.data["status"] === "success") {
                if(
                    user_auth.data["data"]["isAuthenticated"] 
                    && user_auth.data["data"]["verified"]
                    && !user_auth.data["data"]["accountDeleted"]
                    && !user_auth.data["data"]["accountDeactivated"]
                ) {
                    const walletSettings = user_auth.data["data"]["walletSettings"].split(" ");
                    const fin_us_address = walletSettings[walletSettings.length - 2];

                    let availableBalance = 0;
                    const finux_address = `k:${fin_us_address.slice(2, fin_us_address.length)}`;
                    const chainBalance = await axios.put(`http://localhost:8900/api/wallet/specific-chain-balance`, {"chainId": `${req.body.chainId}`, "uniqueId": req.data.user, "accountId": finux_address});
                    if(chainBalance.data["status"] === "success") {
                        if(isNaN(chainBalance.data["data"])) {
                            return res.status(200).json({"status": "error"});
                        } else {
                            availableBalance = chainBalance.data["data"];
                        }
                    } else {
                        return res.status(200).json({"status": "error"});
                    }

                    const pendedBalanceDesc = await axios.put(`http://localhost:8901/api/market/chain-pended-balance`, {"uniqueId": req.data.user, "chainId": `${req.body.chainId}`});
                    const pendedBalance = Number(pendedBalanceDesc.data["data"]);

                    const userBalance = availableBalance - pendedBalance;
                    
                    const result = await axios.post(`http://localhost:8901/api/market/create-prediction`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "walletAddress": finux_address,
                            "availableBalance": userBalance,
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

router.post("/prediction-decision", auth.verify, async (req, res) =>
    {
        try {
            const result = await axios.post(`http://localhost:8901/api/market/prediction-decision`, 
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

router.post("/tx-finalize", auth.verify, async (req, res) =>
    {
        try {
            const body = {"uniqueId": req.data.user};
            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const walletSettings = user_auth.data["data"]["walletSettings"].split(" ");
                    const fin_us_address = walletSettings[walletSettings.length - 2];

                    let availableBalance = 0;
                    const finux_address = `k:${fin_us_address.slice(2, fin_us_address.length)}`;
                    const chainBalance = await axios.put(`http://localhost:8900/api/wallet/specific-chain-balance`, {"chainId": `${req.body.chainId}`, "uniqueId": req.data.user, "accountId": finux_address});
                    if(chainBalance.data["status"] === "success") {
                        if(isNaN(chainBalance.data["data"])) {
                            return res.status(200).json({"status": "error"});
                        } else {
                            availableBalance = chainBalance.data["data"];
                        }
                    } else {
                        return res.status(200).json({"status": "error"});
                    }

                    const pendedBalanceDesc = await axios.put(`http://localhost:8901/api/market/chain-pended-balance`, {"uniqueId": req.data.user, "chainId": `${req.body.chainId}`});
                    const pendedBalance = Number(pendedBalanceDesc.data["data"]);

                    const userBalance = availableBalance - pendedBalance;

                    const result = await axios.post(`http://localhost:8901/api/market/tx-finalize`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "walletAddress": finux_address,
                            "availableBalance": userBalance
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

router.post("/prediction-resolve", auth.verify, async (req, res) =>
    {
        try {
            const result = await axios.post(`http://localhost:8901/api/market/prediction-resolve`, 
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

module.exports = router;