const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const feedRoutes = require("./features/feed/routes/feed-routes");
const authRoutes = require("./features/auth/routes/auth-routes");
const handleError = require("./core/middlewares/error-handler-middleware");
const { DB_URL, PORT, HOST } = require("./core/config/env");

const app = express();

app.use(bodyParser.json());
app.use("/data/images", express.static(path.join(__dirname, "data", "images")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use(handleError);

mongoose
  .connect(DB_URL)
  .then((result) => {
    const server = app.listen(PORT, HOST);
    const io = require("./core/config/socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => {
    console.log(err);
  });
