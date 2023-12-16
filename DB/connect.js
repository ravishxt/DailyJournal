const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

connectMongoDB = async (url) => {
  // console.log("Connecting...");
  mongoose
    .connect(url)
    .then(() => console.log("Database Connected!"))
    .catch((err) => console.log(err));
};

module.exports = {
  connectMongoDB,
};
