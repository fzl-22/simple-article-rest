const express = require("express");

const authController = require("../controllers/auth-controller");
const authValidator = require("../validators/auth-validator");
const isAuth = require("../../../core/middlewares/is-auth-middleware");

const router = express.Router();

router.put("/signup", authValidator.validateSignup(), authController.signup);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getUserStatus);

router.patch(
  "/status",
  isAuth,
  authValidator.validateUpdateUserStatus(),
  authController.updateUserStatus
);

module.exports = router;
