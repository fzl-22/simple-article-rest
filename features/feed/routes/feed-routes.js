const express = require("express");

const feedValidator = require("../validators/feed-validator");
const feedController = require("../controllers/feed-controller");
const isAuth = require("../../../core/middlewares/is-auth-middleware");
const storage = require("../../../core/middlewares/storage-middleware");

const router = express.Router();

router.get("/posts", isAuth, feedController.getPosts);

router.post(
  "/post",
  isAuth,
  storage.uploadImage.single("image"),
  feedValidator.validateCreatePost(),
  feedController.createPost
);

router.get("/post/:postId", isAuth, feedController.getPost);

router.put(
  "/post/:postId",
  isAuth,
  storage.uploadImage.single("image"),
  feedValidator.validateUpdatePost(),
  feedController.updatePost
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
