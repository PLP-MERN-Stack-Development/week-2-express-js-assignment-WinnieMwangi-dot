const { ValidationError } = require('./ValidationError');

const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || typeof price !== 'number' || !category || typeof inStock !== 'boolean') {
    throw new ValidationError('Missing or invalid product fields');
  }
  next();
};

module.exports = validateProduct;
