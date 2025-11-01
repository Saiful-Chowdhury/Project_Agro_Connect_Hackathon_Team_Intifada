const { Product, Farmer } = require('../../models');
const { Op, fn, col, Sequelize } = require('sequelize');

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
  attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('product_category')), 'category']],
  raw: true
}).then(rows => rows.map(r => r.category));
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

// Single GET
const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByPk(productId, {
            include: [{
                model: Farmer,
                as: 'farmer',
                attributes: ['farm_location', 'nid']
            }]
        }); 
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Fetch product by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
};

module.exports = {
    ensureFarmer,
    getProducts,
    getProductById
};
