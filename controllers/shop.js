const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const product = require('../models/product');

const ITEMS_PER_PAGE = 2;

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const product = await Product.findById(prodId);
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products',
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getIndex = async (req, res, next) => {
  let page = +req.query.page || 1;
  try {
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: totalItems > ITEMS_PER_PAGE * page,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId').execPopulate();
    const products = user.cart.items;
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postCart = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    const product = await Product.findById(prodId);
    req.user.addToCart(product);
    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    await req.user.removeFromCart(prodId);
    res.redirect('/cart');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId').execPopulate();
    const products = user.cart.items.map(i => {
      return { quantity: i.quantity, product: { ...i.productId._doc } };
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user,
      },
      products: products,
    });
    await order.save();
    await req.user.clearCart();
    res.redirect('/orders');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ 'user.userId': req.user._id });
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  const orderId = req.params.orderId;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new Error('No order found'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorized'));
    }
    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicePath = path.join('data', 'invoices', invoiceName);

    // Gerando PDF on the fly
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true,
    });

    pdfDoc.text('---------------------------------');

    let total = 0;
    order.products.forEach(p => {
      total += p.product.price * p.quantity;
      pdfDoc
        .fontSize(16)
        .text(
          `${p.product.title} - ${p.quantity}x - $ ${(
            p.product.price * p.quantity
          ).toFixed(2)}`
        );
    });

    pdfDoc.fontSize(26).text('---------------------------------');
    pdfDoc.fontSize(20).text(`Total: $ ${total.toFixed(2)}`);

    pdfDoc.end();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      //'attachment;filename=' + invoiceName + ''
      'inline;filename=' + invoiceName + ''
    );

    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader(
    //     'Content-Disposition',
    //     //'attachment;filename=' + invoiceName + ''
    //     'inline;filename=' + invoiceName + ''
    //   );
    //   res.send(data);
    // });

    // AQUI COM STREAM
    //const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader(
    //   'Content-Disposition',
    //   //'attachment;filename=' + invoiceName + ''
    //   'inline;filename=' + invoiceName + ''
    // );
    // file.pipe(res);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};
