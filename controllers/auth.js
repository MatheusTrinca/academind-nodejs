const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    errorMessage: message.length > 0 ? message[0] : null,
  });
};

exports.getSignup = (req, res, next) => {
  const message = req.flash('error');
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message.length > 0 ? message[0] : null,
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
  const confirmPassword = req.body.confirmPassword;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      req.flash('error', 'Email already exists');
      return res.redirect('/signup');
    }
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
