const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Category = require("./models/Category");
const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const { sampleCategories, sampleProducts } = require("./sampleData");

const envPath = path.resolve(__dirname, "..", ".env");
const dotenvResult = dotenv.config({ path: envPath });
const env = dotenvResult.parsed || {};

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;
const JWT_SECRET = env.JWT_SECRET || process.env.JWT_SECRET || "dev-secret";
const ADMIN_EMAILS = (env.ADMIN_EMAILS || process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const AUTO_SEED = (env.AUTO_SEED || process.env.AUTO_SEED || "").toLowerCase();
const SEED_KEY = env.SEED_KEY || process.env.SEED_KEY || "";

function isAutoSeedEnabled() {
  if (AUTO_SEED) {
    return ["1", "true", "yes", "on"].includes(AUTO_SEED);
  }
  return process.env.NODE_ENV !== "production";
}

const cached = global.mongoose || { conn: null, promise: null };

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not set");
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

global.mongoose = cached;

async function seedIfEmpty() {
  if (!MONGODB_URI || !isAutoSeedEnabled()) {
    return;
  }
  try {
    await connectToDatabase();
    const [categoryCount, productCount] = await Promise.all([
      Category.countDocuments(),
      Product.countDocuments()
    ]);
    if (categoryCount === 0 && productCount === 0) {
      await Category.insertMany(sampleCategories);
      await Product.insertMany(sampleProducts);
      console.log("Seeded database with sample categories and products.");
    }
  } catch (error) {
    console.warn("Auto-seed skipped:", error.message);
  }
}

function getFeatured(items) {
  return items.filter((item) => item.tags && item.tags.includes("featured"));
}

function getTrending(items) {
  return items.filter((item) => item.tags && item.tags.includes("trending"));
}

function getHero(items) {
  return (
    items.find((item) => item.tags && item.tags.includes("hero")) || items[0]
  );
}

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getAuthUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.auth = auth;
  return next();
}

function requireAdmin(req, res, next) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  req.auth = auth;
  return next();
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/categories", async (req, res) => {
  if (!MONGODB_URI) {
    return res.json({ data: sampleCategories, source: "memory" });
  }
  try {
    await connectToDatabase();
    const docs = await Category.find().sort({ name: 1 }).lean();
    if (!docs.length) {
      return res.json({
        data: sampleCategories,
        source: "memory",
        warning: "empty_db"
      });
    }
    return res.json({ data: docs, source: "mongo" });
  } catch (error) {
    return res.json({
      data: sampleCategories,
      source: "memory",
      warning: "mongo_unavailable"
    });
  }
});

app.get("/api/products", async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit || "0", 10) || 0, 50);
  if (!MONGODB_URI) {
    const data = limit ? sampleProducts.slice(0, limit) : sampleProducts;
    return res.json({
      data,
      featured: getFeatured(sampleProducts),
      trending: getTrending(sampleProducts),
      hero: getHero(sampleProducts),
      source: "memory"
    });
  }

  try {
    await connectToDatabase();
    const docs = await Product.find().sort({ createdAt: -1 }).lean();
    if (!docs.length) {
      const data = limit ? sampleProducts.slice(0, limit) : sampleProducts;
      return res.json({
        data,
        featured: getFeatured(sampleProducts),
        trending: getTrending(sampleProducts),
        hero: getHero(sampleProducts),
        source: "memory",
        warning: "empty_db"
      });
    }

    const data = limit ? docs.slice(0, limit) : docs;
    return res.json({
      data,
      featured: getFeatured(docs),
      trending: getTrending(docs),
      hero: getHero(docs),
      source: "mongo"
    });
  } catch (error) {
    const data = limit ? sampleProducts.slice(0, limit) : sampleProducts;
    return res.json({
      data,
      featured: getFeatured(sampleProducts),
      trending: getTrending(sampleProducts),
      hero: getHero(sampleProducts),
      source: "memory",
      warning: "mongo_unavailable"
    });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }

  try {
    await connectToDatabase();
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const hasUsers = (await User.countDocuments()) > 0;
    const role =
      ADMIN_EMAILS.includes(normalizedEmail) || !hasUsers ? "admin" : "user";
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role
    });
    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." });
  }
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }

  try {
    await connectToDatabase();
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed." });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ user: auth });
});

