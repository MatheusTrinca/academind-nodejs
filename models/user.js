const { getDb } = require('../util/database');
const mongodb = require('mongodb');
const { get } = require('../routes/shop');

class User {
  constructor(name, email, cart, id) {
    this.name = name;
    this.email = email;
    this.cart = cart;
    this._id = id ? id : null;
  }
  save() {
    const db = getDb();
    let dbOp;
    if (this._id) {
      dbOp = db
        .collection('users')
        .updateOne({ _id: new mongodb.ObjectID(this._id) }, { $set: this });
    } else {
      dbOp = db.collection('users').insertOne(this);
    }
    return dbOp
      .then(result => console.log(result))
      .catch(err => console.log(err));
  }

  addToCart(product) {
    const db = getDb();
    const cartProductIndex = this.cart.items.findIndex(
      cp => cp.productId.toString() === product._id.toString()
    );
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new mongodb.ObjectID(product._id),
        quantity: newQuantity,
      });
    }
    const updatedCart = {
      items: updatedCartItems,
    };
    return db
      .collection('users')
      .updateOne(
        { _id: new mongodb.ObjectID(this._id) },
        { $set: { cart: updatedCart } }
      );
  }

  getCart() {
    const db = getDb();
    const productsIds = this.cart.items.map(i => i.productId);
    return db
      .collection('products')
      .find({ _id: { $in: productsIds } })
      .toArray()
      .then(products => {
        return products.map(product => {
          return {
            ...product,
            quantity: this.cart.items.find(
              item => item.productId.toString() === product._id.toString()
            ).quantity,
          };
        });
      });
  }

  deleteCartProduct(id) {
    const db = getDb();
    const updatedCartItems = this.cart.items.filter(
      p => p.productId.toString() !== id.toString()
    );
    const updatedCart = {
      items: updatedCartItems,
    };
    return db
      .collection('users')
      .updateOne(
        { _id: new mongodb.ObjectID(this._id) },
        { $set: { cart: updatedCart } }
      );
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then(products => {
        const order = {
          items: products,
          user: {
            _id: new mongodb.ObjectID(this._id),
            name: this.name,
          },
        };
        return db.collection('orders').insertOne(order);
      })
      .then(() => {
        this.cart = { items: [] };
        return db
          .collection('users')
          .updateOne(
            { _id: new mongodb.ObjectID(this._id) },
            { $set: { cart: { items: [] } } }
          );
      });
  }

  getOrders() {
    const db = getDb();
    return db.collection('orders');
  }

  static findById(id) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new mongodb.ObjectID(id) })
      .then(user => {
        console.log(user);
        return user;
      })
      .catch(err => console.log(err));
  }
}

module.exports = User;
