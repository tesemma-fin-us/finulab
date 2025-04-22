const express = require("express");
const app = express();

const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");

const news = require('./router/news');
const posts = require('./router/posts');
const notifications = require('./router/notifications');

dotenv.config();
mongoose.connect(process.env.mongo_content_db).then(() => {console.log("api-content is connected to MongoDB")});

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/content/news", news);
app.use("/api/content/posts", posts);
app.use("/api/content/notifications", notifications);

app.listen(8800, () => 
    {
        console.log("api-content is live");
    }
);