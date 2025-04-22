const express = require("express");
const app = express();

const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");

const users = require('./router/users');
const wallet = require('./router/wallet');
const communities = require('./router/communities');

dotenv.config();
mongoose.connect(process.env.mongo_finux_network_db).then(() => {console.log("api-finuxNetwork is connected to MongoDB")});

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/users", users);
app.use("/api/wallet", wallet);
app.use("/api/communities", communities);

app.listen(8900, () => 
    {
        console.log("api-finuxNetwork is live");
    }
);