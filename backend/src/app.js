require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const configuredFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === configuredFrontendUrl || /^http:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hrspace-api" });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
