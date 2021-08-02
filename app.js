const path = require('path');
const User = require('./models/user');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
require('dotenv').config();

const MONGO_URI =
  'mongodb+srv://matheus:nKaRQ9yS7flsWZV8@cluster0.9nli6.mongodb.net/shop';

const app = express();
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions',
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my_secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        User.create({
          name: 'Matheus',
          email: 'matheus@test.com',
          cart: {
            items: [],
          },
        });
      }
    });
    app.listen(3000, () => console.log('Connected!'));
  })
  .catch(err => console.log(err));
