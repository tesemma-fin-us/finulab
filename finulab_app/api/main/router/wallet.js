const axios = require("axios");
const router = require("express").Router();

const auth = require("./auth");

router.put("/pending-balance", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const result = await axios.put(`http://localhost:8900/api/wallet/pending-balance`, body);
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


router.put("/chain-balance", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/wallet/chain-balance`, 
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

router.put("/refresh-balance", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/wallet/refresh-balance`, 
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

router.put("/tx-history", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/wallet/tx-history`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/tx-history-expand", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/wallet/tx-history-expand`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/transfer-finux", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    let availableBalance = 0;
                    const chainBalance = await axios.put(`http://localhost:8900/api/wallet/specific-chain-balance`, {"chainId": `${req.body.fromChain}`, "uniqueId": req.data.user, "accountId": `${req.body.accountId}`});
                    if(chainBalance.data["status"] === "success") {
                        if(isNaN(chainBalance.data["data"])) {
                            return res.status(200).json({"status": "error"});
                        } else {
                            availableBalance = chainBalance.data["data"];
                            const result = await axios.post(`http://localhost:8900/api/wallet/transfer-finux`, 
                                {
                                    ...req.body,
                                    "uniqueId": req.data.user,
                                    "availableBalance": availableBalance
                                }
                            );
                            return res.status(200).json(result.data);
                        }
                    } else {
                        return res.status(200).json({"status": "error"});
                    }
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

router.post("/privileged-transfer-finux", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const result = await axios.post(`http://localhost:8900/api/wallet/privileged-transfer-finux`, 
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

router.put("/poll-tx", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/wallet/poll-tx`, {...req.body});
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/get-verified", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};

            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    let availableBalance = 0;
                    const chainBalance = await axios.put(`http://localhost:8900/api/wallet/specific-chain-balance`, {"chainId": `${req.body.fromChain}`, "uniqueId": req.data.user, "accountId": `${req.body.accountId}`});
                    if(chainBalance.data["status"] === "success") {
                        if(isNaN(chainBalance.data["data"])) {
                            return res.status(200).json({"status": "error"});
                        } else {
                            const finuxQuote = await axios.put(`http://localhost:8801/api/crypto-market-data/finux-quote`);

                            if(finuxQuote.data["status"] === "success") {
                                const finuxOpen = finuxQuote.data["data"]["open"];
                                const finuxClose = finuxQuote.data["data"]["close"];

                                if(isNaN(finuxOpen) || isNaN(finuxClose)) {
                                    return res.status(200).json({"status": "error"});
                                } else {
                                    availableBalance = chainBalance.data["data"];
                                    const result = await axios.post(`http://localhost:8900/api/wallet/get-verified`, 
                                        {
                                            ...req.body,
                                            "uniqueId": req.data.user,
                                            "availableBalance": availableBalance,
                                            "finuxOpen": finuxOpen,
                                            "finuxClose": finuxClose
                                        }
                                    );
                                    return res.status(200).json(result.data);
                                }
                            } else {return res.status(200).json({"status": "error"});}
                        }
                    } else {
                        return res.status(200).json({"status": "error"});
                    }
                } else {
                    return res.status(200).json({"status": "error"});
                }
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            console.log(error);
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;