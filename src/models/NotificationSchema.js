module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(20),
        defaultValue: 'order',
        validate: {
          isIn: [['order', 'payment', 'system']]
        }
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      related_order_id: {
        type: DataTypes.UUID,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    },
    {
      tableName: 'notifications',
      timestamps: false,
      underscored: true
    }
  );

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Notification.belongsTo(models.Order, { foreignKey: 'related_order_id', as: 'order' });
  };

  return Notification;
};