const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const datefns = require("date-fns");
const geoLite = require("geoip-lite");
const router = require("express").Router();
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");
const {S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");

const sessionsDesc = require("../models/sessions");
const jwt_accessSecret = require("../models/jwt-accessSecret");
const jwt_refreshSecret = require("../models/jwt-refreshSecret");

dotenv.config();

const region = "us-east-1";
const bucketName = "finulab-dev-profile-images", accessKeyId = process.env.aws_accessKeyId, secretAccessKey = process.env.aws_secretAccessKey;
const postBucketName = "finulab-dev-posts", post_accessKeyId = process.env.aws_postAccessKeyId, post_secretAccessKey = process.env.aws_postSecretAccessKey;

const generateSessionId = async (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    
    let sessionId = '';
    for(let i = 0; i < length; i++) {
        sessionId += chars.charAt(Math.floor(Math.random() * charsLength));
    }

    const date = new Date();
    const nonce_ = datefns.getUnixTime(date);
    sessionId = String(nonce_) + "-" + sessionId;

    return sessionId;
};

const generateAccessToken = async (data, privateKey, allocatedTimePeriod) => {
    if(allocatedTimePeriod !== "none") {
        return jwt.sign(
            {
                session: {
                    user: data.uniqueId
                }
            }, privateKey, {expiresIn: allocatedTimePeriod}
        );
    } else if(allocatedTimePeriod === "none") {
        return jwt.sign(
            {
                session: {
                    user: data.uniqueId
                }
            }, privateKey
        );
    }
};

const verify = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(authHeader) {
        const token = authHeader.split(" ")[1];

        let privateKeyArr = [];
        const potentialPrivateKeys = await jwt_accessSecret.find({}).limit(3).sort({timeStamp: "desc"});
        for(let i = 0; i < potentialPrivateKeys.length; i++) {
            privateKeyArr.push(potentialPrivateKeys[i]["privateKey"]);
        }

        let j = 0;
        do {
            jwt.verify(token, privateKeyArr[j], (error, data) => 
                {
                    if(error && j === (privateKeyArr.length - 1)) {
                        j = privateKeyArr.length;
                        return res.status(403).json({"status": "error"});
                    } else if(error) {
                        j++;
                    } else if(!error) {
                        req.data = data.session;
                        next();
                        j = privateKeyArr.length;
                    }
                }
            );
        } while(j < privateKeyArr.length)
    } else {
        return res.status(401).json({"status": "error"});
    }
};

