// models/buyer.js
module.exports = (sequelize, DataTypes) => {
  const Buyer = sequelize.define('Buyer', {
   user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    business_name: {
      type: DataTypes.STRING(100)
    },
    business_address: {
      type: DataTypes.TEXT
    },
    trade_licence: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'trade_licence' // matches your SQL column name
    }
  }, {
    tableName: 'buyers',
    timestamps: false,
    underscored: true
  });

  Buyer.associate = (models) => {
    Buyer.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Buyer.hasMany(models.Order, { foreignKey: 'buyer_id', as: 'orders', onDelete: 'CASCADE' });
  };

  return Buyer;
};