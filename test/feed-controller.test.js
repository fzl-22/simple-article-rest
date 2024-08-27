const { expect } = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");

const io = require("../core/config/socket");
const User = require("../features/auth/models/user");
const Post = require("../features/feed/models/post");
const feedController = require("../features/feed/controllers/feed-controller");
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

describe("feedController.createPost", function () {
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
        sinon.stub(io, "getIO");
        io.getIO.returns({
          emit: function () {},
        });
        done();
      })
      .catch((err) => done(err));
  });

  it("should add a created post to the posts of the creator", function (done) {
    const req = {
      body: {
        title: "Test Post",
        content: "A Test Post",
      },
      file: {
        path: "abc",
      },
      userId: testUser._id.toString(),
    };

    const res = {
      status: function () {
        return this;
      },
      json: function () {},
    };

    feedController
      .createPost(req, res, () => {})
      .then((user) => {
        expect(user).to.have.property("posts");
        expect(user.posts).to.have.length(1);
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
        io.getIO.restore();
        return mongoose.disconnect();
      })
      .then(() => done());
  });
});
