const express = require('express');
const { check, body } = require('express-validator');
const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .normalizeEmail(),
  ],
  authController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      // .custom((value, { req }) => {
      //   if (value === 'test@test.com') {
      //     throw new Error('This email addres is forbidden');
      //   }
      //   return true;
      // }),
      .normalizeEmail()
      .trim()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject('Email already exists, pick a new one');
        }
      }),
    body(
      'password',
      'Please enter a valid password with only numbers and text, and at least 5 characters'
    ) // tbm pode ser check
      .trim()
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password have to match');
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post(
  '/reset',
  [body('email').isEmail().withMessage('Please insert a valid email')],
  authController.postReset
);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
