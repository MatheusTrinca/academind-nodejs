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

const setSession = async (req, res, user, redirectTo) => {
  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save();
  res.redirect(redirectTo);
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.redirect('/login');
    if (!(await user.correctPassword(password, user.password))) {
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
  const confirmPassword = req.body.confirmPassword;
  try {
    const user = await User.findOne({ email: email });
    if (user) return res.redirect('/signup');
    const newUser = new User({
      email: email,
      password: password,
      cart: { items: [] },
    });
    await newUser.save();
    await setSession(req, res, user, '/');
  } catch (err) {
    console.log(err);
  }
};

exports.postLogout = async (req, res, next) => {
  await req.session.destroy();
  res.redirect('/');
};
