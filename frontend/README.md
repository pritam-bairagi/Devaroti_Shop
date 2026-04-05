# Professional E-commerce Website

## Backend

Node.js
Express
MongoDB
JWT Auth / Refresh Token
Cloudinary (image upload)
Stripe (payment)
Multer
Docker
Redis caching

## Frontend

React
Vite
TailwindCSS
Lucide Icons
Redux Toolkit
Axios
Framer Motion
================================
Features

---

✔ User Authentication
✔ Product Search
✔ Category System
✔ Cart System
✔ Wishlist
✔ Order System
✔ Payment Gateway
✔ Admin Dashboard
✔ Product Reviews
✔ Image Upload
✔ Inventory Management

backend/
├── server.js
├── config/
│ └── db.js
├── src/
│ ├── controllers/
│ │ ├── authController.js
│ │ ├── adminController.js
│ │ ├── sellerController.js
│ │ ├── orderController.js
│ │ ├── productController.js
│ │ ├── userController.js
│ │ └── paymentController.js ← NEW
│ ├── models/
│ │ ├── User.js
│ │ ├── Product.js
│ │ ├── Order.js ← FIXED
│ │ ├── Sale.js
│ │ ├── Purchase.js
│ │ ├── Transaction.js
│ │ └── Review.js
│ ├── routes/
│ │ ├── authRoutes.js
│ │ ├── adminRoutes.js ← FIXED + NEW routes
│ │ ├── sellerRoutes.js
│ │ ├── orderRoutes.js ← FIXED
│ │ ├── productRoutes.js
│ │ ├── userRoutes.js
│ │ ├── paymentRoutes.js ← NEW
│ │ └── reviewRoutes.js ← NEW
│ ├── middleware/
│ │ ├── authMiddleware.js
│ │ ├── errorMiddleware.js
│ │ └── uploadMiddleware.js
│ └── utils/
│ ├── analytics.js
│ ├── sendEmail.js
│ ├── emailTemplates.js
│ ├── seeder.js
│ └── productSeeder.js

frontend/src/
├── contexts/
│ ├── AuthContext.jsx ← FIXED
│ └── useAuth.js
├── services/
│ └── api.js ← FIXED + payment APIs
├── pages/
│ ├── AdminDashboard.jsx ← COMPLETE REWRITE
│ ├── SellerPanel.jsx ← COMPLETE REWRITE
│ ├── Home.jsx
│ ├── Shop.jsx
│ ├── Cart.jsx
│ ├── Profile.jsx
│ └── ...
└── components/
├── PaymentGateway.jsx ← NEW
└── ...
