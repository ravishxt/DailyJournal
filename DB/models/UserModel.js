const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: [true] },
    username: {type: String, required: [true]},
    salt: {type: String, required: [true]},
    hash: { type: String, required: [true] },
    avatar: {type: String, required: [true]},
    // bio: String,
    // image: String,
    // hash: String,
    // salt: String,
  },
  { timestamps: true }
);

const EntrySchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: [true, "Author can not be empty."],
    },
    title: {
      type: String,
      required: [true, "Title can not be empty."],
    },
    body: {
      type: String,
      required: [true, "Post can not be empty."],
    },
    userId: {
      type: String,
      required: [true],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("Users", UserSchema);
const Entry = mongoose.model("Entries", EntrySchema);

module.exports = { User, Entry };
