const { expect } = require("chai");
const jwt = require("jsonwebtoken");
const sinon = require("sinon");

const isAuthMiddleware = require("../core/middlewares/is-auth-middleware");

describe("isAuthMiddleware", function () {
  it("should throw an error if no authorization header is present", function () {
    const req = {
      get: function (headerName) {
        return null;
      },
    };

    expect(() => isAuthMiddleware(req, {}, () => {})).to.throw(
      /^Not authenticated.$/
    );
  });

  it("should throw an error if the authorization header is only one string", function () {
    const req = {
      get: function (headerName) {
        return "xyz";
      },
    };

    expect(() => isAuthMiddleware(req, {}, () => {})).to.throw();
  });

  it("should throw an error if the token cannot be verified", function () {
    const req = {
      get: function (headerName) {
        return "Bearer xyz";
      },
    };

    expect(() => isAuthMiddleware(req, {}, () => {})).to.throw();
  });

  it("should yield a userId after successfully decoding the token", function () {
    const req = {
      get: function (headerName) {
        return "Bearer xyzsdfsrfsf";
      },
    };

    sinon.stub(jwt, "verify");
    jwt.verify.returns({ userId: "abc" });

    isAuthMiddleware(req, {}, () => {});

    expect(req).to.have.property("userId");
    expect(req).to.have.property("userId", "abc");
    expect(jwt.verify.called).to.be.true;

    jwt.verify.restore();
  });
});
