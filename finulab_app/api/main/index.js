const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");

const auth = require('./router/auth');
const news = require('./router/news');
const posts = require('./router/posts');
const users = require('./router/users');
const wallet = require('./router/wallet');
const market = require('./router/market');
const communities = require('./router/communities');
const notifications = require('./router/notifications');
const stockDataFeed = require('./router/stockDataFeed');
const cryptoDataFeed = require('./router/cryptoDataFeed');
const stockMarketData = require("./router/stockMarketData");
const cryptoMarketData = require("./router/cryptoMarketData");

dotenv.config();
mongoose.connect(process.env.mongo_sessions_db).then(() => {console.log("api-main is connected to MongoDB")});

app.use(cors({credentials: true, origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://10.0.0.90:3000", "http://10.0.0.135:3000", "http://10.0.0.4:3000"]}));
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cookieParser());

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/wallet", wallet);
app.use("/api/market", market);
app.use("/api/content/news", news);
app.use("/api/content/posts", posts);
app.use("/api/communities", communities);
app.use("/api/notifications", notifications);
app.use("/api/stockDataFeed", stockDataFeed);
app.use("/api/cryptoDataFeed", cryptoDataFeed);
app.use("/api/stock-market-data", stockMarketData);
app.use("/api/crypto-market-data", cryptoMarketData)

app.listen(3001, () => 
    {
        console.log("api-main is live");
    }
);