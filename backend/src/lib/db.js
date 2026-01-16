import mongoose from "mongoose" // allow us to communicate with our database
import { ENV } from "./env.js" //get our ENV object >> as env.js is a local file, we write its extension

export const connectDB = async () => {
    try {
        if (!ENV.DB_URL) {
            throw new Error("DB_URL is not defined in environment variables");
        }
        const conn = await mongoose.connect(ENV.DB_URL)
        console.log("connected to mongodb:", conn.connection.host)
    } catch (error) {
        console.error("Error connecting to mongoDB", error)
        process.exit(1) // 0 means the process succeded, 1 means failure
    }
};