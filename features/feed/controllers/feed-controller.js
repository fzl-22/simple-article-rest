const fs = require("fs/promises");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../../../core/config/socket");
const Post = require("../models/post");
const User = require("../../auth/models/user");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.find().countDocuments();

    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const image = req.file;
    const errors = validationResult(req);

    if (!image) {
      const error = new Error("No image provided.");
      error.statusCode = 422;
      throw error;
    }

    if (!errors.isEmpty()) {
      await fs.unlink(image.path);
      const error = new Error("Validation failed, entered data is incorrect");
      error.statusCode = 422;
      throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = image.path;

    // create post in db
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: req.userId,
    });

    await post.save();

    const user = await User.findById(req.userId);
    user.posts.push(post);

    await user.save();

    // send created post to all user via websocket
    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });

    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: {
        _id: user._id,
        name: user.name,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Post fetched successfully.",
      post: post,
    });
  } catch (e) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      await fs.unlink(req.file.path);
      const error = new Error("Validation failed, entered data is incorrect");
      error.statusCode = 422;
      throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
      imageUrl = req.file.path;
    }
    if (!imageUrl) {
      const error = new Error("No file picked.");
      error.statusCode = 422;
      throw error;
    }

    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not authorized!");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    const result = await post.save();

    io.getIO().emit("posts", { action: "update", post: result });

    res.status(200).json({
      message: "Post updated successfully",
      post: result,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized!");
      error.statusCode = 403;
      throw error;
    }

    // delete post and associated image in disk
    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(postId);

    // delete the post in user document
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    io.getIO().emit("posts", { action: "delete", post: postId });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = async (filePath) => {
  try {
    filePath = path.join(__dirname, "..", "..", "..", filePath);
    await fs.unlink(filePath);
  } catch (err) {
    console.log(err);
  }
};
