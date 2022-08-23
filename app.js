//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const ejs = require("ejs");
const _ = require('lodash');

const PORT = process.env.PORT || 3000;

mongoose.connect("mongodb+srv://admin-slinger:sj9alcbpxbxLJ1gL@cluster0.zy1ey.mongodb.net/blogDB")

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const posts = [];
const postSchema = {
  title: {
    type: String,
    required: [true, "Title can not be empty."]
  },
  content: {
    type: String,
    required: [true, "Post can not be empty."]
  }
}

const Post = mongoose.model("Post", postSchema);



app.get("/", (req, res) => {
  res.render("home", { startingContent: homeStartingContent });
});

app.get("/about", (req, res) => {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", (req, res) => {
  res.render("contact", { contactContent: contactContent });
});

app.get("/posts", (req, res) => {
  Post.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      console.log("No posts available");
      res.render("posts", { posts: [{ title: "", content: "" }] });

    } else res.render("posts", { posts: foundItems });
  })
});

app.get("/posts/:title", (req, res) => {
  const requestedTitle = req.params.title;

  posts.forEach((post) => {
    if (_.lowerCase(post.title) === _.lowerCase(requestedTitle)) {
      const content = {
        postTitle: post.title,
        postBody: post.content
      }
      res.render("post", content);
    }
  })

});

app.get("/compose", (req, res) => {
  res.render("compose", { postTitle: "", postContent: "" });
});

app.post("/compose", (req, res) => {
  const title = req.body.title;
  const content = req.body.postContent;
  if (updateFlag === true) {
    // Update the database
    Post.findByIdAndUpdate(updateId, {title: title, content: content}, (err) => console.log(err))
    updateFlag = false;
  } else {
    const post = new Post({
      title: title,
      content: content
    });
    post.save();
  }
  res.redirect("/posts");
});

app.post("/delete", (req, res) => {
  const itemToBeDeleted = req.body.itemToBeDeleted;
  Post.findByIdAndDelete(itemToBeDeleted, (err) => {
    if (!err) {
      res.redirect("/posts");
    } else console.log(err);
  })
});

let updateFlag = false;
let updateId;

app.post("/edit", (req, res) => {
  const itemToBeEdited = req.body.itemToBeEdited;
  let postTitle = "";
  let postContent = "";
  Post.findById(itemToBeEdited, (err, foundItem) => {
    if (!err) {
      postTitle = foundItem.title;
      postContent = foundItem.content;
      updateFlag = true;
      updateId = itemToBeEdited;
      res.render(("compose"), { postTitle: postTitle, postContent: postContent });
      
    } else console.log(err);
  });
});


app.listen(PORT, function () {
  console.log(`Server has started on port ${PORT}`);
});
