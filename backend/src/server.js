import express from "express";
import { ENV } from "./lib/env.js";
// create an app
const app = express();

console.log(ENV.PORT);
console.log(ENV.DB_URL);

// create a route
app.get("/health", (req, res) => {
    res.status(200).json({ msg: "api is up and running" });
});
// listen to a port
app.listen(ENV.PORT, () => {
    console.log("Server is running on port", ENV.PORT);
});
