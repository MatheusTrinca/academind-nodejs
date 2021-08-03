const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const user = await User.findById('60abfb034330950520b26749');
    req.session.isLoggedIn = true;
    req.session.user = user;
    req.session.save(err => {
      console.log(err);
      res.redirect('/');
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postSignup = (req, res, next) => {};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
