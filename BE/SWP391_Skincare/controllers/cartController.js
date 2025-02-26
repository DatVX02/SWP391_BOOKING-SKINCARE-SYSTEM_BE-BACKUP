const Cart = require("../models/cartModel");
const Product = require("../models/Product");
const Voucher = require("../models/Voucher");
const { v4: uuidv4 } = require("uuid");

// Hàm tạo BookingID ngẫu nhiên: "BOOK" + 6 số ngẫu nhiên
const generateBookingID = () => {
  return `BOOK${Math.floor(100000 + Math.random() * 900000)}`; // Ví dụ: BOOK123456
};

// Hàm lấy ngày hiện tại ở định dạng YYYY-MM-DD
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // Lấy phần YYYY-MM-DD
};

// Tạo Cart mới với dữ liệu từ Product & Voucher
exports.createCart = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      notes,
      service_id,
      startTime,
      Skincare_staff,
      discountCode,
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (
      !service_id ||
      !startTime ||
      !customerName ||
      !customerEmail ||
      !customerPhone
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Tạo BookingID ngẫu nhiên
    const BookingID = generateBookingID();

    // Lấy ngày hiện tại nếu `bookingDate` không được gửi từ request
    const bookingDate = getCurrentDate();

    // Tìm sản phẩm theo service_id
    const product = await Product.findOne({ service_id }).populate(
      "category",
      "name"
    );
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Lấy thông tin sản phẩm
    const serviceName = product.name;
    const serviceType = product.category.name;
    const duration = product.duration;
    const totalPrice = product.price;

    // Tính endTime từ startTime + duration
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const totalMinutes = startHour * 60 + startMinute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(
      endMinute
    ).padStart(2, "0")}`;

    // Áp dụng Voucher nếu có
    let discountAmount = 0;
    if (discountCode) {
      const voucher = await Voucher.findOne({
        code: discountCode,
        isActive: true,
      });
      if (voucher && new Date(voucher.expiryDate) > new Date()) {
        discountAmount = (totalPrice * voucher.discountPercentage) / 100;
      }
    }

    // Tạo giỏ hàng mới
    const newCart = new Cart({
      CartID: uuidv4(),
      BookingID,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      service_id,
      serviceName,
      serviceType,
      bookingDate,
      startTime,
      endTime,
      duration,
      totalPrice: totalPrice - discountAmount,
      currency: "VND",
      discountCode,
      Skincare_staff,
    });

    await newCart.save();
    res
      .status(201)
      .json({ message: "Cart đã được tạo thành công!", cart: newCart });
  } catch (error) {
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

// 🔹 Lấy Cart theo `CartID`
exports.getCartById = async (req, res) => {
  try {
    const { cartID } = req.params;
    const cart = await Cart.findOne({ CartID: cartID });
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
