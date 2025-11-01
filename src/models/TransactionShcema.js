
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // Payment belongs to one Order
      Payment.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'BDT',
        allowNull: false
      },
      payment_method: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          isIn: [['bKash', 'Nagad', 'BankTransfer', 'Card', 'CashOnDelivery']]
        }
      },
      transaction_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'completed', 'failed', 'refunded']]
        }
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: false,
      underscored: true
    }
  );

  return Payment;
};