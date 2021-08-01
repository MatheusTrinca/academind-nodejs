exports.getLogin = (req, res, next) => {
  //const isLogedIn = req.get('Cookie').split('=')[1];
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: false,
  });
};

exports.postLogin = (req, res, next) => {
  res.setHeader('Set-Cookie', 'isLoogedIn=true; secure; httpOnly');
  res.redirect('/');
};
