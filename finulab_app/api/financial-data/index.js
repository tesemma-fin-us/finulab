const express = require("express");
const app = express();

const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");

const stockMarketData = require('./router/stock-market-data');
const cryptoMarketData = require('./router/crypto-market-data');

dotenv.config();
mongoose.connect(process.env.mongo_financialData_db).then(() => {console.log("api-financialData is connected to MongoDB")});

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/stock-market-data", stockMarketData);
app.use("/api/crypto-market-data", cryptoMarketData);

app.listen(8801, () => 
    {
        console.log("api-financialData is live");
    }
);