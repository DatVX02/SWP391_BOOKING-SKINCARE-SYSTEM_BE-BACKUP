require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/auth");
const voucherRoutes = require("./routes/voucherRoutes");
const userRoutes = require("./routes/userRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const payOS = require("./utils/payos");
const cartRoutes = require("./routes/cartRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use("/", express.static("public"));

// payment
app.use("/api/payments/webhook", webhookRoutes);
app.use("/api/payments", paymentRoutes);
app.post("/create-payment-link", async (req, res) => {
  const YOUR_DOMAIN = "http://localhost:5000";
  const body = {
    orderCode: Number(String(Date.now()).slice(-6)),
    amount: 1000,
    description: "Thanh toan don hang",
    returnUrl: `${YOUR_DOMAIN}/success.html`,
    cancelUrl: `${YOUR_DOMAIN}/cancel.html`,
  };

  try {
    const paymentLinkResponse = await payOS.createPaymentLink(body);
    res.redirect(paymentLinkResponse.checkoutUrl);
  } catch (error) {
    console.error(error);
    res.send("Something went error");
  }
});
//user
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
//product
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

//voucher
app.use("/api/vouchers", voucherRoutes);

//cart
app.use("/api/cart", cartRoutes);

app.use("/api/reviews", reviewRoutes);
// Connect DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
