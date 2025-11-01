const { Product, Farmer } = require('../../models');
const { Op, fn, col,Sequelize } = require('sequelize');
// Helper: Validate if user is farmer
const ensureFarmer = (req, res, next) => {
  if (req.user.role !== 'Farmer') {
    return res.status(403).json({
      success: false,
      message: 'Only farmers can manage products.'
    });
  }
  next();
};
// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { 
      category,       // e.g., "Vegetables"
      farmer_id,      // filter by specific farmer
      search,         // search in product name
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by category
    if (category) {
      where.product_category = category;
    }

    // Filter by farmer
    if (farmer_id) {
      where.farmer_id = farmer_id;
    }

    // Search by name (case-insensitive)
    if (search) {
      where.name = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: Farmer,
        as: 'farmer',
        attributes: ['farm_location', 'nid'] // or whatever you want to show
      }],
      order: [['updated_at', 'DESC']]
    });

    // Get unique categories for frontend dropdown
    const categories = await Product.findAll({
  attributes: [
    [Sequelize.fn('DISTINCT', Sequelize.col('product_category')), 'category']
  ],
  raw: true
});

    res.status(200).json({
      success: true,
      products,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      categories // send available categories to frontend
    });

  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// POST /api/products — Add new product
const createProduct = async (req, res) => {
  const { name, description, price_per_unit, unit, available_quantity, harvest_date, product_category, product_image_url } = req.body;
  const farmer_id = req.user.id;

  try {
    // Basic validation
    if (!name || !price_per_unit || !available_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and available quantity are required.'
      });
    }

    const product = await Product.create({
      farmer_id,
      name: name.trim(),
      description: description?.trim() || null,
      price_per_unit: parseFloat(price_per_unit),
      unit: unit?.trim() || 'kg',
      available_quantity: parseFloat(available_quantity),
      harvest_date: harvest_date || null,
      product_category: product_category?.trim() || 'Others',
       product_image_url: product_image_url || null
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product.'
    });
  }
};

// PUT /api/products/:id — Update product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price_per_unit, unit, available_quantity, harvest_date, product_category, product_image_url } = req.body;
  const farmer_id = req.user.id;

  try {
    const product = await Product.findOne({ where: { id, farmer_id } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied.'
      });
    }

    await product.update({
      name: name?.trim() || product.name,
      description: description?.trim() || product.description,
      price_per_unit: price_per_unit !== undefined ? parseFloat(price_per_unit) : product.price_per_unit,
      unit: unit?.trim() || product.unit,
      available_quantity: available_quantity !== undefined ? parseFloat(available_quantity) : product.available_quantity,
      harvest_date: harvest_date || product.harvest_date,
      product_category: product_category?.trim() || product.product_category,
       product_image_url: product_image_url || product.product_image_url,
      updated_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product.'
    });
  }
};

// DELETE /api/products/:id — Delete product
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const farmer_id = req.user.id;

  try {
    const product = await Product.findOne({ where: { id, farmer_id } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access denied.'
      });
    }

    await product.destroy();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product.'
    });
  }
};

// Single GET
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(id, {
            include: [{
                model: Farmer,
                as: 'farmer',
                attributes: ['farm_location', 'nid']
            }]
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }   
        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product.'
        });
    }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
    ensureFarmer,
    getProducts,
    getProductById
};
