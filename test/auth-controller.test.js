const { expect } = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");

const User = require("../features/auth/models/user");
const authController = require("../features/auth/controllers/auth-controller");
const { TEST_DB_URL } = require("../core/config/env");

const createRandomString = () => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < charactersLength) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

describe("authController.login", function () {
  it("should throw an error with code 500 if accessing the database fails", function (done) {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "test@test.com",
        password: "test",
      },
    };

    authController
      .login(req, {}, () => {})
      .then((result) => {
        expect(result).to.be.an("error");
        expect(result).to.have.property("statusCode", 500);
        done();
      })
      .catch((err) => {
        // this catch is called when the expectation fails
        done(err);
      })
      .finally(() => {
        User.findOne.restore();
      });
  });
});

describe("authController.getUserStatus", function () {
  let testUser;

  // only run once when the describe runs, use `beforeEach` to run like `before` but for every test cases (it)
  before(function (done) {
    mongoose
      .connect(TEST_DB_URL)
      .then((result) => {
        const user = new User({
          email: createRandomString(),
          password: createRandomString(),
          name: createRandomString(),
        });
        return user.save();
      })
      .then((user) => {
        testUser = user;
        done();
      })
      .catch((err) => done(err));
  });

  it("should send a response with a valid user status for an existing user", function (done) {
    const req = { userId: testUser._id };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };

    authController
      .getUserStatus(req, res, () => {})
      .then(() => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.userStatus).to.be.equal("I am new!");
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  // only run once when the describe finished, use `afterEach` to run like `after` but for every test cases (it)
  after(function (done) {
    User.deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => done());
  });
});
