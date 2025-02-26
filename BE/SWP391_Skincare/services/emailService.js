const nodemailer = require("nodemailer");
require("dotenv").config();

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Hàm gửi email xác nhận đơn hàng
const sendOrderConfirmationEmail = async (email, order) => {
  const mailOptions = {
    from: `"LuluSpa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Xác nhận đơn hàng của bạn",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Xác Nhận Đơn Hàng</h2>
            <p>Xin chào <strong>${order.customerName}</strong>,</p>
            <p>Đơn hàng của bạn đã được xác nhận với mã <strong>${
              order.BookingID
            }</strong>.</p>
            <h3>Thông tin đơn hàng:</h3>
            <ul>
                <li><strong>Dịch vụ:</strong> ${order.serviceName} (${
      order.serviceType
    })</li>
                <li><strong>Ngày đặt:</strong> ${order.bookingDate}</li>
                <li><strong>Giờ bắt đầu:</strong> ${order.startTime}</li>
                <li><strong>Giờ kết thúc:</strong> ${order.endTime}</li>
                <li><strong>Nhân viên:</strong> ${
                  order.Skincare_staff || "Chưa xác định"
                }</li>
                <li><strong>Tổng tiền:</strong> ${order.totalPrice} VND</li>
            </ul>
            <p style="color: #f44336; font-weight: bold;">Vui lòng đến đúng giờ để nhận dịch vụ tốt nhất.</p>
            <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ!</p>
        </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📩 Email xác nhận đơn hàng đã được gửi thành công!");
  } catch (error) {
    console.error("❌ Lỗi gửi email đơn hàng:", error);
  }
};

module.exports = { sendOrderConfirmationEmail };
