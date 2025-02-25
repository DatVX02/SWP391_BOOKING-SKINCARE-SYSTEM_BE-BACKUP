const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm gửi OTP cho đăng ký tài khoản
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
        <hr />
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP đăng ký đã được gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email đăng ký:", error);
  }
};

// Hàm gửi OTP cho reset password
const sendResetPasswordOTP = async (email, otp) => {
  const mailOptions = {
    from: `"vxdat13@gmail.com" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã OTP để đặt lại mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã OTP sau để tiếp tục:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #2196F3; padding: 10px; border-radius: 5px; background: #D6EAF8;">
          ${otp}
        </div>
        <hr />
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP reset password đã được gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email reset password:", error);
  }
};
const sendAdminVerificationEmail = async (email, verifyLink) => {
  const mailOptions = {
    from: `"vxdat13@gmail.com" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Xác thực tài khoản",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Xác Thực Tài Khoản</h2>
        <p>Xin chào,</p>
        <p>Bạn đã được tạo tài khoản Admin. Để hoàn tất quá trình xác thực, vui lòng nhấp vào đường dẫn sau:</p>
        <div style="text-align: center; padding: 10px;">
          <a href="${verifyLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Xác Thực Ngay
          </a>
        </div>
        <p>Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email xác thực Admin đã được gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email xác thực Admin:", error);
  }
};

module.exports = { sendOTP, sendResetPasswordOTP, sendAdminVerificationEmail };


