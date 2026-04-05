const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

// ============================================================
// BKASH PAYMENT
// ============================================================

// @desc    Initiate bKash payment
// @route   POST /api/payment/bkash/create
// @access  Private
exports.bkashCreatePayment = async (req, res) => {
  try {
    const { amount, orderId, callbackURL } = req.body;

    // Step 1: Get bKash token
    const tokenRes = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.id_token) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get bKash token',
        details: tokenData
      });
    }

    // Step 2: Create payment
    const paymentRes = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: tokenData.id_token,
        'X-App-Key': process.env.BKASH_APP_KEY
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: req.user.id,
        callbackURL: callbackURL || `${process.env.FRONTEND_URL}/payment/bkash/callback`,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId || `INV-${Date.now()}`
      })
    });

    const paymentData = await paymentRes.json();

    if (paymentData.statusCode !== '0000') {
      return res.status(400).json({
        success: false,
        message: paymentData.statusMessage || 'bKash payment creation failed',
        details: paymentData
      });
    }

    res.status(200).json({
      success: true,
      bkashURL: paymentData.bkashURL,
      paymentID: paymentData.paymentID,
      message: 'bKash payment initiated'
    });

  } catch (error) {
    console.error('bKash create payment error:', error);
    res.status(500).json({ success: false, message: 'bKash payment initiation failed' });
  }
};

// @desc    Execute/verify bKash payment
// @route   POST /api/payment/bkash/execute
// @access  Private
exports.bkashExecutePayment = async (req, res) => {
  try {
    const { paymentID, orderId } = req.body;

    // Get token
    const tokenRes = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET
      })
    });

    const tokenData = await tokenRes.json();

    // Execute payment
    const executeRes = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenData.id_token,
        'X-App-Key': process.env.BKASH_APP_KEY
      },
      body: JSON.stringify({ paymentID })
    });

    const executeData = await executeRes.json();

    if (executeData.statusCode !== '0000') {
      return res.status(400).json({
        success: false,
        message: executeData.statusMessage || 'bKash payment execution failed'
      });
    }

    // Update order
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        isPaid: true,
        paidAt: new Date(),
        'paymentDetails.transactionId': executeData.trxID,
        'paymentDetails.gateway': 'bkash',
        'paymentDetails.gatewayResponse': executeData
      });

      const order = await Order.findById(orderId);
      if (order) {
        await Transaction.create({
          type: 'Cash In',
          amount: order.totalPrice,
          description: `bKash payment: ${order.orderNumber}`,
          category: 'sales',
          reference: executeData.trxID,
          paymentMethod: 'bkash',
          status: 'completed',
          user: req.user.id
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'bKash payment successful',
      transactionId: executeData.trxID,
      data: executeData
    });

  } catch (error) {
    console.error('bKash execute payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// ============================================================
// STRIPE / CARD PAYMENT
// ============================================================

// @desc    Create Stripe payment intent
// @route   POST /api/payment/stripe/create-intent
// @access  Private
exports.stripeCreateIntent = async (req, res) => {
  try {
    const { amount, orderId, currency = 'bdt' } = req.body;

    // NOTE: Install stripe: npm install stripe
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paisa/cents
      currency,
      metadata: {
        orderId: orderId || '',
        userId: req.user.id,
        userEmail: req.user.email
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ success: false, message: error.message || 'Card payment failed' });
  }
};

// @desc    Confirm Stripe payment
// @route   POST /api/payment/stripe/confirm
// @access  Private
exports.stripeConfirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not confirmed. Status: ${paymentIntent.status}`
      });
    }

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        isPaid: true,
        paidAt: new Date(),
        'paymentDetails.transactionId': paymentIntentId,
        'paymentDetails.gateway': 'stripe'
      });

      const order = await Order.findById(orderId);
      if (order) {
        await Transaction.create({
          type: 'Cash In',
          amount: order.totalPrice,
          description: `Card payment: ${order.orderNumber}`,
          category: 'sales',
          reference: paymentIntentId,
          paymentMethod: 'card',
          status: 'completed',
          user: req.user.id
        });
      }
    }

    res.status(200).json({ success: true, message: 'Payment confirmed successfully' });

  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ success: false, message: 'Payment confirmation failed' });
  }
};

// @desc    Stripe webhook
// @route   POST /api/payment/stripe/webhook
// @access  Public (raw body needed)
exports.stripeWebhook = async (req, res) => {
  try {
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          isPaid: true,
          paidAt: new Date()
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
};

// ============================================================
// BANK TRANSFER
// ============================================================

// @desc    Submit bank transfer details
// @route   POST /api/payment/bank/submit
// @access  Private
exports.bankTransferSubmit = async (req, res) => {
  try {
    const { orderId, transactionId, bankName, accountName, transferDate, amount } = req.body;

    if (!orderId || !transactionId) {
      return res.status(400).json({ success: false, message: 'Order ID and transaction ID are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Mark as processing (admin will verify)
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'processing',
      'paymentDetails.transactionId': transactionId,
      'paymentDetails.gateway': 'bank',
      'paymentDetails.reference': `${bankName} - ${accountName}`,
      'paymentDetails.gatewayResponse': { bankName, accountName, transferDate, amount }
    });

    res.status(200).json({
      success: true,
      message: 'Bank transfer details submitted. Payment will be verified within 24 hours.'
    });

  } catch (error) {
    console.error('Bank transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit bank transfer details' });
  }
};

// @desc    Verify bank payment (Admin)
// @route   PUT /api/payment/bank/verify/:orderId
// @access  Private/Admin
exports.verifyBankPayment = async (req, res) => {
  try {
    const { approved, note } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (approved) {
      order.paymentStatus = 'paid';
      order.isPaid = true;
      order.paidAt = new Date();
      order.adminNotes = note;

      await Transaction.create({
        type: 'Cash In',
        amount: order.totalPrice,
        description: `Bank transfer verified: ${order.orderNumber}`,
        category: 'sales',
        reference: order.paymentDetails?.transactionId,
        paymentMethod: 'bank',
        status: 'completed',
        user: req.user.id
      });
    } else {
      order.paymentStatus = 'failed';
      order.adminNotes = note || 'Bank transfer verification failed';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: approved ? 'Payment verified and approved' : 'Payment rejected',
      order
    });

  } catch (error) {
    console.error('Bank verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

// @desc    Get bank account details
// @route   GET /api/payment/bank/accounts
// @access  Public
exports.getBankAccounts = async (req, res) => {
  res.status(200).json({
    success: true,
    accounts: [
      {
        bankName: 'Dutch-Bangla Bank',
        accountName: 'Devaroti Shop',
        accountNumber: '1234567890',
        branchName: 'Dhaka Main Branch',
        routingNumber: '090272476'
      },
      {
        bankName: 'bKash Merchant',
        accountName: 'Devaroti Shop',
        accountNumber: '01XXXXXXXXX',
        type: 'merchant'
      },
      {
        bankName: 'Nagad Merchant',
        accountName: 'Devaroti Shop',
        accountNumber: '01XXXXXXXXX',
        type: 'merchant'
      }
    ]
  });
};
