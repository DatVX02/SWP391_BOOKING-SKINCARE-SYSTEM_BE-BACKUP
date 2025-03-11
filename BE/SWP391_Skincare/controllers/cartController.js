const Cart = require("../models/cartModel");
const Product = require("../models/Product");
const Voucher = require("../models/Voucher");
const { v4: uuidv4 } = require("uuid");
const { sendOrderConfirmationEmail } = require("../services/emailService"); // 🔥 Import hàm gửi email
const User = require("../models/User");
// Hàm tạo BookingID ngẫu nhiên: "BOOK" + 6 số ngẫu nhiên
const generateBookingID = () => {
  return `BOOK${Math.floor(100000 + Math.random() * 900000)}`; // Ví dụ: BOOK123456
};

// Hàm lấy ngày hiện tại ở định dạng YYYY-MM-DD
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // Lấy phần YYYY-MM-DD
};

const calculateEndTime = (startTime, duration) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const totalMinutes = startHour * 60 + startMinute + duration;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(
    2,
    "0"
  )}`;
};

// Tạo Cart mới với dữ liệu từ Product & Voucher
exports.createCart = async (req, res) => {
  try {
    const {
      username,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      service_id,
      startTime,
      Skincare_staff,
      discountCode,
    } = req.body;

    if (
      !username ||
      !service_id ||
      !startTime ||
      !customerName ||
      !customerPhone
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    console.log("📌 Username nhận từ frontend:", username); // Kiểm tra username

    const BookingID = generateBookingID();
    const bookingDate = getCurrentDate();

    const product = await Product.findOne({ service_id }).populate(
      "category",
      "name"
    );
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const newCart = new Cart({
      CartID: uuidv4(),
      BookingID,
      username,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      service_id,
      serviceName: product.name,
      serviceType: product.category.name,
      bookingDate,
      startTime,
      endTime: calculateEndTime(startTime, product.duration), // 🔥 Sửa lỗi ở đây
      duration: product.duration,
      totalPrice:
        product.price -
        (discountCode ? calculateDiscount(product.price, discountCode) : 0),
      currency: "VND",
      discountCode,
      Skincare_staff,
    });

    await newCart.save();
    await sendOrderConfirmationEmail(customerEmail, newCart);

    res
      .status(201)
      .json({ message: "Cart đã được tạo thành công!", cart: newCart });
  } catch (error) {
    console.error("📌 Lỗi khi tạo giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi tạo Cart!", error });
  }
};
// Lấy danh sách Cart
exports.getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find();
    res.status(200).json(carts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách Cart!", error });
  }
};
exports.getCartsByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const decodedUsername = decodeURIComponent(username);

    // 🔥 Chỉ lấy đơn hàng của `username` hiện tại
    const carts = await Cart.find({ username: decodedUsername });

    if (!carts.length) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng nào!" });
    }

    res.status(200).json(carts);
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng theo username:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy giỏ hàng!", error: error.message });
  }
};


// 🔹 Lấy Cart theo `CartID`
exports.getCartById = async (req, res) => {
  try {
    const { cartID } = req.params;
    const cart = await Cart.findOne({ CartID: cartID }).populate(
      "userId",
      "username email"
    );
    if (!cart) return res.status(404).json({ message: "Không tìm thấy Cart!" });
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy Cart!", error });
  }
};

// 🔹 Xóa Cart theo `CartID`
exports.deleteCart = async (req, res) => {
  try {
    const { cartID } = req.params;
    const deletedCart = await Cart.findOneAndDelete({ CartID: cartID });
    if (!deletedCart) {
      return res.status(404).json({ message: "Không tìm thấy Cart!" });
    }
    res.status(200).json({ message: "Cart đã được xóa!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa Cart!", error });
  }
};

// 🔹 Cập nhật Cart theo `CartID`
exports.updateCart = async (req, res) => {
  try {
    const { cartID } = req.params;
    const updateData = req.body;

    // Tìm giỏ hàng theo CartID
    let cart = await Cart.findOne({ CartID: cartID });
    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy Cart!" });
    }

    // Cập nhật các trường nếu có trong request body
    Object.assign(cart, updateData);

    // Nếu có thay đổi startTime, tính toán lại endTime
    if (updateData.startTime && cart.duration) {
      const [startHour, startMinute] = updateData.startTime
        .split(":")
        .map(Number);
      const totalMinutes = startHour * 60 + startMinute + cart.duration;
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;
      cart.endTime = `${String(endHour).padStart(2, "0")}:${String(
        endMinute
      ).padStart(2, "0")}`;
    }

    await cart.save();
    res.status(200).json({ message: "Cart đã được cập nhật!", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật Cart!", error });
  }
};
// ✅ Cập nhật trạng thái giỏ hàng thành "Cancel"
exports.cancelCart = async (req, res) => {
  try {
    const { cartID } = req.params; // Lấy CartID từ URL

    // Tìm giỏ hàng theo CartID
    const cart = await Cart.findOne({ CartID: cartID });
    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy Cart!" });
    }

    // Cập nhật trạng thái thành "Cancel"
    cart.Status = "Cancel";
    await cart.save();

    res.status(200).json({ message: "Cart đã bị hủy!", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hủy Cart!", error });
  }
};
