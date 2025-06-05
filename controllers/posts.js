const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      const comments = await Comment.find().lean();
      const users = await User.find().lean();
      // Get users to show on feed
      const user = {};
      users.forEach((el) => {
        user[el._id] = el.userName;
      });
      res.render("profile.ejs", {
        posts: posts,
        currentUser: req.user,
        user: user,
        comments: comments,
      });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      const comments = await Comment.find().lean();
      const users = await User.find().lean();
      // Get users to show on feed
      const user = {};
      users.forEach((el) => {
        user[el._id] = el.userName;
      });
      res.render("feed.ejs", { posts: posts, user: user, comments: comments });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const users = await User.find().lean();
      // Get users to show on feed
      const user = {};
      users.forEach((el) => {
        user[el._id] = el.userName;
      });
      const comments = await Comment.find({ post: req.params.id })
        .sort({ createdAt: "desc" })
        .lean();
      res.render("post.ejs", {
        post: post,
        user: user,
        currentUser: req.user.id,
        comments: comments,
      });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(req.get("referer"));
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.deleteOne({ _id: req.params.id });
      console.log("Deleted Post");
      await Comment.deleteMany({ post: req.params.id });
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
  addComment: async (req, res) => {
    try {
      await Comment.create({
        text: req.body.commentText,
        post: req.params.id,
        user: req.user.id,
      });
      console.log("Comment has been added!");
      res.redirect(req.get("referer"));
    } catch (error) {
      console.error(error);
    }
  },
};
