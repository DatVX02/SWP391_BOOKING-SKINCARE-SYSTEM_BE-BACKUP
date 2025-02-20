const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"vxdat13@gmail.com" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã OTP xác thực tài khoản của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Xác Thực Tài Khoản</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP sau:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #f44336; padding: 10px; border-radius: 5px; background: #f8d7da;">
          ${otp}
        </div>
        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        <hr />
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP đã được gửi thành công!");
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
  }
};

module.exports = { sendOTP };
