const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  console.log(req.session);
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: false,
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const user = await User.findById('60abfb034330950520b26749');
    req.session.isLoggedIn = true;
    req.session.user = user;
    res.redirect('/');
  } catch (err) {
    err;
  }
};
