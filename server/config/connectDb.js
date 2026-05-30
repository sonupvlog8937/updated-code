import mongoose from "mongoose";
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

if (!process.env.MONGODB_URI) {
    throw new Error(
        "Please provide MONGODB_URI in the .env file"
    )
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("connect DB")
    } catch (error) {
        console.log("Mongodb connect error", error)
        process.exit(1);
    }
}

export default connectDB;
