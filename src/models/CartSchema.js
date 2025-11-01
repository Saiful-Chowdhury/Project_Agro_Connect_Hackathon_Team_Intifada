// models/cart.js
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    buyer_id: { type: DataTypes.UUID, allowNull: false },
    product_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  }, {
    tableName: 'carts',
    timestamps: true,
    underscored: true
  });

  Cart.associate = (models) => {
    Cart.belongsTo(models.Product, { foreignKey: 'product_id', as: 'Product' });
    Cart.belongsTo(models.Buyer, { foreignKey: 'buyer_id', as: 'Buyer' });
  };

  return Cart;
};