const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { User, Entry } = require("../DB/models/UserModel");
const jwtService = require("../auth/jwt");

const avatarMale = "https://api.dicebear.com/7.x/adventurer/svg?seed=Cuddles";
const avatarFemale = "https://api.dicebear.com/7.x/adventurer/svg?seed=Harley&eyebrows=variant10&eyes=variant02&glasses[]&hair=long19&hairColor=85c2c6&skinColor=f2d3b1";

let updateFlag = false;
let updateId;

const getAvatarUrl = (avatar) => (avatar === "male" ? avatarMale : avatarFemale);

// ####################### REGISTRATION ############################
const handleRegistration = async (req, res) => {
  const { email, username, password, avatar } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, username, password: hashedPassword, avatar });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      username,
      avatar: getAvatarUrl(avatar),
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ####################### LOGIN ############################
const handleLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { userId: user._id, username: user.username, avatar: user.avatar };
    const token = jwtService.signToken(payload);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        avatar: getAvatarUrl(user.avatar),
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed due to server error" });
  }
};

// ####################### LOGOUT ############################
const handleLogout = (req, res) => {
  // In JWT-based auth, logout is handled client-side by removing the token.
  res.status(200).json({ message: "Logged out successfully" });
};

// ####################### GET ENTRIES ############################
const handleGetAllEntries = async (req, res) => {
  try {
    const foundEntries = await Entry.find({ userId: req.user.userId });

    const entries = foundEntries.map((item) => ({
      title: item.title,
      body: item.body,
      date: item.createdAt.toLocaleDateString("default", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    }));

    res.status(200).json({ entries });
  } catch (error) {
    res.status(401).json({ error: "Unauthorized or failed to retrieve entries" });
  }
};

// ####################### WRITE ############################
const handleWriteAnEntry = async (req, res) => {
  const { entryTitle, entryBody } = req.body;

  try {
    if (updateFlag) {
      await Entry.findByIdAndUpdate(updateId, { title: entryTitle, body: entryBody });
      updateFlag = false;
    } else {
      const newEntry = new Entry({
        author: req.user.username || "Anonymous",
        title: entryTitle,
        body: entryBody,
        userId: req.user.userId,
      });
      await newEntry.save();
    }

    res.status(201).json({ message: "Entry saved successfully" });
  } catch (error) {
    console.error("Error handling entry:", error);
    res.status(500).json({ error: "Failed to save entry" });
  }
};

// ####################### DELETE ############################
const handleDeleteEntry = async (req, res) => {
  const { itemToBeDeleted } = req.body;
  try {
    await Entry.findByIdAndDelete(itemToBeDeleted);
    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
};

// ####################### EDIT ############################
const handleEntryEdit = async (req, res) => {
  const { itemToBeEdited } = req.body;
  try {
    const entry = await Entry.findById(itemToBeEdited);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    updateFlag = true;
    updateId = itemToBeEdited;
    res.status(200).json({ entryTitle: entry.title, entryBody: entry.body });
  } catch (error) {
    res.status(500).json({ error: "Failed to edit entry" });
  }
};

module.exports = {
  handleRegistration,
  handleLogin,
  handleLogout,
  handleGetAllEntries,
  handleWriteAnEntry,
  handleDeleteEntry,
  handleEntryEdit,
};
