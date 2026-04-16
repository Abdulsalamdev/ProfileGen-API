const mongoose = require("mongoose");
require("dotenv").config();

const URL = process.env.MONGODB_URL;

const connectDB = async () => {
  try {
    if(!URL) {
      throw new Error("MONGODB_URL is not defined in the env")
    }
    const conn = await mongoose.connect(URL, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
      family: 4, // fixes DNS issues (VERY important for your error)
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
