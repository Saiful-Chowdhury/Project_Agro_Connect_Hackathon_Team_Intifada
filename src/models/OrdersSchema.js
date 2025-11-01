module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
     id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'buyers', key: 'user_id' }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      // validate: {
      //   isIn: [['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']]
      // }
    },
    delivery_address: DataTypes.TEXT,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'orders',
    timestamps: false,
    underscored: true
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Buyer, { foreignKey: 'buyer_id', as: 'buyer' });
    Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
  };

  return Order;
};