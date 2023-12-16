const express = require("express");
// const passport = require("../auth/auth")
const router = express.Router();
const {
  handleGetAllEntries,
  handleHomePage,
  // handleAboutPage,
  // handleContactPage,
  handleGetEntryByTitle,
  handleWritePage,
  handleWriteAnEntry,
  handleDeleteEntry,
  handleEntryEdit,
  handleLoginPage,
  handleRegistraion,
  handleLogin,
  handleLogout
} = require("../controllers/user");

let auth_status = false;

router.route("/").get(handleHomePage);
// router.route("/about").get(handleAboutPage);
// router.route("/contact").get(handleContactPage);
router.route("/entries").get(handleGetAllEntries);
router.route("/entries/:title").get(handleGetEntryByTitle);
router.route("/write").get(handleWritePage).post(handleWriteAnEntry);
router.route("/delete").post(handleDeleteEntry);
router.route("/edit").post(handleEntryEdit);
router.route("/register").get(handleRegistraion).post(handleRegistraion);
router.route("/login").get(handleLoginPage).post(handleLogin);
router.route("/logout").get(handleLogout)

module.exports = router;
