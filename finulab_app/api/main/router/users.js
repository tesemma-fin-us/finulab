const axios = require("axios");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const datefns = require("date-fns");
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const router = require("express").Router();

const auth = require("./auth");
const sessionsDesc = require("../models/sessions");
const jwt_accessSecret = require("../models/jwt-accessSecret");
const jwt_refreshSecret = require("../models/jwt-refreshSecret");

dotenv.config();

const birthMonthOptns = [
    "Jan", "Feb", "Mar",  
    "Apr", "May", "Jun",
    "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec"
];

router.put("/username-unique", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/username-unique`, {...req.body});
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/community-unique", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/community-unique`, {...req.body});
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);



router.post("/sign-up", auth.verify, async (req, res) => 
    {
        try {
            const cookie = req.cookies.sessionId;
            if(cookie === null || cookie === undefined || cookie.length === 0) {return res.clearCookie("sessionId").status(403).json({"status": "error"});}

            const now = new Date();
            const nowYear = datefns.getYear(now);
            const nowUnix = datefns.getUnixTime(now);

            const email = `${req.body.email}`;
            const username = `${req.body.username}`;
            const password = `${req.body.password}`;
            const birthMonth = `${req.body.birthMonth}`;
            const birthDate = Number(req.body.birthDate);
            const birthYear = Number(req.body.birthYear);
            
            if(
                username.toLowerCase() === "regex" 
                || username.toLowerCase() === "finu" 
                || username.toLowerCase() === "finulab" 
                || username.toLowerCase() === "finux"
                || username.toLowerCase() === "finuai"
                || username.toLowerCase() === "finudex"
                || username.toLowerCase() === "visitor"
            ) {return res.status(403).json({"status": "error"});}

            const passwordNumRegex = /[0-9]/g;
            const passwordCapRegex = /[A-Z]/g;
            const passwordSmllRegex = /[a-z]/g;
            const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

            if(!regexEmail.test(email)) {return res.status(200).json({"status": "error"});}
            if(!usernameRegex.test(username)) {return res.status(200).json({"status": "error"});}
            if(password.match(passwordNumRegex) === null) {return res.status(200).json({"status": "error"});}
            if(password.match(passwordCapRegex) === null) {return res.status(200).json({"status": "error"});}
            if(password.match(passwordSmllRegex) === null) {return res.status(200).json({"status": "error"});}

            if(password.length < 8) {return res.status(200).json({"status": "error"});}
            if(username.length < 3 || username.length > 20) {return res.status(200).json({"status": "error"});}
            
            if(isNaN(birthDate) || !isFinite(birthDate)) {return res.status(200).json({"status": "error"});}
            if(isNaN(birthYear) || !isFinite(birthYear)) {return res.status(200).json({"status": "error"});}

            if(nowYear - birthYear <= 13) {return res.status(200).json({"status": "error"});}
            if(!birthMonthOptns.includes(birthMonth)) {return res.status(200).json({"status": "error"});}
            if(!(Number.isInteger(birthDate) && birthDate >= 1 && birthDate <= 31)) {return res.status(200).json({"status": "error"});}

            const authCode = Math.floor(100000 + Math.random() * 900000);

            const mailgun = new Mailgun(formData);
            const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
            const mailgunMgCreated = await mg.messages.create('user-registration.finulab.com', 
                {
                    from: "Finulab <no_reply@user-registration.finulab.com>",
                    to: [email],
                    subject: `finulab: your one-time code is: ${authCode}`,
                    text: `welcome to finulab ${username} - your one-time registration code is: ${authCode}.`,
                    html: `<p>welcome to finulab ${username} - your one-time registration code is: ${authCode}.</p>`
                }
            );

            if(mailgunMgCreated.status === 200) {
                let ipv4, city, state, country;
                const jwt_session = jwt.decode(cookie).session["user"];
                await sessionsDesc.findOne(
                    {
                        uniqueId: jwt_session
                    }
                ).then(
                    async (sessionData) => {
                        if(!sessionData) {return res.clearCookie("sessionId").status(403).json({"status": "error"});}

                        if(sessionData) {
                            ipv4 = sessionData.ipv4;
                            city = sessionData.city;
                            state = sessionData.state;
                            country = sessionData.country;
                        }
                    }
                );

                const saveNewUserResult = await axios.post(`http://localhost:8900/api/users/sign-up`, 
                    {
                        "oneTimeCode": authCode,

                        "ipv4": ipv4,
                        "city": city,
                        "state": state,
                        "country": country,

                        "email": email,
                        "username": username,
                        "password": password,
                        "birthMonth": birthMonth.toLowerCase(),
                        "birthDate": birthDate,
                        "birthYear": birthYear
                    }
                );
                if(saveNewUserResult.data["status"] === "success") {
                    await sessionsDesc.updateOne(
                        {uniqueId: jwt_session}, {convertedUser: "true-new", affiliatedUsername: username}
                    );

                    const data = {"uniqueId": username};
                    const privateAccessKeyObject = await jwt_accessSecret.findOne({}).sort({timeStamp: 'desc'});
                    const privateRefreshKeyObject = await jwt_refreshSecret.findOne({}).sort({timeStamp: 'desc'});

                    const accessToken = await auth.generateAccessToken(data, privateAccessKeyObject['privateKey'], "10m");
                    const refreshToken = await auth.generateAccessToken(data, privateRefreshKeyObject['privateKey'], "32 days");

                    const newSession = new sessionsDesc(
                        {
                            ipv4: ipv4,
                            uniqueId: username,
                            lastVisit: nowUnix,
                            convertedUser: "n/a",
                            affiliatedUsername: "n/a",
                            attemptsToRecoverAccount: 0,
                            refreshToken: refreshToken,
                            city: city,
                            state: state,
                            country: country,
                            createdAt: nowUnix
                        }
                    );
                    await newSession.save();

                    return res.clearCookie("sessionId").cookie("sessionId", refreshToken, 
                        {
                            sameSite: 'strict', 
                            path: '/', 
                            expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000), 
                            httpOnly: true
                            //secure: true
                        }
                    ).json(
                        {
                            "status": "success",
                            "accessToken": accessToken
                        }
                    );
                } else {return res.status(200).json({"status": "error"});}
            } else {return res.status(200).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/sign-up-confirmation", auth.verify, async (req, res) =>
    {
        try {
            const code_auth = await axios.post(`http://localhost:8900/api/users/sign-up-confirmation`, 
                {
                    ...req.body,
                    "uniqueId": req.data.user
                }
            );
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/resend-code", auth.verify, async (req, res) =>
    {
        try {
            const code_auth = await axios.post(`http://localhost:8900/api/users/resend-code`, {"uniqueId": req.data.user});
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/update-resend-code", auth.verify, async (req, res) =>
    {
        try {
            const code_auth = await axios.post(`http://localhost:8900/api/users/update-resend-code`, 
                {
                    ...req.body,
                    "uniqueId": req.data.user
                }
            );
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/sign-up-finalization", auth.verify, async (req, res) => 
    {
        try {
            const bio = `${req.body.bio}`;
            const watchlist = req.body.watchlist;
            const profileImage = `${req.body.profileImage}`;
            const profileWallpaper = `${req.body.profileWallpaper}`;
            
            if(!Array.isArray(watchlist)) {return res.status(200).json({"status": "error"});}

            const finalizeDesc = await axios.post(`http://localhost:8900/api/users/sign-up-finalization`,
                {
                    "bio": bio,
                    "watchlist": watchlist,
                    "uniqueId": req.data.user,
                    "profileImage": profileImage,
                    "profileWallpaper": profileWallpaper
                }
            );

            if(finalizeDesc.data["status"] === "success") {
                const index_result = await axios.post(`http://localhost:8802/api/userDataFeed/add-to-index`, 
                    {
                        "bio": bio,
                        "uniqueId": req.data.user,
                        "profileImage": profileImage,
                        "profileWallpaper": profileWallpaper
                    }
                );
                
                return res.status(200).json({"status": "success", "data": finalizeDesc.data["data"]});
            } else {return res.status(200).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/forgot-login", auth.verify, async (req, res) => 
    {
        try {
            const code_auth = await axios.put(`http://localhost:8900/api/users/forgot-login`, 
                {
                    ...req.body
                }
            );
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/forgot-login-confirmation", auth.verify, async (req, res) => 
    {
        try {
            const code_auth = await axios.post(`http://localhost:8900/api/users/forgot-login-confirmation`, 
                {
                    ...req.body
                }
            );
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/forgot-login-finalization", auth.verify, async (req, res) => 
    {
        try {
            const code_auth = await axios.post(`http://localhost:8900/api/users/forgot-login-finalization`, 
                {
                    ...req.body
                }
            );
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/forgot-resend-code", auth.verify, async (req, res) => 
    {
        try {
            const code_auth = await axios.post(`http://localhost:8900/api/users/forgot-resend-code`, 
                {
                    ...req.body
                }
            );
            return res.status(200).json(code_auth.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/login", auth.verify, async (req, res) => 
    {
        try {
            const now = new Date(), nowUnix = datefns.getUnixTime(now);
            const result = await axios.put(`http://localhost:8900/api/users/login`, req.body);
            
            if(result.data["status"] === "success") {
                const data = {"uniqueId": result.data["data"]["username"]};
                const privateAccessKeyObject = await jwt_accessSecret.findOne({}).sort({timeStamp: 'desc'});
                const privateRefreshKeyObject = await jwt_refreshSecret.findOne({}).sort({timeStamp: 'desc'});

                const accessToken = await auth.generateAccessToken(data, privateAccessKeyObject['privateKey'], "10m");
                const refreshToken = await auth.generateAccessToken(data, privateRefreshKeyObject['privateKey'], "32 days");

                let proceed_wLogin = false;
                const cookie = req.cookies.sessionId;
                const jwt_session = jwt.decode(cookie).session["user"];
                await sessionsDesc.findOne(
                    {
                        uniqueId: jwt_session
                    }
                ).then(
                    async (sessionData) => {
                        if(!sessionData) {return res.clearCookie("sessionId").status(403).json({"status": "error"});}

                        if(sessionData) {
                            proceed_wLogin = true;

                            if(sessionData.convertedUser !== "n/a") {
                                await sessionsDesc.updateOne({uniqueId: jwt_session}, {convertedUser: "true-already", affiliatedUsername: `${req.body.username}`, lastVisit: nowUnix});
                            } else if(sessionData.convertedUser === "n/a") {
                                await sessionsDesc.updateOne({uniqueId: jwt_session}, {lastVisit: nowUnix});
                            }
                        }
                    }
                );

                if(proceed_wLogin) {
                    await sessionsDesc.findOne(
                        {
                            uniqueId: `${req.body.username}`
                        }
                    ).then(
                        async (sessionData) => {
                            if(!sessionData) {
                                const newSession = new sessionsDesc(
                                    {
                                        ipv4: result.data["data"]["ipv4"][result.data["data"]["ipv4"].length - 1],
                                        uniqueId: `${req.body.username}`,
                                        lastVisit: nowUnix,
                                        convertedUser: "n/a",
                                        affiliatedUsername: "n/a",
                                        attemptsToRecoverAccount: 0,
                                        refreshToken: refreshToken,
                                        city: result.data["data"]["city"],
                                        state: result.data["data"]["state"],
                                        country: result.data["data"]["country"],
                                        createdAt: nowUnix
                                    }
                                );
                                await newSession.save();
                            }
    
                            if(sessionData) {
                                await sessionsDesc.updateOne({uniqueId: `${req.body.username}`}, {lastVisit: nowUnix, refreshToken: refreshToken})
                            }
                        }
                    );

                    if(result.data["data"]["isAuthenticated"]) {
                        if(result.data["data"]["watchlist"].length === 0) {
                            return res.clearCookie("sessionId").cookie("sessionId", refreshToken, 
                                {
                                    sameSite: 'strict', 
                                    path: '/', 
                                    expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000), 
                                    httpOnly: true
                                    //secure: true
                                }
                            ).json(
                                {
                                    "accessToken": accessToken, 
                                    "status": "requires-full-setup", 
                                    "profile-image": result.data["data"]["profilePicture"], 
                                    "profile-wallpaper": result.data["data"]["profileWallpaper"],
                                    "bio": result.data["data"]["bio"],
                                    "email": result.data["data"]["email"]
                                }
                            );
                        } else {
                            return res.clearCookie("sessionId").cookie("sessionId", refreshToken, 
                                {
                                    sameSite: 'strict', 
                                    path: '/', 
                                    expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000), 
                                    httpOnly: true
                                    //secure: true
                                }
                            ).json(
                                {
                                    "status": "success",
                                    "accessToken": accessToken,  
                                    "profilePicture": result.data["data"]["profilePicture"], 
                                    "profileWallpaper": result.data["data"]["profileWallpaper"], 
                                    "moderatorStatus": result.data["moderatorStatus"],
                                    "walletAddress": result.data["walletAddress"],
                                    "interests": result.data["data"]["userInterests"],
                                    "watchlist": result.data["data"]["watchlist"],
                                    "monetized": result.data["data"]["monetized"],
                                    "verified": result.data["data"]["verified"],
                                    "verificationData": result.data["verificationData"],
                                    "createdAt": result.data["data"]["createdAt"]
                                }
                            );
                        }
                    } else if(!result.data["data"]["isAuthenticated"]) {
                        return res.clearCookie("sessionId").cookie("sessionId", refreshToken, 
                            {
                                sameSite: 'strict', 
                                path: '/', 
                                expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000),
                                httpOnly: true
                                //secure: true
                            }
                        ).json({"accessToken": accessToken, "status": "requires-validation", "email": result.data["data"]["email"]});
                    }
                }
            } else if(result.data["status"] === "error") {
                return res.status(200).json({"status": "error"});
            } else { return res.status(200).json({"status": "error"}); }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/logout", auth.verify, async (req, res) => 
    {
        try {
            const body = {"uniqueId": req.data.user};
            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(user_auth.data["data"]["isAuthenticated"]) {
                    const now = new Date(), nowUnix = datefns.getUnixTime(now);
                    
                    const sessionId = await auth.generateSessionId(5);
                    const data = {"uniqueId": String(user_auth.data["data"]["ipv4"][0]) + "-" + sessionId};

                    const privateAccessKeyObject = await jwt_accessSecret.findOne({}).sort({timeStamp: 'desc'});
                    const privateRefreshKeyObject = await jwt_refreshSecret.findOne({}).sort({timeStamp: 'desc'});

                    const accessToken = await auth.generateAccessToken(data, privateAccessKeyObject['privateKey'], "10m");
                    const refreshToken = await auth.generateAccessToken(data, privateRefreshKeyObject['privateKey'], "32 days");
                    
                    const newSession = new sessionsDesc(
                        {
                            ipv4: String(user_auth.data["data"]["ipv4"][0]),
                            uniqueId: data["uniqueId"],
                            lastVisit: nowUnix,
                            convertedUser: "false",
                            affiliatedUsername: "",
                            attemptsToRecoverAccount: 0,
                            refreshToken: refreshToken,
                            city: user_auth.data["data"]["city"],
                            state: user_auth.data["data"]["state"],
                            country: user_auth.data["data"]["country"],
                            createdAt: nowUnix
                        }
                    );
                    await newSession.save();

                    return res.clearCookie("sessionId").cookie("sessionId", refreshToken, 
                        {
                            sameSite: 'strict', 
                            path: '/', 
                            expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000),
                            httpOnly: true
                            //secure: true
                        }
                    ).json({"status": "success", "accessToken": accessToken});
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

router.put("/pull-mod-stat", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/pull-mod-stat`, 
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

router.put("/stats-desc", auth.verify, async (req, res) => 
    {
        try {
            if(req.body.username === req.data.user) {
                const result = await axios.put(`http://localhost:8900/api/users/stats-desc`, req.body);
                return res.status(200).json(result.data);
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/own-desc", auth.verify, async (req, res) => 
    {
        try {
            if(req.body.username === req.data.user) {
                const result = await axios.put(`http://localhost:8900/api/users/own-desc`, req.body);
                return res.status(200).json(result.data);
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/profile-desc`, 
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

router.put("/own-community-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/own-community-desc`, 
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

router.put("/general-community-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/general-community-desc`, 
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

router.put("/upload", auth.verify, async (req, res) => 
    {
        try {
            const upload_uri = await auth.generateProfileS3UploadUrl(req.data.user);
                    
            return res.status(200).json({"status": "success", "data": upload_uri});
            /*
            const body = {"uniqueId": req.data.user};
            const user_auth = await axios.put(`http://localhost:8900/api/users/user-authentication`, body);
            if(user_auth.data["status"] === "success") {
                if(
                    user_auth.data["data"]["isAuthenticated"] 
                    && !user_auth.data["data"]["accountDeleted"]
                    && !user_auth.data["data"]["accountDeactivated"]
                ) {
                    const upload_uri = await auth.generateProfileS3UploadUrl(req.data.user);
                    
                    return res.status(200).json({"status": "success", "data": upload_uri});
                } else {
                    return res.status(200).json({"status": "error"});
                }
            } else {
                return res.status(200).json({"status": "error"});
            }
            */
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/own-update-settings", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8900/api/users/own-update-settings`, 
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

router.post("/community-update-settings", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8900/api/users/community-update-settings`, 
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

router.post("/community-update-rules", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8900/api/users/community-update-rules`, 
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

router.post("/community-update-privileges", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8900/api/users/community-update-privileges`, 
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

router.post("/community-add-mod", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8900/api/users/community-add-mod`, 
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

router.post("/community-remove-mod", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.post(`http://localhost:8900/api/users/community-remove-mod`, 
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

router.put("/communities-joined", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/communities-joined`, {"uniqueId": req.data.user});
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_communities-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/p_communities-desc`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_community-members", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/p_community-members`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_following-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/p_following-desc`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_followers-desc", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/p_followers-desc`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/following", auth.verify, async (req, res) => 
    {
        try {
            const result = await axios.put(`http://localhost:8900/api/users/following`, req.body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/follow-user", auth.verify, async (req, res) => 
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
                    const result = await axios.post(`http://localhost:8900/api/users/follow-user`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "byProfileImage": user_auth.data["data"]["profilePicture"] 
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

router.post("/join-community", auth.verify, async (req, res) => 
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
                    const result = await axios.post(`http://localhost:8900/api/users/join-community`, 
                        {
                            ...req.body,
                            "uniqueId": req.data.user,
                            "byProfileImage": user_auth.data["data"]["profilePicture"] 
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

router.post("/unfollow-user", auth.verify, async (req, res) => 
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
                    const result = await axios.post(`http://localhost:8900/api/users/unfollow-user`, 
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

router.post("/leave-community", auth.verify, async (req, res) => 
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
                    const result = await axios.post(`http://localhost:8900/api/users/leave-community`, 
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

router.post("/modify-watchlist", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.post(`http://localhost:8900/api/users/modify-watchlist`, body);
            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-recommendation", auth.verify, async (req, res) => 
    {
        try {
            const body = {
                ...req.body, 
                "uniqueId": req.data.user
            };
            
            const result = await axios.post(`http://localhost:8900/api/users/modify-recommendation`, body);
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
            const result = await axios.put(`http://localhost:8802/api/userDataFeed/search?q=${q}`);

            return res.status(200).json(result.data);
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;