const axios = require("axios");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const datefns = require("date-fns");
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const pact = require("pact-lang-api");
const cryptoJS = require("crypto-js");
const datefns_tz = require("date-fns-tz");
const router = require("express").Router();

const usersDescs = require("../models/users-descs");
const followingDescs = require("../models/following-descs");
const communitiesDescs = require("../models/communities-descs");
const usersVerifiedRecord = require("../models/users-verified-record");
const usersSettingsUpdate = require("../models/users-settings-update");
const accountsWalletDescs = require("../models/accounts-wallet-descs");
const communitiesJoinedDescs = require("../models/communities-joined-descs");
const communitiesModeratorsList = require("../models/communities-moderators-list");

dotenv.config();
const authorizedReviewers = ["tesemma.fin-us", "Rollwithdawinners", "Yanniyoh"];

const determinePayoutCategory = () => {
    const now = new Date();
    const nowUnix = datefns.getUnixTime(now);
    const nowInEST = datefns_tz.toZonedTime(now, 'America/New_York');

    const todayEST = new Date(nowInEST);
    todayEST.setHours(0, 0, 0, 0);
    const todayUnix = datefns.getUnixTime(datefns_tz.fromZonedTime(todayEST, 'America/New_York'));

    const morningUnixCutoff = todayUnix + (6 * 60 * 60);
    const eveningUnixCutoff = todayUnix + (18 * 60 * 60);

    if(nowUnix <= morningUnixCutoff) {
        return "morning";
    } else if(nowUnix > morningUnixCutoff && nowUnix <= eveningUnixCutoff) {
        return "evening";
    } else if(nowUnix > eveningUnixCutoff) {
        return "morning";
    }
};

