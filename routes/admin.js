const path = require('path');
const { check, body } = require('express-validator');

const express = require('express');
const isAuth = require('../middlewares/isAuth');

const adminController = require('../controllers/admin');

const router = express.Router();

router.use(isAuth);

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  [
    check('title').isString().trim().isLength({ min: 3, max: 20 }),
    check('price').isFloat(),
    check('description').isLength({ min: 5, max: 400 }).trim(),
  ],
  adminController.postAddProduct
);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post(
  '/edit-product',
  [
    check('title').isString().trim().isLength({ min: 3, max: 20 }),
    check('price').isFloat(),
    check('description').isLength({ min: 5, max: 400 }).trim(),
  ],
  adminController.postEditProduct
);

router.delete('/product/:productId', adminController.deleteProduct);

module.exports = router;
