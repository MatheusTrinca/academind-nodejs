const Product = require('../models/product');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { deleteFile } = require('../util/file');

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: null,
    hasError: false,
    validationErrors: [],
  });
};

exports.postAddProduct = async (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: 'Attached file is not an image',
      hasError: true,
      product: { title, price, description },
      validationErrors: [],
    });
  }

  const imageUrl = image.path;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: errors.array()[0].msg,
      hasError: true,
      product: { title, price, description },
      validationErrors: errors.array(),
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
  });

  try {
    await product.save();
    console.log('Created Product');
    res.redirect('/admin/products');
  } catch (err) {
    // res.status(422).render('admin/edit-product', {
    //   pageTitle: 'Add Product',
    //   path: '/admin/add-product',
    //   editing: false,
    //   errorMessage: 'Database Error',
    //   hasError: true,
    //   product: { title, imageUrl, price, description },
    //   validationErrors: [],
    // });
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  try {
    const product = await Product.findById(prodId);
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      hasError: false,
      errorMessage: null,
      validationErrors: [],
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: true,
      errorMessage: errors.array()[0].msg,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      validationErrors: errors.array(),
    });
  }

  try {
    const product = await Product.findById({
      _id: prodId,
      userId: req.user._id,
    });
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    if (image) {
      deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    await product.save();
    console.log('UPDATED PRODUCT!');
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  let page = +req.query.page || 1;
  try {
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
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

exports.postDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    const product = await Product.findById(prodId);
    if (!product) {
      return next(new Error('Unable to find product'));
    }
    deleteFile(product.imageUrl);
    await Product.deleteOne({ _id: prodId, userId: req.user._id });
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};
