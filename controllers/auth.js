const User = require('../models/user');
const Email = require('../util/email');
const generateToken = require('../util/generateToken');
const { validationResult } = require('express-validator');

exports.getLogin = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    errorMessage: message.length > 0 ? message[0] : null,
    oldInputs: {
      email: '',
      password: '',
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message.length > 0 ? message[0] : null,
    oldInputs: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: [],
  });
};

const setSession = async (req, res, user, redirectTo) => {
  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save();
  res.redirect(redirectTo);
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInputs: {
        email,
        password,
      },
      validationErrors: errors.array(),
    });
  }
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }
    if (!(await user.correctPassword(password, user.password))) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }
    await setSession(req, res, user, '/');
  } catch (err) {
    console.log(err);
  }
};

exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInputs: {
        email,
        password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  try {
    const newUser = new User({
      email: email,
      password: password,
      cart: { items: [] },
    });
    await newUser.save();
    await setSession(req, res, newUser, '/');
    await new Email(newUser).sendWelcome();
  } catch (err) {
    console.log(err);
  }
};

exports.postLogout = async (req, res, next) => {
  await req.session.destroy();
  res.redirect('/');
};

exports.getReset = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message.length > 0 ? message[0] : null,
    validationErrors: [],
    oldInputs: { email: '' },
  });
};

exports.postReset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('auth/reset', {
      path: '/reset',
      pageTitle: 'Reset Password',
      validationErrors: errors.array(),
      errorMessage: errors.array()[0].msg,
      oldInputs: { email: req.body.email },
    });
  }
  try {
    const token = await generateToken();
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash('error', 'User email does not exists.');
      return res.redirect('/reset');
    }
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hora
    await user.save();
    await new Email(user).passwordReset(token);
    return res.redirect('/');
  } catch (err) {
    console.log(err);
  }
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    const message = req.flash('error');
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'Reset Password',
      errorMessage: message.length > 0 ? message[0] : null,
      userId: user._id.toString(),
      passwordToken: token,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const { password, confirmPassword, userId, passwordToken } = req.body;
  if (password !== confirmPassword || password.length < 5) {
    req.flash(
      'error',
      'There was an error updating password, check your email again'
    );
    return res.redirect('/login');
  }
  try {
    const user = await User.findOne({
      _id: userId,
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) {
      req.flash('error', 'There was an error updating password');
      return res.redirect('/login');
    }
    user.password = password;
    await user.save();
    return res.redirect('/login');
  } catch (err) {
    console.log(err);
  }
};
