// models/farmer.js
module.exports = (sequelize, DataTypes) => {
  const Farmer = sequelize.define('Farmer', {
     user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    farm_location: {
      type: DataTypes.TEXT
    },
    nid: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    application_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    dob: {
      type: DataTypes.DATEONLY
    }
  }, {
    tableName: 'farmers',
    timestamps: false,
    underscored: true
  });

  Farmer.associate = (models) => {
    Farmer.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Farmer.hasMany(models.Product, { foreignKey: 'farmer_id', as: 'products', onDelete: 'CASCADE' });
  };

  return Farmer;
};