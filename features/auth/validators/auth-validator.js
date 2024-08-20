const { body } = require("express-validator");

const User = require("../models/user");

exports.validateSignup = () => {
  return [
    body("name").trim().not().isEmpty(),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email,")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 8 }),
  ];
};

exports.validateUpdateUserStatus = () => {
  return [
    body("status").trim().notEmpty(),
  ]
}