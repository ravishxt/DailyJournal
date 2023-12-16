const _ = require("lodash");
const { User, Entry } = require("../DB/models/UserModel");

var crypto = require("crypto");

let updateFlag = false;
let updateId;
let userEmail = "";
let username = "";
let userPassword = "";
let userId = "";
let userAvatar = "";
let firstLogin = false;

let avatarMale = "https://api.dicebear.com/7.x/adventurer/svg?seed=Cuddles";
let avatarFemale =
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Harley&eyebrows=variant10&eyes=variant02&glasses[]&hair=long19&hairColor=85c2c6&skinColor=f2d3b1";

let entries = [{ title: "", body: "" }];
let data = {
  isLoggedIn: false,
  userEmail: userEmail,
  username: username,
  entriesToShow: entries,
  entry: {
    entryTitle: "",
    entryBody: "",
    entryDate: "",
  },
  avatarAvailable: [avatarMale, avatarFemale],
  avatar: userAvatar,
};

// ####################### HOME ############################

handleHomePage = (req, res) => {
  res.render("pages/home", data);
};

// ####################### REGSITRATION ############################

handleRegistraion = async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const avatar = req.body.avatar;
  try {
    await User.find({ email: userEmail })
      .exec()
      .then(async (user) => {
        if (user.length);
        else {
          let createdSalt = crypto.randomBytes(16).toString("hex");
          let createdHash = crypto
            .pbkdf2Sync(password, createdSalt, 10000, 64, `sha512`)
            .toString(`hex`);
          const user = new User({
            email: email,
            username: username,
            salt: createdSalt,
            hash: createdHash,
            avatar: avatar,
          });
          await user.save();
          req.session.isLoggedIn = true;
          data.username = username;
          req.session.username = username;
          userAvatar = avatar;
          data.avatar = userAvatar == "male" ? avatarMale : avatarFemale;
          res.status(201).redirect("/");
        }
      });
  } catch (error) {
    console.log(error);
  }
  res.render("pages/register", data);
};

// ####################### LOGIN ############################

const checkUserValid = (user, givenPassword) => {
  let newHash = crypto
    .pbkdf2Sync(givenPassword, user[0].salt, 10000, 64, `sha512`)
    .toString(`hex`);
  return user[0].hash == newHash;
};

let code = 0;
handleLogin = async (req, res) => {
  userEmail = req.body.email;
  userPassword = req.body.password;
  await User.find({ email: userEmail })
    .exec()
    .then((user) => {
      if (user.length) {
        if (checkUserValid(user, userPassword)) {
          userId = user[0]._id;
          data.username = user[0].username;
          req.session.isLoggedIn = true;
          req.session.username = user[0].username;
          userAvatar = user[0].avatar;
          data.avatar = userAvatar == "male" ? avatarMale : avatarFemale;
          firstLogin = true;
          // data.isLoggedIn = req.session.isLoggedIn;
          // data.username = req.session.username;
        } else if (
          user[0].email == userEmail &&
          user[0].password != userPassword
        )
          code = 401;
      } else code = 1001;
    });
  res.redirect("/entries");
};

handleLoginPage = (req, res) => {
  res.render("pages/login", {
    error: code,
    isLoggedIn: req.session.isLoggedIn,
  });
};

// ####################### LOGOUT ############################

handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      data.isLoggedIn = false;
      res.redirect("/");
    }
  });
};

// ####################### GET ENTRIES ############################

handleGetAllEntries = async (req, res) => {
  if (req.session.isLoggedIn) {
    data.isLoggedIn = req.session.isLoggedIn;
    await Entry.find({ author: userEmail })
      .exec()
      .then((foundItems) => {
        if (foundItems.length) {
          entries.length = 0;
          foundItems.forEach((item) => {
            let date = item.createdAt.getDate();
            let month = item.createdAt.toLocaleString("default", {
              month: "long",
            });
            let year = item.createdAt.getFullYear();
            let finalDate = month + " " + date + ", " + year;
            entries.push({ ...item._doc, date: finalDate });
          });
          res.render("pages/entries", {
            ...data,
            entriesToShow: entries.reverse(),
          });
        } else {
          res.render("pages/entries", {
            ...data,
            entriesToShow: [{ title: "", body: "" }],
            entry: {
              ...data.entry,
              entryTitle: "",
              entryBody: "",
            },
          });
        }
      });
  } else res.redirect("login");
};

handleGetEntryByTitle = async (req, res) => {
  const requestedTitle = req.params.title;
  entries.every((entryItem) => {
    if (_.lowerCase(entryItem.title) === _.lowerCase(requestedTitle)) {
      res.render("pages/entry", {
        ...data,
        entry: {
          ...data.entry,
          entryTitle: entryItem.title,
          entryBody: entryItem.body,
          entryDate: entryItem.date,
        },
      });
      return false;
    } else {
      return true;
    }
  });
};

// ####################### WRITE ############################

handleWritePage = (req, res) => {
  if (req.session.isLoggedIn) {
    res.render("pages/write", {
      ...data,
      entry: {
        ...data.entry,
        entryTitle: "",
        entryBody: "",
      },
    });
  } else res.redirect("/login");
};

handleWriteAnEntry = async (req, res) => {
  const title = req.body.title;
  const body = req.body.entryBody;
  if (updateFlag === true) {
    // Update the database
    await Entry.findByIdAndUpdate(updateId, { title: title, body: body });
    updateFlag = false;
  } else {
    const entry = new Entry({
      author: userEmail,
      title: title,
      body: body,
      userId: userId,
    });
    await entry.save();
  }
  res.redirect("/entries");
};

// ####################### DELETE ############################

handleDeleteEntry = async (req, res) => {
  const itemToBeDeleted = req.body.itemToBeDeleted;
  await Entry.findByIdAndDelete(itemToBeDeleted)
    .then((response) => res.redirect("/entries"))
    .catch((err) => console.log(err));
};

// ####################### EDIT ############################

handleEntryEdit = async (req, res) => {
  const itemToBeEdited = req.body.itemToBeEdited;
  let entryTitle = "";
  let entryBody = "";
  await Entry.findById(itemToBeEdited)
    .exec()
    .then((foundItem) => {
      if (foundItem.length != 0) {
        data.entry.entryTitle = foundItem.title;
        data.entry.entryBody = foundItem.body;
        updateFlag = true;
        updateId = itemToBeEdited;
        res.render("pages/write", data);
      }
    });
};

module.exports = {
  handleGetAllEntries,
  handleHomePage,
  handleGetEntryByTitle,
  handleWritePage,
  handleWriteAnEntry,
  handleDeleteEntry,
  handleEntryEdit,
  handleLoginPage,
  handleRegistraion,
  handleLogin,
  handleLogout,
};
