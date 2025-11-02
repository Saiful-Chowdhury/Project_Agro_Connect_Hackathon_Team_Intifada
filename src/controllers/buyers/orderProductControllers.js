const {
  User,
  Buyer,
  Product,
  Cart,
  Order,
  OrderItem,
  Payment,
  Farmer,
  Notification,
  sequelize
} = require('../../models');

const { Sequelize } = require('sequelize');

// 1. ADD TO CART
const addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid product or quantity' });
  }

  try {
    // Ensure buyer profile exists
    const buyerProfile = await Buyer.findOne({ where: { user_id } });
    if (!buyerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Buyer profile not found. Please complete registration.'
      });
    }

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity > product.available_quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    await Cart.upsert(
      { buyer_id: user_id, product_id, quantity },
      { where: { buyer_id: user_id, product_id } }
    );

    res.status(200).json({ success: true, message: 'Added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
};

// 2. GET CART ITEMS
const getCart = async (req, res) => {
  const user_id = req.user.id;

  try {
    const buyerProfile = await Buyer.findOne({ where: { user_id } });
    if (!buyerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Buyer profile not found.'
      });
    }

    const items = await Cart.findAll({
      where: { buyer_id: user_id },
      include: [{
        model: Product,
        as: 'Product',
        attributes: ['id', 'name', 'price_per_unit', 'unit', 'available_quantity']
      }]
    });

    const total = items.reduce((sum, item) => sum + (item.quantity * item.Product.price_per_unit), 0);
    res.status(200).json({ success: true, items, total });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

// 3. CONFIRM ORDER + CREATE PAYMENT
const confirmOrder = async (req, res) => {
  const { delivery_address, payment_method } = req.body;
  const buyer_id = req.user.id;

  if (!delivery_address || !payment_method) {
    return res.status(400).json({ success: false, message: 'Delivery address and payment method required' });
  }

  const validMethods = ['bKash', 'Nagad', 'BankTransfer', 'Card', 'CashOnDelivery'];
  if (!validMethods.includes(payment_method)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  const t = await sequelize.transaction();
  try {
    const buyerProfile = await Buyer.findOne({ where: { user_id: buyer_id } }, { transaction: t });
    if (!buyerProfile) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Buyer profile not found.' });
    }

    const cartItems = await Cart.findAll({
      where: { buyer_id },
      include: [{
        model: Product,
        as: 'Product'
      }]
    }, { transaction: t });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let total = 0;
    for (const item of cartItems) {
      if (!item.Product) {
        await t.rollback();
        return res.status(500).json({
          success: false,
          message: `Product data missing for item ${item.product_id}`
        });
      }

      if (item.quantity > item.Product.available_quantity) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.Product.name}`
        });
      }
      total += item.quantity * item.Product.price_per_unit;
    }

    const order = await Order.create({
      buyer_id,
      total_amount: parseFloat(total.toFixed(2)),
      delivery_address,
      status: payment_method === 'CashOnDelivery' ? 'confirmed' : 'pending'
    }, { transaction: t });

    const orderItems = [];
    for (const item of cartItems) {
      orderItems.push({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.Product.price_per_unit
      });

      await Product.update(
        { 
          available_quantity: Sequelize.literal(`available_quantity - ${item.quantity}`) 
        },
        { where: { id: item.product_id } },
        { transaction: t }
      );
    }
    await OrderItem.bulkCreate(orderItems, { transaction: t });

    // Notify farmers
    const farmerMap = {};
    for (const item of cartItems) {
      const fid = item.Product.farmer_id;
      if (!farmerMap[fid]) farmerMap[fid] = [];
      farmerMap[fid].push(item.Product.name);
    }

    for (const [farmerId, products] of Object.entries(farmerMap)) {
      await Notification.create({
        user_id: farmerId,
        title: 'New Order Received',
        message: `You have a new order for: ${products.join(', ')}. Order ID: ${order.id}`,
        type: 'order',
        related_order_id: order.id,
        created_at: new Date()
      }, { transaction: t });
    }

    await Payment.create({
      order_id: order.id,
      amount: order.total_amount,
      payment_method,
      status: payment_method === 'CashOnDelivery' ? 'completed' : 'pending'
    }, { transaction: t });

    await Cart.destroy({ where: { buyer_id }, transaction: t });
    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Order confirmed',
      order_id: order.id,
      payment_method,
      status: order.status
    });

  } catch (error) {
    await t.rollback();
    console.error('Confirm order error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm order' });
  }
};

// 4. GET ORDER STATUS
const getOrderStatus = async (req, res) => {
  const { id } = req.params;
  const buyer_id = req.user.id;

  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          include: [{
            model: Product,
            as: 'product'
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'payment_method', 'status', 'transaction_id', 'created_at']
        }
      ]
    });

    if (!order || order.buyer_id !== buyer_id) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

// 5. UPDATE PAYMENT STATUS
const updatePaymentStatus = async (req, res) => {
  const { order_id, transaction_id, status } = req.body;

  try {
    const payment = await Payment.findOne({ where: { order_id } });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await payment.update({
      status,
      transaction_id,
      paid_at: status === 'completed' ? new Date() : null
    });

    if (status === 'completed') {
      await Order.update(
        { status: 'confirmed' },
        { where: { id: order_id } }
      );
    }

    res.status(200).json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
};

// 6. REMOVE FROM CART
const removeFromCart = async (req, res) => {
  const { product_id } = req.params;
  const user_id = req.user.id;

  try {
    const buyerProfile = await Buyer.findOne({ where: { user_id } });
    if (!buyerProfile) {
      return res.status(403).json({ success: false, message: 'Buyer profile not found.' });
    }

    const result = await Cart.destroy({
      where: { buyer_id: user_id, product_id }
    });

    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
};

module.exports = {
  addToCart,
  getCart,
  confirmOrder,
  getOrderStatus,
  updatePaymentStatus,
  removeFromCart
};