app.post("/api/orders", requireAuth, async (req, res) => {
  const { items, shipping, paymentMethod } = req.body || {};
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order items required." });
  }
  if (
    !shipping ||
    !shipping.fullName ||
    !shipping.phone ||
    !shipping.address ||
    !shipping.city ||
    !shipping.postalCode
  ) {
    return res.status(400).json({ message: "Shipping details required." });
  }
  if (paymentMethod !== "cod") {
    return res.status(400).json({ message: "Invalid payment method." });
  }

  try {
    await connectToDatabase();
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.qty),
      0
    );
    const order = await Order.create({
      user: req.auth.id,
      items: items.map((item) => ({
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty)
      })),
      subtotal,
      shipping: {
        fullName: String(shipping.fullName).trim(),
        phone: String(shipping.phone).trim(),
        address: String(shipping.address).trim(),
        city: String(shipping.city).trim(),
        postalCode: String(shipping.postalCode).trim()
      },
      paymentMethod: "cod",
      status: "pending"
    });
    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: "Order creation failed." });
  }
});

app.get("/api/orders/track", async (req, res) => {
  const orderId = String(req.query.orderId || "").trim();
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required." });
  }

  try {
    await connectToDatabase();
    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId)
        .select("status subtotal createdAt items shipping.fullName")
        .lean();
    } else if (/^[a-f0-9]{6}$/i.test(orderId)) {
      const matches = await Order.aggregate([
        {
          $addFields: {
            idStr: { $toString: "$_id" }
          }
        },
        {
          $match: {
            idStr: { $regex: `${orderId}$`, $options: "i" }
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        {
          $project: {
            status: 1,
            subtotal: 1,
            createdAt: 1,
            items: 1,
            "shipping.fullName": 1
          }
        }
      ]);
      order = matches[0] || null;
    } else {
      return res.status(400).json({ message: "Invalid order ID." });
    }
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    return res.json({
      order: {
        id: order._id,
        status: order.status,
        createdAt: order.createdAt,
        itemsCount: order.items?.length || 0,
        subtotal: order.subtotal,
        customer: order.shipping?.fullName || ""
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to track order." });
  }
});

app.get("/api/orders/my", requireAuth, async (req, res) => {
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }
  try {
    await connectToDatabase();
    const orders = await Order.find({ user: req.auth.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load orders." });
  }
});

app.get("/api/admin/summary", requireAdmin, async (req, res) => {
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }
  try {
    await connectToDatabase();
    const [usersCount, ordersCount, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$subtotal" } } }
      ])
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    return res.json({ usersCount, ordersCount, revenue });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load summary." });
  }
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }
  try {
    await connectToDatabase();
    const orders = await Order.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load orders." });
  }
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "Database not configured on server." });
  }
  const { id } = req.params;
  const { status } = req.body || {};
  const allowedStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status." });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id." });
  }

  try {
    await connectToDatabase();
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    return res.json({ order: { id: order._id, status: order.status } });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update order status." });
  }
});

app.post("/api/seed", async (req, res) => {
  const seedKey = req.header("x-seed-key");
  if (SEED_KEY && seedKey !== SEED_KEY) {
    return res.status(401).json({ message: "Invalid seed key" });
  }
  if (!MONGODB_URI) {
    return res
      .status(400)
      .json({ message: "MONGODB_URI not set on server" });
  }

  try {
    await connectToDatabase();
    const existing = await Product.countDocuments();
    if (existing > 0) {
      return res.json({
        message: "Database already seeded",
        products: existing
      });
    }

    await Category.insertMany(sampleCategories);
    await Product.insertMany(sampleProducts);

    return res.json({
      ok: true,
      counts: {
        categories: sampleCategories.length,
        products: sampleProducts.length
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Seed failed" });
  }
});

const port = Number(env.PORT || process.env.PORT || 3001);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
  seedIfEmpty();
}

module.exports = app;
