const emailTemplates = {
  // Verification OTP
  verification: (otp, name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #088178, #0a5c56); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; background: #f9fafb; }
        .otp-box { background: #fff; border: 3px dashed #088178; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp { font-size: 48px; font-weight: 800; color: #088178; letter-spacing: 10px; margin: 10px 0; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background: #088178; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for signing up! Please use the following OTP code to verify your email address. This code will expire in <strong>10 minutes</strong>.</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          <p>If you did not request this, please ignore this email.</p>
          <p style="text-align: center; margin-top: 30px;">
            <a href="#" class="button">Visit Our Store</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Parash Feri. All rights reserved.<br>
          <small>This is an automated message, please do not reply.</small>
        </div>
      </div>
    </body>
    </html>
  `,

  // Password Reset
  resetPassword: (url, name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; background: #f9fafb; }
        .button { display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>You requested to reset your password. Click the button below to create a new password. This link will expire in <strong>10 minutes</strong>.</p>
          <p style="text-align: center;">
            <a href="${url}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${url}</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Parash Feri. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,

  // Welcome Email
  welcome: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; background: #f9fafb; }
        .features { display: flex; justify-content: space-between; margin: 30px 0; }
        .feature { text-align: center; flex: 1; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Parash Feri!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Welcome to Parash Feri! Your account has been successfully verified.</p>
          <p>You can now:</p>
          <div class="features">
            <div class="feature">
              <h3>🛍️ Shop</h3>
              <p>Browse thousands of products</p>
            </div>
            <div class="feature">
              <h3>❤️ Wishlist</h3>
              <p>Save your favorites</p>
            </div>
            <div class="feature">
              <h3>🚚 Track</h3>
              <p>Follow your orders</p>
            </div>
          </div>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/shop" style="background: #088178; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">Start Shopping</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Parash Feri. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,

  // Order Confirmation
  orderConfirmation: (order, user) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #088178, #0a5c56); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .order-details { background: #fff; border-radius: 5px; padding: 20px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; background: #f0f0f0; padding: 10px; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .total { font-size: 18px; font-weight: bold; color: #088178; text-align: right; margin-top: 20px; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Thank you for your order! We've received it and will process it soon.</p>
          
          <div class="order-details">
            <h3>Order Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>৳${item.price * item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              Subtotal: ৳${order.subtotal}<br>
              ${order.discount > 0 ? `Discount: -৳${order.discount}<br>` : ''}
              ${order.vat > 0 ? `VAT: ৳${order.vat}<br>` : ''}
              Shipping: ${order.shippingCost > 0 ? `৳${order.shippingCost}` : 'Free'}<br>
              <strong>Total: ৳${order.totalPrice}</strong>
            </div>
          </div>
          
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
          Phone: ${order.shippingAddress.phoneNumber}</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background: #088178; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">Track Order</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Parash Feri. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,

  // Seller Approval
  sellerApproval: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }
        .content { padding: 40px 30px; background: #f9fafb; }
        .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Seller Account Approved!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Congratulations! Your seller account has been approved by our admin team.</p>
          <p>You can now:</p>
          <ul>
            <li>List your products</li>
            <li>Manage inventory</li>
            <li>Process orders</li>
            <li>Track earnings</li>
          </ul>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/seller" style="background: #f59e0b; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Seller Dashboard</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Parash Feri. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `
};

module.exports = emailTemplates;