router.post("/region", async (req, res) => 
    {
        try {
            const today = new Date();
            const nowUnix = datefns.getUnixTime(today);

            const cookie = req.cookies.sessionId;
            if(cookie === undefined || cookie === null || cookie.length === 0) {
                let ipv4, city, state, country;
                if(req.body.ipv4 === null || req.body.ipv4 === undefined || req.body.ipv4 === "") {
                    return res.status(403).json({"status": "error"});
                } else {
                    ipv4 = req.body.ipv4;
                }

                const geo = geoLite.lookup(ipv4);
                if(geo === undefined || geo === null) {
                    if(req.body.city === undefined || req.body.city === null || req.body.city === "") {
                        city = "undetermined";
                    } else {
                        city = req.body.city;
                    }

                    if(req.body.state === undefined || req.body.state === null || req.body.state === "") {
                        state = "undetermined";
                    } else {
                        state = req.body.state;
                    }
                    
                    if(req.body.country === undefined || req.body.country === null || req.body.country === "") {
                        country = "undetermined";
                    } else {
                        country = req.body.country;
                    }
                } else {
                    if("city" in geo) {
                        city = geo["city"];
                    } else {
                        city = "undetermined";
                    }

                    if("region" in geo) {
                        state = geo["region"];
                    } else {
                        state = "undetermined";
                    }

                    if("country" in geo) {
                        country = geo["country"];
                    } else {
                        state = "undetermined";
                    }
                }

                const sessionId = await generateSessionId(5);
                const data = {"uniqueId": String(ipv4) + "-" + sessionId};
                const privateAccessKeyObject = await jwt_accessSecret.findOne({}).sort({timeStamp: 'desc'});
                const privateRefreshKeyObject = await jwt_refreshSecret.findOne({}).sort({timeStamp: 'desc'});
                const accessToken = await generateAccessToken(data, privateAccessKeyObject['privateKey'], "10m");
                const refreshToken = await generateAccessToken(data, privateRefreshKeyObject['privateKey'], "32 days");
                
                const newSession = new sessionsDesc(
                    {
                        ipv4: ipv4,
                        uniqueId: String(ipv4) + "-" + sessionId,
                        lastVisit: nowUnix,
                        convertedUser: "false",
                        affiliatedUsername: "",
                        attemptsToRecoverAccount: 0,
                        refreshToken: refreshToken,
                        city: city,
                        state: state,
                        country: country,
                        createdAt: nowUnix
                    }
                );
                await newSession.save();

                return res.status(200).cookie("sessionId", refreshToken, 
                    {
                        sameSite: 'strict', 
                        path: '/', 
                        expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000), 
                        httpOnly: true
                        //secure: true
                    }
                ).json({"accessToken": accessToken});
            } else {
                const jwt_session = jwt.decode(cookie).session["user"];
                await sessionsDesc.findOne(
                    {
                        uniqueId: jwt_session
                    }
                ).then(
                    async (sessionData) => {
                        if(!sessionData) {
                            res.clearCookie("sessionId");
                            return res.status(403).json({"status": "error"});
                        }

                        if(sessionData) {
                            const jwt_data = {"uniqueId": jwt_session};
                            const privateAccessKeyObject = await jwt_accessSecret.findOne({}).sort({timeStamp: 'desc'});
                            const privateRefreshKeyObject = await jwt_refreshSecret.findOne({}).sort({timeStamp: 'desc'});

                            const accessToken = await generateAccessToken(jwt_data, privateAccessKeyObject['privateKey'], "10m");
                            const refreshToken = await generateAccessToken(jwt_data, privateRefreshKeyObject['privateKey'], "32 days");

                            await sessionsDesc.updateOne({uniqueId: jwt_session}, {lastVisit: nowUnix, refreshToken: refreshToken});
                            res.clearCookie("sessionId");
                            return res.status(200).cookie("sessionId", refreshToken, 
                                {
                                    sameSite: 'strict', 
                                    path: '/', 
                                    expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000), 
                                    httpOnly: true
                                    //secure: true
                                }
                            ).json({"accessToken": accessToken});
                        }
                    }
                )
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/region-update", async (req, res) => 
    {
        try {
            const today = new Date();
            const nowUnix = datefns.getUnixTime(today);

            const cookie = req.cookies.sessionId;
            if(cookie === undefined || cookie === null || cookie.length === 0) {
                return res.status(401).json({"status": "error"});
            } else {
                const jwt_session = jwt.decode(cookie).session["user"];
                await sessionsDesc.findOne(
                    {
                        uniqueId: jwt_session
                    }
                ).then(
                    async (sessionData) => {
                        if(!sessionData) {
                            res.clearCookie("sessionId");
                            return res.status(403).json({"status": "error"});
                        }

                        if(sessionData) {
                            const jwt_data = {"uniqueId": jwt_session};
                            const privateAccessKeyObject = await jwt_accessSecret.findOne({}).sort({timeStamp: 'desc'});
                            const privateRefreshKeyObject = await jwt_refreshSecret.findOne({}).sort({timeStamp: 'desc'});
                            
                            const accessToken = await generateAccessToken(jwt_data, privateAccessKeyObject['privateKey'], "10m");
                            const refreshToken = await generateAccessToken(jwt_data, privateRefreshKeyObject['privateKey'], "32 days");

                            await sessionsDesc.updateOne({uniqueId: jwt_session}, {lastVisit: nowUnix, refreshToken: refreshToken});
                            res.clearCookie("sessionId");
                            return res.status(200).cookie("sessionId", refreshToken, 
                                {
                                    sameSite: 'strict', 
                                    path: '/', 
                                    expires: new Date(new Date().getTime() + (14 * 24 * 60 * 60) * 1000), 
                                    httpOnly: true
                                    //secure: true
                                }
                            ).json({"accessToken": accessToken});
                        }
                    }
                );
            }
        } catch(error) {
            console.log(error);
            return res.status(500).json({"status": "error"});
        }
    }
);

const postClient = new S3Client({
    region: region,
    credentials: {
        accessKeyId: post_accessKeyId,
        secretAccessKey: post_secretAccessKey,
    }
});
const generatePostS3UploadUrl = async (username, type) => {
    const now = new Date();
    const unixNow = datefns.getUnixTime(now);
    const imagePathIntermediate = await generateSessionId(50);
    const imagePath = imagePathIntermediate.slice(0, Math.floor(imagePathIntermediate.length / 2)) + String(username) + String(unixNow) + imagePathIntermediate.slice(Math.floor(imagePathIntermediate.length / 2), imagePathIntermediate.length) + ".jpeg";

    const command = new PutObjectCommand(
        {
            Bucket: postBucketName,
            Key: imagePath,
            ContentType: type === "image" ? 'image/jpeg' : 'video/mp4'
        }
    );

    const s3UploadUrl = await getSignedUrl(postClient, command, { expiresIn: 300 });
    
    return s3UploadUrl;
}

const profileClient = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    }
});
const generateProfileS3UploadUrl = async (username) => {
    const now = new Date();
    const unixNow = datefns.getUnixTime(now);
    const imagePathIntermediate = await generateSessionId(50);
    const imagePath = imagePathIntermediate.slice(0, Math.floor(imagePathIntermediate.length / 2)) + String(username) + String(unixNow) + imagePathIntermediate.slice(Math.floor(imagePathIntermediate.length / 2), imagePathIntermediate.length) + ".jpeg";

    const command = new PutObjectCommand(
        {
            Bucket: bucketName,
            Key: imagePath,
            ContentType: 'image/jpeg'
        }
    );

    const s3UploadUrl = await getSignedUrl(profileClient, command, { expiresIn: 300 });

    return s3UploadUrl;
}

module.exports = router;
module.exports.verify = verify;
module.exports.generateSessionId = generateSessionId;
module.exports.generateAccessToken = generateAccessToken;
module.exports.generatePostS3UploadUrl = generatePostS3UploadUrl;
module.exports.generateProfileS3UploadUrl = generateProfileS3UploadUrl;