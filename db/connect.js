const mongoose = require("mongoose");

const connectDB = (uri) => {
    const url = uri || process.env.MONGO_URI;
    return mongoose.connect(url);
};

module.exports = connectDB;