import express from "express";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
// create an app
const app = express();

console.log(ENV.PORT);
console.log(ENV.DB_URL);

// create a route
app.get("/health", (req, res) => {
    res.status(200).json({ msg: "api is up and running" });
});

// start the server and connect to the database first
const startServer = async () => {
    try {
        await connectDB();
        app.listen(ENV.PORT, () => {
            console.log("Server is running on port", ENV.PORT);
        });
    }
    catch (error) {
        console.error("Failed to start server", error);
    }
};
startServer();