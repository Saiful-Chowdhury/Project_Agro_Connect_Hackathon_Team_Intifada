module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    farmer_id: {
      type: DataTypes.UUID,
      allowNull: false
 
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: DataTypes.TEXT,
    price_per_unit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(20),
      defaultValue: 'kg'
    },
    available_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    harvest_date: DataTypes.DATEONLY,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    product_category: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'Others'
    },
    product_image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: false,
    underscored: true
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Farmer, { 
      foreignKey: 'farmer_id', 
      as: 'farmer' 
    });
  };

  return Product;
};