const express = require('express');

module.exports = (admin) => {
  const router = express.Router();
  const {
      phoneSignUp,
      phoneSignIn
  } = require('../../controllers/user/authUserControllers')(admin);

  router.post('/phone/signup', phoneSignUp);
  router.post('/phone/signin', phoneSignIn);

  return router;
};