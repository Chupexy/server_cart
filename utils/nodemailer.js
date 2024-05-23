const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendPasswordReset = async (email, fullname, resetPasswordCode) => {
  try {
    const info = await transport.sendMail({
      from: `Cart`,
      to: email,
      subject: "Reset your password",
      html: `<div>
            <div style="display: flex; align-items: center;">
                <img alt="Logo" style="height: 50px; margin-right: 8px; width: 50px;" src="https://drive.google.com/uc?export=view&id=1VxBysUQV0835JiijO4hs24M9A0rZ_Q-d">
                <img alt="Heurekka" style="height: 30px; margin-right: 8px;" src="https://drive.google.com/uc?export=view&id=1REJbJrhQZakh4UD3gypU8OPa-A2RJVZA">
            </div>
            <br/>
            <p style="line-height: 1.2;">Hi ${fullname},</p>
            <p style="line-height: 1.2;">We've received a request to reset your password.</p>
            <p style="line-height: 1.5;">If you didn't make the request, just ignore this message. Otherwise, you can reset your password.</p>        
            <a href=http://localhost:3000/user_profile/reset_password/${resetPasswordCode}>
                <button style="font-weight: 500;font-size: 14px;cursor: pointer; background-color: rgba(238, 119, 36, 1); border: none; border-radius: 4px; padding: 12px 18px 12px 18px; color: white;">
                    Reset your password
                </button>
            </a>
            <br/>
            <br/>
            <br/>
            <br/>
            <p style="line-height: 1.5">If you did not make this request, please ignore this email. <br /><br />Best regards, <br />Team Cart.</p>
            </div>`
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};

// const sendOTP = async (email, otp) => {
//   try {
//     const info = await transport
//       .sendMail({
//         from: `foodkart.dev@gmail.com <${process.env.MAIL_USER}>`,
//         to: email,
//         subject: "One Time Password",
//         html: `<p style="line-height: 1.5">
//         Your OTP verification code is: <br /> <br />
//         <font size="3">${otp}</font> <br />
//         Best regards,<br />
//         Team FoodKart.
//         </p>
//         </div>`,
//       });

//     console.log("Email sent:", info.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//     return { msg: "Error sending email", error };
//   }
// };

// const sendAccountApproval = async (email, fullname) => {
//   try {
//     const info = await transport
//       .sendMail({
//         from: `foodkart.dev@gmail.com <${process.env.MAIL_USER}>`,
//         to: email,
//         subject: "Account Approval",
//         html: `<p style="line-height: 1.5">
//         Congratulations ${fullname}, you account has been approved.
//         You can now log in and gain access to your account.
//         Best regards,<br />
//         Team FoodKart.
//         </p>
//         </div>`,
//       });

//     console.log("Email sent:", info.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//     return { msg: "Error sending email", error };
//   }
// }

// const sendAccountDecline = async (email, fullname) => {
//   try {
//     const info = await transport
//       .sendMail({
//         from: `foodkart.dev@gmail.com <${process.env.MAIL_USER}>`,
//         to: email,
//         subject: "Account Approval",
//         html: `<p style="line-height: 1.5">
//         Hello ${fullname}, this is to inform you that your account approval request has been denied.
//         Please ensure you double check the details sent in and make sure they are correct
//         Best regards,<br />
//         Team FoodKart.
//         </p>
//         </div>`,
//       });

//     console.log("Email sent:", info.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//     return { msg: "Error sending email", error };
//   }
// }

// const sendAccountVerification = async (email, fullname) => {
//   try {
//     const info = await transport
//       .sendMail({
//         from: `foodkart.dev@gmail.com <${process.env.MAIL_USER}>`,
//         to: email,
//         subject: "Account Verification",
//         html: `<p style="line-height: 1.5">
//         Congratulations ${fullname}, you account has been verified.
//         You can now enjoy the perks that comes with this status.
//         Best regards,<br />
//         Team FoodKart.
//         </p>
//         </div>`,
//       });

//     console.log("Email sent:", info.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//     return { msg: "Error sending email", error };
//   }
// }

module.exports = {
  sendPasswordReset,
  //sendOTP,
  //sendAccountApproval,
  //sendAccountDecline,
  //sendAccountVerification
};