router.put("/username-unique", async (req, res) => 
    {
        try {
            const queryableUsername = `${req.body.queryableUsername}`;

            await usersDescs.findOne(
                {
                    queryableUsername: queryableUsername
                }
            ).then(
                (userData) => {
                    if(!userData) {return res.status(200).json({"status": "success", "data": true});}
                    if(userData) {return res.status(200).json({"status": "success", "data": false});}
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/community-unique", async (req, res) => 
    {
        try {
            const queryableName = `${req.body.queryableName}`;

            await communitiesDescs.findOne(
                {
                    queryableName: queryableName
                }
            ).then(
                (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "success", "data": true});}
                    if(communityData) {return res.status(200).json({"status": "success", "data": false});}
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/account-status", async (req, res) => 
    {
        try {

        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/sign-up", async (req, res) => 
    {
        try {
            const now = new Date();
            const oneTimeCode = req.body.oneTimeCode;
            const oneTimeCodeTimeStamp = datefns.getUnixTime(now);

            const ipv4 = req.body.ipv4;
            const city = req.body.city;
            const state = req.body.state;
            const country = req.body.country;

            const email = `${req.body.email}`;
            const username = `${req.body.username}`;
            const password = `${req.body.password}`;
            const birthMonth = `${req.body.birthMonth}`;
            const birthDate = Number(req.body.birthDate);
            const birthYear = Number(req.body.birthYear);

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await usersDescs.findOne(
                {
                    queryableUsername: username.toLowerCase()
                }
            ).then(
                async (userData) => {
                    if(userData) {return res.status(200).json({"status": "error"});}

                    if(!userData) {
                        const newFINUX_keyset = await pact.crypto.genKeyPair();
                        const newFINUX_encryptedSecret = cryptoJS.AES.encrypt(newFINUX_keyset.secretKey, process.env.FINUX_KEY).toString();

                        const newUser = new usersDescs(
                            {
                                username: username,
                                queryableUsername: username.toLowerCase(),
                                email: email,
                                password: hashedPassword,
                                status: "active",
                                monetized: false,
                                verified: false,
                                accountType: "",
                                oneTimeCode: oneTimeCode,
                                oneTimeCodeTimeStamp: oneTimeCodeTimeStamp,
                                oneTimeCodeExpiresIn: 600,
                                profilePicture: "",
                                profileWallpaper: "",
                                profileImageOptions: [],
                                bio: "",
                                userInterests: [],
                                followingCount: 0,
                                followersCount: 0,
                                totalRewardAmount: 0,
                                demonetized: false,
                                accountDeactivated: false,
                                accountDeleted: false,
                                inviteCode: "",
                                watchlist: [],
                                walletSettings: `${username}-default-account k:${newFINUX_keyset.publicKey} 3`,
                                isAuthenticated: false,
                                birthMonth: birthMonth,
                                birthDate: birthDate,
                                birthYear: birthYear,
                                ipv4: [ipv4],
                                city: city,
                                state: state,
                                country: country,
                                createdAt: oneTimeCodeTimeStamp,
                                updatePasswordSession: ""
                            }
                        );
                        await newUser.save();

                        const newFINUX_wallet = new accountsWalletDescs(
                            {
                                username: username,
                                accountName: `${username}-default-account`,
                                accountDesignation: "",
                                publicKey: newFINUX_keyset.publicKey,
                                secretKey: newFINUX_encryptedSecret,
                                aggregateBalance: 0,
                                pendingBalanceMorning: 0,
                                pendingBalanceEvening: 0,
                                chain_by_chain: {"initialized": true, "lastTxTimestamp": 0}
                            }
                        );
                        await newFINUX_wallet.save();

                        return res.status(200).json({"status": "success"});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/sign-up-confirmation", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const oneTimeCode = Number(req.body.oneTimeCode);
            if(isNaN(oneTimeCode) || !isFinite(oneTimeCode)) {return res.status(200).json({"status": "error"});}

            await usersDescs.findOne(
                {
                    username: uniqueId
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        if(userData.oneTimeCode === oneTimeCode) {
                            const now = new Date();
                            const nowUnix = datefns.getUnixTime(now);
                            const authCodeExpirationTime = Number(userData.oneTimeCodeTimeStamp) + Number(userData.oneTimeCodeExpiresIn);

                            if(nowUnix <= authCodeExpirationTime) {
                                await usersDescs.updateOne(
                                    {username: uniqueId},
                                    {$set: {isAuthenticated: true}}
                                );
                                return res.status(200).json({"status": "success"});
                            } else {
                                const authCode = Math.floor(100000 + Math.random() * 900000);

                                const mailgun = new Mailgun(formData);
                                const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
                                const messageCreated = await mg.messages.create('user-registration.finulab.com', 
                                    {
                                        from: "Finulab <no_reply@user-registration.finulab.com>",
                                        to: [`${userData.email}`],
                                        subject: `finulab: your new one-time code is: ${authCode}`,
                                        text: `welcome to finulab ${uniqueId} - your updated one-time registration code is: ${authCode}.`,
                                        html: `<p>welcome to finulab - your updated one-time registration code is: ${authCode}.</p>`
                                    }
                                );

                                if(messageCreated.status === 200) {
                                    await usersDescs.updateOne(
                                        {username: uniqueId},
                                        {$set: {oneTimeCode: authCode, oneTimeCodeTimeStamp: nowUnix}}
                                    );
                                    return res.status(200).json({"status": "re-sent"});
                                } else {return res.status(200).json({"status": "error"});}
                            }
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/resend-code", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        const now = new Date();
                        const nowUnix = datefns.getUnixTime(now);
                        const authCode = Math.floor(100000 + Math.random() * 900000);

                        const mailgun = new Mailgun(formData);
                        const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
                        const messageCreated = await mg.messages.create('user-registration.finulab.com', 
                            {
                                from: "Finulab <no_reply@user-registration.finulab.com>",
                                to: [`${userData.email}`],
                                subject: `finulab: your new one-time code is: ${authCode}`,
                                text: `welcome to finulab ${uniqueId} - your updated one-time registration code is: ${authCode}.`,
                                html: `<p>welcome to finulab - your updated one-time registration code is: ${authCode}.</p>`
                            }
                        );

                        if(messageCreated.status === 200) {
                            await usersDescs.updateOne(
                                {username: uniqueId},
                                {$set: {oneTimeCode: authCode, oneTimeCodeTimeStamp: nowUnix}}
                            );
                            return res.status(200).json({"status": "success"});
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/update-resend-code", async (req, res) => 
    {
        try {
            const email = `${req.body.email}`;
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        const emailFound = await usersDescs.findOne({email: email});
                        if(!emailFound) {
                            const now = new Date();
                            const nowUnix = datefns.getUnixTime(now);
                            const authCode = Math.floor(100000 + Math.random() * 900000);

                            const mailgun = new Mailgun(formData);
                            const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
                            const messageCreated = await mg.messages.create('user-registration.finulab.com', 
                                {
                                    from: "Finulab <no_reply@user-registration.finulab.com>",
                                    to: [email],
                                    subject: `finulab: your new one-time code is: ${authCode}`,
                                    text: `welcome to finulab ${uniqueId} - your updated one-time registration code is: ${authCode}.`,
                                    html: `<p>welcome to finulab - your updated one-time registration code is: ${authCode}.</p>`
                                }
                            );

                            if(messageCreated.status === 200) {
                                await usersDescs.updateOne(
                                    {username: uniqueId},
                                    {$set: {email: email, oneTimeCode: authCode, oneTimeCodeTimeStamp: nowUnix}}
                                );
                                return res.status(200).json({"status": "success"});
                            } else {return res.status(200).json({"status": "error"});}
                        } else {return res.status(200).json({"status": "in-use"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/sign-up-finalization", async (req, res) => 
    {
        try {
            const bio = `${req.body.bio}`;
            const watchlist = req.body.watchlist;
            const uniqueId = `${req.body.uniqueId}`;
            const profileImage = `${req.body.profileImage}`;
            const profileWallpaper = `${req.body.profileWallpaper}`;

            await usersDescs.findOne(
                {
                    username: uniqueId
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        await usersDescs.updateOne(
                            {username: uniqueId},
                            {$set: {profilePicture: profileImage, profileWallpaper: profileWallpaper, bio: bio, watchlist: watchlist}}
                        );

                        const settings = `${userData.walletSettings}`.split(" ");
                        const publicKey = `${settings[settings.length - 2]}`.slice(2);

                        const wallet_address = `k:${publicKey}`;
                        return res.status(200).json({"status": "success", "data": wallet_address});
                    }
                }
            )
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/forgot-login", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const email = `${req.body.email}`;

            if(!(type === "sign-up" || type === "forgot-login")) {return res.status(200).json({"status": "error"});}

            await usersDescs.findOne(
                {
                    email: email
                }
            ).then(
                async (userData) => {
                    if(!userData) {
                        if(type === "sign-up") {
                            return res.status(200).json({"status": "success"});
                        } else if(type === "forgot-login") {
                            return res.status(200).json({"status": "error"});
                        }
                    }

                    if(userData) {
                        if(type === "sign-up") {
                            return res.status(200).json({"status": "error"});
                        } else if(type === "forgot-login") {
                            if(authorizedReviewers.includes(userData.username)) {
                                return res.status(200).json({"status": "error"});
                            } else {
                                const now = new Date();
                                const nowUnix = datefns.getUnixTime(now);
                                const authCode = Math.floor(100000 + Math.random() * 900000);

                                const mailgun = new Mailgun(formData);
                                const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
                                const messageCreated = await mg.messages.create('user-registration.finulab.com', 
                                    {
                                        from: "Finulab <no_reply@user-registration.finulab.com>",
                                        to: [email],
                                        subject: `finulab: your one-time code is: ${authCode}`,
                                        text: `${userData.username} - your one-time code is: ${authCode}.`,
                                        html: `<p>${userData.username} - your one-time code is: ${authCode}.</p>`
                                    }
                                );

                                if(messageCreated.status === 200) {
                                    await usersDescs.updateOne(
                                        {email: email}, 
                                        {$set: {oneTimeCode: authCode, oneTimeCodeTimeStamp: nowUnix}}
                                    );
                                    return res.status(200).json({"status": "success"});
                                } else {return res.status(200).json({"status": "error"});}
                            }
                        }
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/forgot-login-confirmation", async (req, res) => 
    {
        try {
            const email = `${req.body.email}`;
            const oneTimeCode = Number(req.body.oneTimeCode);
            if(isNaN(oneTimeCode) || !isFinite(oneTimeCode)) {return res.status(200).json({"status": "error"});}
            
            await usersDescs.findOne(
                {
                    email: email
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        if(userData.oneTimeCode === oneTimeCode) {
                            const now = new Date();
                            const nowUnix = datefns.getUnixTime(now);
                            const authCodeExpirationTime = Number(userData.oneTimeCodeTimeStamp) + Number(userData.oneTimeCodeExpiresIn);

                            if(nowUnix <= authCodeExpirationTime) {
                                return res.status(200).json({"status": "success"});
                            } else {
                                const authCode = Math.floor(100000 + Math.random() * 900000);

                                const mailgun = new Mailgun(formData);
                                const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
                                const messageCreated = await mg.messages.create('user-registration.finulab.com', 
                                    {
                                        from: "Finulab <no_reply@user-registration.finulab.com>",
                                        to: [email],
                                        subject: `finulab: your new one-time code is: ${authCode}`,
                                        text: `${userData.username} - your new one-time code is: ${authCode}.`,
                                        html: `<p>${userData.username} - your new one-time code is: ${authCode}.</p>`
                                    }
                                );

                                if(messageCreated.status === 200) {
                                    await usersDescs.updateOne(
                                        {email: email},
                                        {$set: {oneTimeCode: authCode, oneTimeCodeTimeStamp: nowUnix}}
                                    );
                                    return res.status(200).json({"status": "re-sent"});
                                } else {return res.status(200).json({"status": "error"});}
                            }
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/forgot-login-finalization", async (req, res) => 
    {
        try {
            const email = `${req.body.email}`;
            const password = `${req.body.password}`;
            const c_password = `${req.body.c_password}`;
            const oneTimeCode = Number(req.body.oneTimeCode);
            
            const passwordNumRegex = /[0-9]/g;
            const passwordCapRegex = /[A-Z]/g;
            const passwordSmllRegex = /[a-z]/g;

            if(password.match(passwordNumRegex) === null) {return res.status(200).json({"status": "error"});}
            if(password.match(passwordCapRegex) === null) {return res.status(200).json({"status": "error"});}
            if(password.match(passwordSmllRegex) === null) {return res.status(200).json({"status": "error"});}

            if(password.length < 8) {return res.status(200).json({"status": "error"});}
            if(password !== c_password) {return res.status(200).json({"status": "error"});}
            if(isNaN(oneTimeCode) || !isFinite(oneTimeCode)) {return res.status(200).json({"status": "error"});}

            await usersDescs.findOne(
                {
                    email: email
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        if(userData.oneTimeCode === oneTimeCode) {
                            const now = new Date;
                            const nowUnix = datefns.getUnixTime(now);
                            const authCodeExpirationTime = Number(userData.oneTimeCodeTimeStamp) + 7200;

                            if(nowUnix <= authCodeExpirationTime) {
                                const salt = await bcrypt.genSalt(10);
                                const hashedPassword = await bcrypt.hash(password, salt);

                                await usersDescs.updateOne(
                                    {email: email},
                                    {$set: {password: hashedPassword}}
                                );

                                return res.status(200).json({"status": "success"});
                            } else {return res.status(200).json({"status": "error"});}
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/forgot-resend-code", async (req, res) => 
    {
        try {
            const email = `${req.body.email}`;

            await usersDescs.findOne(
                {
                    email: email
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        const now = new Date();
                        const nowUnix = datefns.getUnixTime(now);
                        const authCode = Math.floor(100000 + Math.random() * 900000);

                        const mailgun = new Mailgun(formData);
                        const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
                        const messageCreated = await mg.messages.create('user-registration.finulab.com', 
                            {
                                from: "Finulab <no_reply@user-registration.finulab.com>",
                                to: [email],
                                subject: `finulab: your new one-time code is: ${authCode}`,
                                text: `${userData.username} - your updated one-time code is: ${authCode}.`,
                                html: `<p>${userData.username} - your updated one-time code is: ${authCode}.</p>`
                            }
                        );

                        if(messageCreated.status === 200) {
                            await usersDescs.updateOne(
                                {email: email},
                                {$set: {oneTimeCode: authCode, oneTimeCodeTimeStamp: nowUnix}}
                            );
                            return res.status(200).json({"status": "success"});
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/login", async (req, res) => 
    {
        try {
            await usersDescs.findOne(
                {
                    username: `${req.body.username}`
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        const usernamePassBool = await bcrypt.compare(`${req.body.password}`, userData.password);
                        if(!usernamePassBool) {return res.status(200).json({"status": "error"});}

                        if(usernamePassBool) {
                            const w_settings = userData.walletSettings;
                            const parsed_settings = w_settings.split(" ");
                            const wallet_address = parsed_settings[parsed_settings.length - 2];

                            let utilize_address = "";
                            if(wallet_address.slice(0, 1) === "k") {
                                utilize_address = wallet_address;
                            } else {
                                utilize_address = `k:${wallet_address.slice(2, wallet_address.length)}`;
                            }

                            const mod_status = await communitiesModeratorsList.find(
                                {
                                    username: `${req.body.username}`,
                                    status: "active"
                                }
                            ).select(`-_id community type`).exec();

                            const userVerificationStat = await usersVerifiedRecord.findOne(
                                {
                                    username: `${req.body.username}`
                                }
                            ).select(`-_id selectedChain status verificationStartDate verificationNextPayDate`).exec();

                            return res.status(200).json({"status": "success", "data": userData, "walletAddress": utilize_address, "moderatorStatus": mod_status, "verificationData": userVerificationStat ? userVerificationStat : {}});
                        }
                    }
                }
            )
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/pull-mod-stat", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            const mod_status = await communitiesModeratorsList.find(
                {
                    username: uniqueId,
                    status: "active"
                }
            ).select(`-_id community type`).exec();

            let mod_communities = [];
            for(let i = 0; i < mod_status.length; i++) {
                mod_communities.push(mod_status[i]["community"]);
            }

            let mod_returnDesc = [];
            let mod_communitiesDesc = null;
            if(mod_communities.length > 0) {
                mod_communitiesDesc = await communitiesDescs.find(
                    {
                        "communityName": {$in: mod_communities}
                    }
                ).select(`-_id communityName profilePicture`).exec();
            }

            if(mod_communitiesDesc
                && mod_communitiesDesc.length > 0
            ) {
                let insert_record = {}
                for(let j = 0; j < mod_status.length; j++) {
                    insert_record["community"] = mod_status[j]["community"];
                    insert_record["type"] = mod_status[j]["type"];
                    insert_record["profileImage"] = mod_communitiesDesc.filter(comm_desc => comm_desc["communityName"] === mod_status[j]["community"])[0]["profilePicture"];

                    mod_returnDesc.push(insert_record);
                    insert_record = {}
                }
            }

            const userVerificationStat = await usersVerifiedRecord.findOne(
                {
                    username: uniqueId
                }
            ).select(`-_id selectedChain status verificationStartDate verificationNextPayDate`).exec();

            return res.status(200).json({"status": "success", "data": mod_returnDesc, "verificationData": userVerificationStat ? userVerificationStat : {}});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/stats-desc", async (req, res) => 
    {
        try {
            const username = `${req.body.username}`;

            const following = await followingDescs.countDocuments({username: username, response: "accepted"});
            const followers = await followingDescs.countDocuments({following: username, response: "accepted"});

            return res.status(200).json({"status": "success", "data": {"following": following, "followers": followers}});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/own-desc", async (req, res) => 
    {
        try {
            const username = `${req.body.username}`;

            await usersDescs.findOne(
                {
                    username: username
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        if(userData.accountDeleted) {return res.status(200).json({"status": "error"});}

                        const following = await followingDescs.countDocuments({username: username, response: "accepted"});
                        const followers = await followingDescs.countDocuments({following: username, response: "accepted"});
                        const communities = await communitiesJoinedDescs.countDocuments({username: username, response: "accepted"});

                        const predCount = await axios.put(`http://localhost:8901/api/market/profile-pred-count`, {"username": username});
                        const postCount = await axios.put(`http://localhost:8800/api/content/posts/profile-post-count`, {"username": username});

                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": {
                                    "username": username,
                                    "profilePicture": userData.profilePicture,
                                    "profileWallpaper": userData.profileWallpaper,
                                    "email": userData.email,
                                    "bio": userData.bio,
                                    "followers": followers,
                                    "following": following,
                                    "communities": communities,
                                    "watchlist": userData.watchlist,
                                    "accountDeactivated": userData.accountDeactivated,
                                    "postCount": postCount.data["status"] === "success" ? postCount.data["data"] : 0,
                                    "marketsCount": predCount.data["status"] === "success" ? predCount.data["data"] : 0
                                }
                            }
                        );
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/profile-desc", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const username = `${req.body.username}`;

            await usersDescs.findOne(
                {
                    username: username
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        if(userData.accountDeleted) {return res.status(200).json({"status": "error"});}

                        const following = await followingDescs.countDocuments({username: username, response: "accepted"});
                        const followers = await followingDescs.countDocuments({following: username, response: "accepted"});
                        const communities = await communitiesJoinedDescs.countDocuments({username: username, response: "accepted"});

                        const followingStatus = await followingDescs.countDocuments({username: uniqueId, following: username, response: "accepted"});

                        const predCount = await axios.put(`http://localhost:8901/api/market/profile-pred-count`, {"username": username});
                        const postCount = await axios.put(`http://localhost:8800/api/content/posts/profile-post-count`, {"username": username});

                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": {
                                    "username": username,
                                    "profilePicture": userData.profilePicture,
                                    "profileWallpaper": userData.profileWallpaper,
                                    "bio": userData.bio,
                                    "followers": followers,
                                    "following": following,
                                    "communities": communities,
                                    "followingStatus": followingStatus,
                                    "watchlist": userData.watchlist,
                                    "accountDeactivated": userData.accountDeactivated,
                                    "postCount": postCount.data["status"] === "success" ? postCount.data["data"] : 0,
                                    "marketsCount": predCount.data["status"] === "success" ? predCount.data["data"] : 0
                                }
                            }
                        );
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/own-community-desc", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const community = `${req.body.community}`;

            await communitiesDescs.findOne(
                {
                    communityName: community
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        if(communityData.moderators.includes(uniqueId)) {
                            const postCount = await axios.put(`http://localhost:8800/api/content/posts/community-post-count`, {"community": community});

                            const moderatorsQuickDesc = await usersDescs.find(
                                {
                                    username: {$in: communityData.moderators}
                                }
                            ).select(`-_id username profilePicture bio`).exec();

                            const moderatorsInDeptDesc = await communitiesModeratorsList.find(
                                {
                                    username: {$in: communityData.moderators},
                                    community: community,
                                    status: "active"
                                }
                            ).select(`-_id username type timeStamp`).exec();

                            let moderatorsPrivileges = [];
                            for(let i = 0; i < communityData.moderators.length; i++) {
                                const modType = moderatorsInDeptDesc.filter(mID_desc => mID_desc.username === communityData.moderators[i])[0];
                                const rewardPerc = communityData.moderatorsPercentages.filter(mP_desc => mP_desc.username === communityData.moderators[i])[0];
                                
                                moderatorsPrivileges.push(
                                    {
                                        "username": communityData.moderators[i],
                                        "modType": modType["type"],
                                        "rewardPerc": `${rewardPerc["ownership"] * 100}`,
                                        "timeStamp": modType["timeStamp"]
                                    }
                                );
                            }

                            return res.status(200).json(
                                {
                                    "status": "success",
                                    "data": {
                                        "username": community,
                                        "profilePicture": communityData.profilePicture,
                                        "profileWallpaper": communityData.profileWallpaper,
                                        "bio": communityData.bio,
                                        "rules": communityData.rules,
                                        "moderators": communityData.moderators,
                                        "moderatorsPrivileges": moderatorsPrivileges,
                                        "moderatorsQuickDesc": moderatorsQuickDesc,
                                        "membersCount": communityData.membersCount,
                                        "postCount": postCount.data["status"] === "success" ? postCount.data["data"] : 0
                                    }
                                }
                            );
                        } else {
                            return res.status(200).json({"status": "error"});
                        }
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/general-community-desc", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const community = `${req.body.community}`;

            await communitiesDescs.findOne(
                {
                    communityName: community
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        const postCount = await axios.put(`http://localhost:8800/api/content/posts/community-post-count`, {"community": community});
                        const followingStatus = await communitiesJoinedDescs.countDocuments({username: uniqueId, joined: community, response: "accepted"});

                        const moderatorsQuickDesc = await usersDescs.find(
                            {
                                username: {$in: communityData.moderators}
                            }
                        ).select(`-_id username profilePicture bio`).exec();

                        return res.status(200).json(
                            {
                                "status": "success",
                                "data": {
                                    "username": community,
                                    "profilePicture": communityData.profilePicture,
                                    "profileWallpaper": communityData.profileWallpaper,
                                    "bio": communityData.bio,
                                    "rules": communityData.rules,
                                    "moderators": communityData.moderators,
                                    "moderatorsQuickDesc": moderatorsQuickDesc,
                                    "membersCount": communityData.membersCount,
                                    "followingStatus": followingStatus,
                                    "postCount": postCount.data["status"] === "success" ? postCount.data["data"] : 0
                                }
                            }
                        );
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/own-update-settings", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            const bio = `${req.body.bio}`;
            const email = `${req.body.email}`;
            const profileImage = `${req.body.profileImage}`;
            const wallpaperImage = `${req.body.wallpaperImage}`;

            await usersDescs.findOne(
                {
                    username: uniqueId
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}

                    if(userData) {
                        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
                        if(!regexEmail.test(email)) {return res.status(200).json({"status": "error"});}

                        await usersDescs.updateOne(
                            {username: uniqueId},
                            {$set: {email: email, profilePicture: profileImage, profileWallpaper: wallpaperImage, bio: bio}}
                        );

                        const newSettingsUpdateRecord = new usersSettingsUpdate(
                            {
                                username: uniqueId,
                                bio: bio,
                                profileImage: profileImage,
                                profileWallpaper: wallpaperImage,
                                changeProcessed: false
                            }
                        );
                        await newSettingsUpdateRecord.save();
                        
                        return res.status(200).json({"status": "success"});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-update-settings", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const communityName = `${req.body.communityName}`;

            const bio = `${req.body.bio}`;
            const profileImage = `${req.body.profileImage}`;
            const wallpaperImage = `${req.body.wallpaperImage}`;

            await communitiesDescs.findOne(
                {
                    communityName: communityName
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        if(communityData.moderators.includes(uniqueId)) {
                            await communitiesDescs.updateOne(
                                {communityName: communityName},
                                {$set: {profilePicture: profileImage, profileWallpaper: wallpaperImage, bio: bio}}
                            );

                            return res.status(200).json({"status": "success"});
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-update-rules", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const communityRules = req.body.communityRules;
            const communityName = `${req.body.communityName}`;
            
            if(!Array.isArray(communityRules)) {return res.status(200).json({"status": "error"});}
            
            if(communityRules.length === 0) {return res.status(200).json({"status": "error"});}
            for(let i = 0; i < communityRules.length; i++) {
                const ruleKeys = Object.keys(communityRules[i]);
                if(ruleKeys.length !== 2) {return res.status(200).json({"status": "error"});}

                if(!ruleKeys.includes("header")) {return res.status(200).json({"status": "error"});}
                if(!ruleKeys.includes("description")) {return res.status(200).json({"status": "error"});}
            }

            await communitiesDescs.findOne(
                {
                    communityName: communityName
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        if(communityData.moderators.includes(uniqueId)) {
                            await communitiesDescs.updateOne(
                                {communityName: communityName},
                                {$set: {rules: communityRules}}
                            );

                            return res.status(200).json({"status": "success"});
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-update-privileges", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const communityName = `${req.body.communityName}`;
            const moderatorsPrivileges = req.body.moderatorsPrivileges;

            if(!Array.isArray(moderatorsPrivileges)) {return res.status(200).json({"status": "error"});}

            let modPercSum = 0;
            let superModCount = 0;
            let upTo_usernames = [], upTo_modPercs = [], upTo_modPrivileges = [];
            if(moderatorsPrivileges.length === 0) {return res.status(200).json({"status": "error"});}
            for(let i = 0; i < moderatorsPrivileges.length; i++) {
                const privilegeKeys = Object.keys(moderatorsPrivileges[i]);
                if(privilegeKeys.length !== 4) {return res.status(200).json({"status": "error"});}

                if(!privilegeKeys.includes("modType")) {return res.status(200).json({"status": "error"});}
                if(!privilegeKeys.includes("username")) {return res.status(200).json({"status": "error"});}
                if(!privilegeKeys.includes("rewardPerc")) {return res.status(200).json({"status": "error"});}

                if(!(moderatorsPrivileges[i]["modType"] === "superMod" || moderatorsPrivileges[i]["modType"] === "mod")) {return res.status(200).json({"status": "error"});}
                if(isNaN(Number(moderatorsPrivileges[i]["rewardPerc"])) || !isFinite(Number(moderatorsPrivileges[i]["rewardPerc"]))) {return res.status(200).json({"status": "error"});}

                if(moderatorsPrivileges[i]["modType"] === "superMod") {
                    superModCount = superModCount + 1;
                }
                modPercSum = modPercSum + (Number(moderatorsPrivileges[i]["rewardPerc"]) / 100);

                upTo_usernames.push(
                    moderatorsPrivileges[i]["username"]
                );
                upTo_modPercs.push(
                    {
                        "username": moderatorsPrivileges[i]["username"],
                        "ownership": Number(moderatorsPrivileges[i]["rewardPerc"]) / 100
                    }
                );
                upTo_modPrivileges.push(
                    {
                        "username": moderatorsPrivileges[i]["username"],
                        "privileges": moderatorsPrivileges[i]["modType"] === "superMod" ?
                            [
                                "add-or-remove-moderator",
                                "add-or-ban-users",
                                "remove-post",
                                "remove-comment",
                                "determine-moderators-reward-percentage"
                            ] : 
                            [
                                "add-or-ban-users",
                                "remove-post",
                                "remove-comment"
                            ]
                    }
                );
            }

            if(modPercSum !== 1) {return res.status(200).json({"status": "error"});}
            if(superModCount === 0) {return res.status(200).json({"status": "error"});}

            await communitiesDescs.findOne(
                {
                    communityName: communityName
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        upTo_usernames = upTo_usernames.sort();
                        const upTo_usernamesCompare = [...communityData.moderators].sort();
                        const arraysMatch = upTo_usernames.length === upTo_usernamesCompare.length && upTo_usernames.every((item, index) => item === upTo_usernamesCompare[index]);

                        if(!arraysMatch) {return res.status(200).json({"status": "error"});}

                        if(communityData.moderators.includes(uniqueId)) {
                            const uniqueId_privileges = communityData.moderatorsPrivileges.filter(mP_desc => mP_desc.username === uniqueId)[0];

                            if(uniqueId_privileges["privileges"].includes("add-or-remove-moderator") 
                                && uniqueId_privileges["privileges"].includes("determine-moderators-reward-percentage")
                            ) {
                                await communitiesDescs.updateOne(
                                    {communityName: communityName},
                                    {$set: {moderatorsPercentages: upTo_modPercs, moderatorsPrivileges: upTo_modPrivileges}}
                                );

                                for(let j = 0; j < upTo_modPrivileges.length; j++) {
                                    await communitiesModeratorsList.updateOne(
                                        {username: upTo_modPrivileges[j]["username"], community: communityName},
                                        {$set: {type: upTo_modPrivileges[j]["privileges"].length === 5 ? "superMod" : "mod"}}
                                    );
                                }
                                return res.status(200).json({"status": "success"});
                            } else {return res.status(200).json({"status": "error"});}
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-add-mod", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const modToAdd = `${req.body.modToAdd}`;
            const communityName = `${req.body.communityName}`;

            await communitiesDescs.findOne(
                {
                    communityName: communityName
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        if(communityData.moderators.includes(modToAdd)) {return res.status(200).json({"status": "error"});}

                        if(communityData.moderators.includes(uniqueId)) {
                            const uniqueId_privileges = communityData.moderatorsPrivileges.filter(mP_desc => mP_desc.username === uniqueId)[0];

                            if(uniqueId_privileges["privileges"].includes("add-or-remove-moderator")) {
                                const modToAddDesc = await usersDescs.findOne({username: modToAdd});
                                if(!modToAddDesc) {return res.status(200).json({"status": "error"});}
                                if(modToAddDesc) {
                                    const modToAddDesc_keys = Object.keys(modToAddDesc);
                                    if(modToAddDesc_keys.length === 0) {return res.status(200).json({"status": "error"});}
                                }

                                let incMembersBy = 0;
                                const now = new Date(), nowUnix = datefns.getUnixTime(now);

                                await communitiesJoinedDescs.findOne(
                                    {
                                        username: modToAdd,
                                        joined: communityName
                                    }
                                ).then(
                                    async (communitiesJoinedData) => {
                                        if(!communitiesJoinedData) {
                                            const newJoiningMember = new communitiesJoinedDescs(
                                                {
                                                    username: modToAdd,
                                                    joined: communityName,
                                                    response: "accepted",
                                                    timeStamp: nowUnix
                                                }
                                            );
                                            await newJoiningMember.save();

                                            incMembersBy = 1;
                                        }

                                        if(communitiesJoinedData) {
                                            await communitiesJoinedDescs.updateOne(
                                                {username: modToAdd, joined: communityName},
                                                {$set: {response: "accepted", timeStamp: nowUnix}}
                                            );
                                        }
                                    }
                                );

                                await communitiesModeratorsList.findOne(
                                    {
                                        username: modToAdd,
                                        community: communityName
                                    }
                                ).then(
                                    async (communitiesModeratorsListData) => {
                                        if(!communitiesModeratorsListData) {
                                            const newModeratorList = new communitiesModeratorsList(
                                                {
                                                    username: modToAdd,
                                                    community: communityName,
                                                    status: "active",
                                                    type: "mod",
                                                    timeStamp: nowUnix
                                                }
                                            )
                                        }

                                        if(communitiesModeratorsListData) {
                                            await communitiesModeratorsList.updateOne(
                                                {username: modToAdd, community: communityName},
                                                {$set: {status: "active", type: "mod", timeStamp: nowUnix}}
                                            );
                                        }
                                    }
                                );

                                await communitiesDescs.updateOne(
                                    {communityName: communityName},
                                    {
                                        $set: {
                                            moderators: [...communityData.moderators, modToAdd],
                                            moderatorsPercentages: [...communityData.moderatorsPercentages, {"username": modToAdd, "ownership": 0}],
                                            moderatorsPrivileges: [
                                                ...communityData.moderatorsPrivileges,
                                                {
                                                    "username": modToAdd,
                                                    "privileges": [
                                                        "add-or-ban-users",
                                                        "remove-post",
                                                        "remove-comment"
                                                    ]
                                                }
                                            ]
                                        },
                                        $inc: {
                                            membersCount: incMembersBy
                                        }
                                    }
                                );

                                await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                    {
                                        "by": communityName,
                                        "link": `/profile/${communityName}`,
                                        "type": "network",
                                        "target": modToAdd,
                                        "message": `${uniqueId} has added you as a moderator to ${communityName}`,
                                        "byProfileImage": communityData.profilePicture,
                                        "secondaryMessage": ""
                                    }
                                );
                                
                                return res.status(200).json(
                                    {
                                        "status": "success",
                                        "data": {
                                            "username": modToAdd,
                                            "profilePicture": modToAddDesc["profilePicture"],
                                            "bio": modToAddDesc["bio"]
                                        }
                                    }
                                );
                            } else {return res.status(200).json({"status": "error"});}
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/community-remove-mod", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const modToRemove = `${req.body.modToRemove}`;
            const communityName = `${req.body.communityName}`;

            await communitiesDescs.findOne(
                {
                    communityName: communityName
                }
            ).then(
                async (communityData) => {
                    if(!communityData) {return res.status(200).json({"status": "error"});}

                    if(communityData) {
                        if(!communityData.moderators.includes(modToRemove)) {return res.status(200).json({"status": "error"});}

                        if(communityData.moderators.includes(uniqueId)) {
                            const uniqueId_privileges = communityData.moderatorsPrivileges.filter(mP_desc => mP_desc.username === uniqueId)[0];

                            if(uniqueId_privileges["privileges"].includes("add-or-remove-moderator")) {
                                const wo_modToRemove_privileges = communityData.moderatorsPrivileges.filter(mP_desc => mP_desc.username !== modToRemove);
                                const modToRemove_rewardPerc = communityData.moderatorsPercentages.filter(mtR_desc => mtR_desc.username === modToRemove)[0];
                                
                                if(wo_modToRemove_privileges.length === 0) {return res.status(200).json({"status": "error"});}
                                if(modToRemove_rewardPerc["ownership"] !== 0) {return res.status(200).json({"status": "error"});}

                                let superModCount = 0;
                                for(let i = 0; i < wo_modToRemove_privileges.length; i++) {
                                    if(wo_modToRemove_privileges[i]["privileges"].length === 5) {
                                        superModCount = superModCount + 1;
                                    }
                                }
                                if(superModCount === 0) {return res.status(200).json({"status": "error"});}

                                
                                await communitiesDescs.updateOne(
                                    {communityName: communityName},
                                    {$set: 
                                        {
                                            moderators: communityData.moderators.filter(m_desc => m_desc !== modToRemove),
                                            moderatorsPercentages: communityData.moderatorsPercentages.filter(mPerc_desc => mPerc_desc.username !== modToRemove),
                                            moderatorsPrivileges: wo_modToRemove_privileges
                                        }
                                    }
                                );

                                await communitiesModeratorsList.updateOne(
                                    {username: modToRemove, community: communityName},
                                    {$set: {status: "inactive"}}
                                );

                                await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                    {
                                        "by": communityName,
                                        "link": `/profile/${communityName}`,
                                        "type": "network",
                                        "target": modToRemove,
                                        "message": `${uniqueId} removed you as a moderator to ${communityName}`,
                                        "byProfileImage": communityData.profilePicture,
                                        "secondaryMessage": ""
                                    }
                                );
                                return res.status(200).json({"status": "success"});
                            } else {return res.status(200).json({"status": "error"});}
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/quick-desc", async (req, res) => 
    {
        try {
            const uniqueUsernames = req.body.uniqueUsernames;
            if(!Array.isArray(uniqueUsernames)) {return res.status(200).json({"status": "error"});}

            const quickDescs = await usersDescs.find(
                {
                    username: {$in: uniqueUsernames}
                }
            ).select(`-_id username profilePicture`).exec();

            return res.status(200).json({"status": "success", "data": quickDescs});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/communities-joined", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            const data_support = await communitiesJoinedDescs.find(
                {
                    username: uniqueId,
                    response: "accepted"
                }
            ).sort({timeStamp: -1}).select(`-_id joined timeStamp`).exec();

            let find_communities = [];
            for(let i = 0; i < data_support.length; i++) {
                find_communities.push(data_support[i]["joined"]);
            }

            if(find_communities.length === 0) {
                return res.status(200).json({"status": "success", "data": []});
            } else {
                const data_for_users = await communitiesDescs.find(
                    {
                        communityName: {$in: find_communities}
                    }
                ).select(`-_id communityName profilePicture`).exec();

                const timeStampMap = new Map(data_support.map(item => [item.joined, item.timeStamp]));
                const data = data_for_users.sort((a, b) => {
                    const A = timeStampMap.get(a.communityName);
                    const B = timeStampMap.get(b.communityName);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_communities-desc", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const u_ninclude = req.body.u_ninclude;
            const username = `${req.body.username}`;
            
            if(!Array.isArray(u_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await communitiesJoinedDescs.countDocuments({username: username, response: "accepted"});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const data_support = await communitiesJoinedDescs.find(
                        {
                            username: username,
                            response: "accepted"
                        }
                    ).sort({timeStamp: -1}).limit(15).select(`-_id joined timeStamp`).exec();

                    let find_communities = [];
                    for(let i = 0; i < data_support.length; i++) {
                        find_communities.push(data_support[i]["joined"]);
                    }

                    const data_for_users = await communitiesDescs.find(
                        {
                            communityName: {$in: find_communities}
                        }
                    ).select(`-_id communityName profilePicture bio`).exec();

                    const timeStampMap = new Map(data_support.map(item => [item.joined, item.timeStamp]));
                    const data = data_for_users.sort((a, b) => {
                        const A = timeStampMap.get(a.communityName);
                        const B = timeStampMap.get(b.communityName);
    
                        return (B || 0) - (A || 0);
                    });

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const data_support = await communitiesJoinedDescs.find(
                    {
                        username: username,
                        joined: {$nin: u_ninclude},
                        response: "accepted"
                    }
                ).sort({timeStamp: -1}).limit(15).select(`-_id joined timeStamp`).exec();

                let find_communities = [];
                for(let i = 0; i < data_support.length; i++) {
                    find_communities.push(data_support[i]["joined"]);
                }

                const data_for_users = await communitiesDescs.find(
                    {
                        communityName: {$in: find_communities}
                    }
                ).select(`-_id communityName profilePicture bio`).exec();

                const timeStampMap = new Map(data_support.map(item => [item.joined, item.timeStamp]));
                const data = data_for_users.sort((a, b) => {
                    const A = timeStampMap.get(a.communityName);
                    const B = timeStampMap.get(b.communityName);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_community-members", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const u_ninclude = req.body.u_ninclude;
            const community = `${req.body.community}`;
            
            if(!Array.isArray(u_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await communitiesJoinedDescs.countDocuments({joined: community, response: "accepted"});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const data_support = await communitiesJoinedDescs.find(
                        {
                            joined: community,
                            response: "accepted"
                        }
                    ).sort({timeStamp: -1}).limit(15).select(`-_id username timeStamp`).exec();

                    let find_usernames = [];
                    for(let i = 0; i < data_support.length; i++) {
                        find_usernames.push(data_support[i]["username"]);
                    }

                    const data_for_users = await usersDescs.find(
                        {
                            username: {$in: find_usernames}
                        }
                    ).select(`-_id username profilePicture bio`).exec();

                    const timeStampMap = new Map(data_support.map(item => [item.username, item.timeStamp]));
                    const data = data_for_users.sort((a, b) => {
                        const A = timeStampMap.get(a.username);
                        const B = timeStampMap.get(b.username);
    
                        return (B || 0) - (A || 0);
                    });

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const data_support = await communitiesJoinedDescs.find(
                    {
                        joined: community,
                        username: {$nin: u_ninclude},
                        response: "accepted"
                    }
                ).sort({timeStamp: -1}).limit(15).select(`-_id username timeStamp`).exec();

                let find_usernames = [];
                for(let i = 0; i < data_support.length; i++) {
                    find_usernames.push(data_support[i]["username"]);
                }

                const data_for_users = await usersDescs.find(
                    {
                        username: {$in: find_usernames}
                    }
                ).select(`-_id username profilePicture bio`).exec();

                const timeStampMap = new Map(data_support.map(item => [item.username, item.timeStamp]));
                const data = data_for_users.sort((a, b) => {
                    const A = timeStampMap.get(a.username);
                    const B = timeStampMap.get(b.username);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_following-desc", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const u_ninclude = req.body.u_ninclude;
            const username = `${req.body.username}`;
            
            if(!Array.isArray(u_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await followingDescs.countDocuments({username: username, response: "accepted"});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const data_support = await followingDescs.find(
                        {
                            username: username, 
                            response: "accepted"
                        }
                    ).sort({timeStamp: -1}).limit(15).select(`-_id following timeStamp`).exec();

                    let find_usernames = [];
                    for(let i = 0; i < data_support.length; i++) {
                        find_usernames.push(data_support[i]["following"]);
                    }

                    const data_for_users = await usersDescs.find(
                        {
                            username: {$in: find_usernames}
                        }
                    ).select(`-_id username profilePicture bio`).exec();

                    const timeStampMap = new Map(data_support.map(item => [item.following, item.timeStamp]));
                    const data = data_for_users.sort((a, b) => {
                        const A = timeStampMap.get(a.username);
                        const B = timeStampMap.get(b.username);
    
                        return (B || 0) - (A || 0);
                    });

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const data_support = await followingDescs.find(
                    {
                        username: username, 
                        following: {$nin: u_ninclude},
                        response: "accepted"
                    }
                ).sort({timeStamp: -1}).limit(15).select(`-_id following timeStamp`).exec();

                let find_usernames = [];
                for(let i = 0; i < data_support.length; i++) {
                    find_usernames.push(data_support[i]["following"]);
                }

                const data_for_users = await usersDescs.find(
                    {
                        username: {$in: find_usernames}
                    }
                ).select(`-_id username profilePicture bio`).exec();

                const timeStampMap = new Map(data_support.map(item => [item.following, item.timeStamp]));
                const data = data_for_users.sort((a, b) => {
                    const A = timeStampMap.get(a.username);
                    const B = timeStampMap.get(b.username);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/p_followers-desc", async (req, res) => 
    {
        try {
            const type = `${req.body.type}`;
            const u_ninclude = req.body.u_ninclude;
            const username = `${req.body.username}`;
            
            if(!Array.isArray(u_ninclude)) {return res.status(200).json({"status": "error"});}
            if(!(type === "primary" || type === "secondary")) {return res.status(200).json({"status": "error"});}

            if(type === "primary") {
                const dataCount = await followingDescs.countDocuments({following: username, response: "accepted"});

                if(dataCount === 0) {
                    return res.status(200).json({"status": "success", "data": [], "dataCount": dataCount});
                } else {
                    const data_support = await followingDescs.find(
                        {
                            following: username, 
                            response: "accepted"
                        }
                    ).sort({timeStamp: -1}).limit(15).select(`-_id username timeStamp`).exec();

                    let find_usernames = [];
                    for(let i = 0; i < data_support.length; i++) {
                        find_usernames.push(data_support[i]["username"]);
                    }

                    const data_for_users = await usersDescs.find(
                        {
                            username: {$in: find_usernames}
                        }
                    ).select(`-_id username profilePicture bio`).exec();

                    const timeStampMap = new Map(data_support.map(item => [item.username, item.timeStamp]));
                    const data = data_for_users.sort((a, b) => {
                        const A = timeStampMap.get(a.username);
                        const B = timeStampMap.get(b.username);
    
                        return (B || 0) - (A || 0);
                    });

                    return res.status(200).json({"status": "success", "data": data, "dataCount": dataCount});
                }
            } else if(type === "secondary") {
                const data_support = await followingDescs.find(
                    {
                        username: {$nin: u_ninclude},
                        following: username,
                        response: "accepted"
                    }
                ).sort({timeStamp: -1}).limit(15).select(`-_id username timeStamp`).exec();

                let find_usernames = [];
                for(let i = 0; i < data_support.length; i++) {
                    find_usernames.push(data_support[i]["username"]);
                }

                const data_for_users = await usersDescs.find(
                    {
                        username: {$in: find_usernames}
                    }
                ).select(`-_id username profilePicture bio`).exec();

                const timeStampMap = new Map(data_support.map(item => [item.username, item.timeStamp]));
                const data = data_for_users.sort((a, b) => {
                    const A = timeStampMap.get(a.username);
                    const B = timeStampMap.get(b.username);

                    return (B || 0) - (A || 0);
                });

                return res.status(200).json({"status": "success", "data": data});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/following", async (req, res) => 
    {
        try {
            const username = `${req.body.username}`;

            await followingDescs.find(
                {
                    username: username,
                    response: "accepted"
                }
            ).then(
                (followingData) => {
                    if(!followingData) {return res.status(200).json({"status": "success", "data": []});}

                    if(followingData) {
                        let data = [];
                        for(let i = 0; i < followingData.length; i++) {
                            data.push(followingData[i]["following"]);
                        }

                        return res.status(200).json({"status": "success", "data": data}); 
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/follow-user", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const following = `${req.body.following}`;
            const byProfileImage = `${req.body.byProfileImage}`;

            await followingDescs.findOne(
                {
                    username: uniqueId,
                    following: following
                }
            ).then(
                async (followingData) => {
                    if(!followingData) {
                        const now = new Date(), nowUnix = datefns.getUnixTime(now);
                        const newFollower = new followingDescs(
                            {
                                username: uniqueId,
                                following: following,
                                response: "accepted",
                                timeStamp: nowUnix
                            }
                        );
                        await newFollower.save();

                        await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                            {
                                "by": uniqueId,
                                "link": `/profile/${uniqueId}`,
                                "type": "network",
                                "target": following,
                                "message": `${uniqueId} is following you`,
                                "byProfileImage": byProfileImage,
                                "secondaryMessage": ""
                            }
                        );
                        return res.status(200).json({"status": "success"});
                    }

                    if(followingData) {
                        if(followingData.response === "accepted") {
                            return res.status(200).json({"status": "error"});
                        } else if(followingData.response === "removed") {
                            const now = new Date(), nowUnix = datefns.getUnixTime(now);
                            await followingDescs.updateOne(
                                {username: uniqueId, following: following},
                                {$set: {response: "accepted", timeStamp: nowUnix}}
                            );

                            await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                {
                                    "by": uniqueId,
                                    "link": `/profile/${uniqueId}`,
                                    "type": "network",
                                    "target": following,
                                    "message": `${uniqueId} is following you`,
                                    "byProfileImage": byProfileImage,
                                    "secondaryMessage": ""
                                }
                            );
                            return res.status(200).json({"status": "success"});
                        }
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/unfollow-user", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            const following = `${req.body.following}`;

            await followingDescs.findOne(
                {
                    username: uniqueId,
                    following: following
                }
            ).then(
                async (followingData) => {
                    if(!followingData) {return res.status(200).json({"status": "error"});}

                    if(followingData) {
                        if(followingData.response === "accepted") {
                            const now = new Date(), nowUnix = datefns.getUnixTime(now);
                            await followingDescs.updateOne(
                                {username: uniqueId, following: following},
                                {$set: {response: "removed", timeStamp: nowUnix}}
                            );

                            return res.status(200).json({"status": "success"});
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/join-community", async (req, res) => 
    {
        try {
            const joining = `${req.body.joining}`;
            const uniqueId = `${req.body.uniqueId}`;
            const byProfileImage = `${req.body.byProfileImage}`;

            await communitiesJoinedDescs.findOne(
                {
                    username: uniqueId,
                    joined: joining
                }
            ).then(
                async (communityJoinedData) => {
                    if(!communityJoinedData) {
                        const now = new Date(), nowUnix = datefns.getUnixTime(now);
                        const newMember = new communitiesJoinedDescs(
                            {
                                username: uniqueId,
                                joined: joining,
                                response: "accepted",
                                timeStamp: nowUnix
                            }
                        );
                        await newMember.save();
                        await communitiesDescs.updateOne({communityName: joining}, {$inc: {membersCount: 1}});

                        await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                            {
                                "by": uniqueId,
                                "link": `/profile/${uniqueId}`,
                                "type": "network",
                                "target": joining,
                                "message": `${uniqueId} is joined the community`,
                                "byProfileImage": byProfileImage,
                                "secondaryMessage": ""
                            }
                        );
                        return res.status(200).json({"status": "success"});
                    }

                    if(communityJoinedData) {
                        if(communityJoinedData.response === "accepted") {
                            return res.status(200).json({"status": "error"});
                        } else {
                            const now = new Date(), nowUnix = datefns.getUnixTime(now);
                            await communitiesDescs.updateOne({communityName: joining}, {$inc: {membersCount: 1}});
                            await communitiesJoinedDescs.updateOne({username: uniqueId, joined: joining}, {$set: {response: "accepted", timeStamp: nowUnix}});

                            await axios.post(`http://localhost:8800/api/content/notifications/send-notification`, 
                                {
                                    "by": uniqueId,
                                    "link": `/profile/${uniqueId}`,
                                    "type": "network",
                                    "target": joining,
                                    "message": `${uniqueId} is joined the community`,
                                    "byProfileImage": byProfileImage,
                                    "secondaryMessage": ""
                                }
                            );
                            return res.status(200).json({"status": "success"});
                        }
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/leave-community", async (req, res) => 
    {
        try {
            const leaving = `${req.body.leaving}`;
            const uniqueId = `${req.body.uniqueId}`;

            await communitiesJoinedDescs.findOne(
                {
                    username: uniqueId,
                    joined: leaving
                }
            ).then(
                async (communityJoinedData) => {
                    if(!communityJoinedData) {
                        return res.status(200).json({"status": "error"});
                    }

                    if(communityJoinedData) {
                        if(communityJoinedData.response === "accepted") {
                            const communityData = await communitiesDescs.findOne({communityName: leaving});
                            if(!communityData) {return res.status(200).json({"status": "error"});} 
                            
                            if(communityData) {
                                let superMods = [], superModCount = 0;
                                for(let i = 0; i < communityData.moderatorsPrivileges.length; i++) {
                                    if(communityData.moderatorsPrivileges[i]["privileges"].includes("add-or-remove-moderator") &&
                                    communityData.moderatorsPrivileges[i]["privileges"].includes("determine-moderators-reward-percentage")
                                    ) {
                                        superMods.push(communityData.moderatorsPrivileges[i]["username"]);
                                        superModCount = superModCount + 1;
                                    }
                                }

                                if(superModCount <= 1 && superMods.includes(uniqueId)) {
                                    return res.status(200).json({"status": "failed-critical"});
                                } else if(communityData.moderators.includes(uniqueId)) {
                                    return res.status(200).json({"status": "failed-secondary-critical"});
                                } else {
                                    const now = new Date(), nowUnix = datefns.getUnixTime(now);
                                    await communitiesDescs.updateOne({communityName: leaving}, {$inc: {membersCount: -1}});
                                    await communitiesJoinedDescs.updateOne({username: uniqueId, joined: leaving}, {$set: {response: "removed", timeStamp: nowUnix}});
                                    
                                    return res.status(200).json({"status": "success"});
                                }
                            }
                        } else {return res.status(200).json({"status": "error"});}
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-watchlist", async (req, res) => 
    {
        try {
            const action = `${req.body.action}`;
            const symbol = `${req.body.symbol}`;
            const uniqueId = `${req.body.uniqueId}`;
            const distinction = `${req.body.distinction}`;
            
            if(!(action === "add" || action === "removed")) {return res.status(200).json({"status": "error"});}
            if(!(distinction === "user" || distinction === "visitor")) {return res.status(200).json({"status": "error"});}

            if(distinction === "user") {
                await usersDescs.findOne(
                    {
                       username: uniqueId 
                    }
                ).then(
                    async (userData) => {
                        if(!userData) {return res.status(200).json({"status": "error"});}
                        
                        if(userData) {
                            let userWatching = [...userData["watchlist"]];

                            if(action === "add") {
                                if(userWatching.includes(symbol)) {
                                    return res.status(200).json({"status": "error"});
                                } else {
                                    userWatching.push(symbol);
                                }
                            } else if(action === "removed") {
                                if(userWatching.includes(symbol)) {
                                    userWatching = userWatching.filter(symbl => symbl !== symbol);
                                } else {
                                    return res.status(200).json({"status": "error"});
                                }
                            }

                            if(symbol.slice(0, 1) === "S") {
                                const result = await axios.post(`http://localhost:8801/api/stock-market-data/modify-watchlist`, req.body);
                                if(result.data["status"] === "success") {
                                    await usersDescs.updateOne({username: uniqueId}, {$set: {watchlist: userWatching}});
                                    return res.status(200).json({"status": "success"});
                                } else {return res.status(200).json({"status": "error"});}
                            } else if(symbol.slice(0, 1) === "C") {
                                const result = await axios.post(`http://localhost:8801/api/crypto-market-data/modify-watchlist`, req.body);
                                if(result.data["status"] === "success") {
                                    await usersDescs.updateOne({username: uniqueId}, {$set: {watchlist: userWatching}});
                                    return res.status(200).json({"status": "success"});
                                } else {return res.status(200).json({"status": "error"});}
                            }
                            
                        }
                    }
                );
            } else {
                if(symbol.slice(0, 1) === "S") {
                    const result = await axios.post(`http://localhost:8801/api/stock-market-data/modify-watchlist`, req.body);
                    if(result.data["status"] === "success") {
                        return res.status(200).json({"status": "success"});
                    } else {
                        return res.status(200).json({"status": "error"});
                    }
                } else if(symbol.slice(0, 1) === "C") {
                    const result = await axios.post(`http://localhost:8801/api/crypto-market-data/modify-watchlist`, req.body);
                    if(result.data["status"] === "success") {
                        return res.status(200).json({"status": "success"});
                    } else {
                        return res.status(200).json({"status": "error"});
                    }
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-recommendation", async (req, res) => 
    {
        try {
            const rec = `${req.body.rec}`;
            const symbol = `${req.body.symbol}`;
            const uniqueId = `${req.body.uniqueId}`;
            const distinction = `${req.body.distinction}`;

            if(symbol.length === 0) {return res.status(200).json({"status": "error"});}
            if(!(rec === "buy" || rec === "hold" || rec === "sell")) {return res.status(200).json({"status": "error"});}
            if(!(distinction === "user" || distinction === "visitor")) {return res.status(200).json({"status": "error"});}

            if(distinction === "user") {
                await usersDescs.findOne(
                    {
                       username: uniqueId 
                    }
                ).then(
                    async (userData) => {
                        if(!userData) {return res.status(200).json({"status": "error"});}
                        
                        if(userData) {
                            const result = await axios.post(`http://localhost:8801/api/stock-market-data/modify-recommendation`, req.body);
                            if(result.data["status"] === "success") {
                                return res.status(200).json({"status": "success"});
                            } else {return res.status(200).json({"status": "error"});}
                        }
                    }
                );
            } else {
                const result = await axios.post(`http://localhost:8801/api/stock-market-data/modify-recommendation`, req.body);
                if(result.data["status"] === "success") {
                    return res.status(200).json({"status": "success"});
                } else {
                    return res.status(200).json({"status": "error"});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/market-specific-holdings", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;
            
            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.put(`http://localhost:8901/api/market/specific-holdings`, req.body);
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/post-engagements", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.put(`http://localhost:8800/api/content/posts/post-engagements`, req.body);
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/post-engage", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.post(`http://localhost:8800/api/content/posts/post-engage`, 
                            {
                                ...req.body,
                                "accountType": userData.accountType,
                                "profileImage": userData.profilePicture
                            }
                        );
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/prediction-engagements", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.put(`http://localhost:8901/api/market/prediction-engagements`, req.body);
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/prediction-engage", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.post(`http://localhost:8901/api/market/prediction-engage`, 
                            {
                                ...req.body,
                                "accountType": userData.accountType,
                                "profileImage": userData.profilePicture
                            }
                        );
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/news-engagements", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.put(`http://localhost:8800/api/content/news/news-engagements`, req.body);
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/news-engage", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.post(`http://localhost:8800/api/content/news/news-engage`, req.body);
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/user-authentication", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        return res.status(200).json({"status": "success", "data": userData});
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/comments-engagements", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.put(`http://localhost:8800/api/content/posts/comments-engagements`, req.body);
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/comments-engage", async (req, res) => 
    {
        try {
            const uniqueId = `${req.body.uniqueId}`;

            await usersDescs.findOne(
                {
                    username: uniqueId 
                }
            ).then(
                async (userData) => {
                    if(!userData) {return res.status(200).json({"status": "error"});}
                    if(userData) {
                        const result = await axios.post(`http://localhost:8800/api/content/posts/comments-engage`, 
                            {
                                ...req.body,
                                "accountType": userData.accountType,
                                "profileImage": userData.profilePicture
                            }
                        );
                        return res.status(200).json(result.data);
                    }
                }
            );
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-accountType", async (req, res) => 
    {
        try {
            const username = `${req.body.username}`;

            await usersDescs.updateOne(
                {username: username},
                {$set: {accountType: "validated"}}
            );
            await accountsWalletDescs.updateOne(
                {username: username},
                {$set: {accountDesignation: "validated"}}
            );

            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-rewards_records", async (req, res) => 
    {
        try {
            const groupId = `${req.body.groupId}`;
            const groupIdAmt = Number(req.body.groupIdAmt);

            const username = `${req.body.username}`;
            const usernameAmt = Number(req.body.usernameAmt);

            const secondaryUsername = `${req.body.secondaryUsername}`;
            const secondaryUsernameAmt = Number(req.body.secondaryUsernameAmt);

            if(isNaN(groupIdAmt) || !isFinite(groupIdAmt)) {return res.status(200).json({"status": "error"});}
            if(isNaN(usernameAmt) || !isFinite(usernameAmt)) {return res.status(200).json({"status": "error"});}
            if(isNaN(secondaryUsernameAmt) || !isFinite(secondaryUsernameAmt)) {return res.status(200).json({"status": "error"});}

            const payoutCategory = determinePayoutCategory();

            if(username !== "") {
                if(payoutCategory === "evening") {
                    await accountsWalletDescs.updateOne(
                        {username: username},
                        {$inc: {aggregateBalance: usernameAmt, pendingBalanceEvening: usernameAmt}}
                    );
                } else if(payoutCategory === "morning") {
                    await accountsWalletDescs.updateOne(
                        {username: username},
                        {$inc: {aggregateBalance: usernameAmt, pendingBalanceMorning: usernameAmt}}
                    );
                }
            }

            if(secondaryUsername !== "") {
                if(payoutCategory === "evening") {
                    await accountsWalletDescs.updateOne(
                        {username: secondaryUsername},
                        {$inc: {aggregateBalance: secondaryUsernameAmt, pendingBalanceEvening: secondaryUsernameAmt}}
                    );
                } else if(payoutCategory === "morning") {
                    await accountsWalletDescs.updateOne(
                        {username: secondaryUsername},
                        {$inc: {aggregateBalance: secondaryUsernameAmt, pendingBalanceMorning: secondaryUsernameAmt}}
                    );
                }
            }

            if(groupId !== "") {
                if(payoutCategory === "evening") {
                    await communitiesDescs.updateOne(
                        {communityName: groupId},
                        {$inc: {aggregateBalance: groupIdAmt, pendingBalanceEvening: groupIdAmt}}
                    );
                } else if(payoutCategory === "morning") {
                    await communitiesDescs.updateOne(
                        {communityName: groupId},
                        {$inc: {aggregateBalance: groupIdAmt, pendingBalanceMorning: groupIdAmt}}
                    );
                }
            }

            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;