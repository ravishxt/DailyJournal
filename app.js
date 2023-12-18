//jshint esversion:6

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const router = require("./routes/UserRouter.js")

const {connectMongoDB} = require("./DB/connect.js");

const ejs = require("ejs");


const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.static("public"));
app.use(express.static(__dirname + '/public'));
app.use(router)

// app.post("/login", (req, res) => {
//   console.log(req.body.title)
//   res.send("OK")
// })

connectMongoDB("mongodb+srv://admin-slinger:sj9alcbpxbxLJ1gL@cluster0.zy1ey.mongodb.net/JournalDB?retryWrites=true&w=majority")

app.listen(PORT, function () {
  console.log(`Server has started on port ${PORT}`);
});