const express = require("express");
const app = express();

const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");

const userDataFeed = require('./router/userDataFeed');
const stockDataFeed = require('./router/stockDataFeed');
const cryptoDataFeed = require('./router/cryptoDataFeed');
const marketDataFeed = require('./router/marketDataFeed');

dotenv.config();
mongoose.connect(process.env.mongo_master_db).then(() => {console.log("api-stockDataFeed is connected to MongoDB")});

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/userDataFeed", userDataFeed);
app.use("/api/stockDataFeed", stockDataFeed);
app.use("/api/cryptoDataFeed", cryptoDataFeed);
app.use("/api/marketDataFeed", marketDataFeed);

app.listen(8802, () => 
    {
        console.log("api-stockDataFeed is live");
    }
);