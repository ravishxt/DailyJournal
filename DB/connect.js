const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

const connectMongoDB = async (url) => {
  try {
    await mongoose.connect(url || 'mongodb://localhost:27017/daily-journal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = {
  connectMongoDB,
};
