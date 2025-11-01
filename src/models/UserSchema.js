// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
   id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['Farmer', 'Buyer', 'Admin']]
      }
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: false,
    underscored: true
  });

  User.associate = (models) => {
    User.hasOne(models.Farmer, { foreignKey: 'user_id', as: 'farmerProfile', onDelete: 'CASCADE' });
    User.hasOne(models.Buyer, { foreignKey: 'user_id', as: 'buyerProfile', onDelete: 'CASCADE' });
  };

  return User;
};