const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// In-memory data store
let products = [];

// ===== Middleware =====

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Parse JSON bodies
app.use(express.json());

// Authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== '12345') {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

// Validation middleware
const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  if (
    typeof name !== 'string' ||
    typeof description !== 'string' ||
    typeof price !== 'number' ||
    typeof category !== 'string' ||
    typeof inStock !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Invalid product data' });
  }
  next();
};

// ===== Routes =====

// Root route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Get all products (with filtering, pagination, search)
app.get('/api/products', authenticate, (req, res) => {
  const { category, page = 1, limit = 5, search } = req.query;
  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));

  res.json({
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    results: paginated
  });
});

// Get product by ID
app.get('/api/products/:id', authenticate, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Create new product
app.post('/api/products', authenticate, validateProduct, (req, res) => {
  const newProduct = { id: uuidv4(), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Update product
app.put('/api/products/:id', authenticate, validateProduct, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

// Delete product
app.delete('/api/products/:id', authenticate, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products.splice(index, 1);
  res.json({ message: 'Product deleted successfully' });
});

// Product statistics
app.get('/api/products/stats', authenticate, (req, res) => {
  const stats = {};
  products.forEach(p => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });
  res.json({
    totalProducts: products.length,
    countByCategory: stats
  });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== Start Server =====
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
