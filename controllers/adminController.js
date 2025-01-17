const User = require("../models/UserModel");
const sendEmail = require("../utils/emailSender");
const { handleError } = require("../utils/handleError");
const TransferAdmin = require("../models/TransferAdmin");
const LocalTransfer = require("../models/LocalTransferModel");
const WireTransfer = require("../models/WireTransferModel");
const InternalTransfer = require("../models/InternalTransferModel");

const editDate = async (req, res) => {
  try {
    const { transferId } = req.params;
    let updateDateTransfer = await TransferAdmin.findByIdAndUpdate(
      transferId,
      { date: req.body.date },
      { new: true }
    );
    console.log(updateDateTransfer);
    if (!updateDateTransfer) {
      updateDateTransfer = await LocalTransfer.findByIdAndUpdate(
        transferId,
        { date: req.body.date },
        { new: true }
      );
    }
    if (!updateDateTransfer) {
      updateDateTransfer = await WireTransfer.findByIdAndUpdate(
        transferId,
        { date: req.body.date },
        { new: true }
      );
    }
    if (!updateDateTransfer) {
      updateDateTransfer = await InternalTransfer.findByIdAndUpdate(
        transferId,
        { date: req.body.date },
        { new: true }
      );
    }

    if (!updateDateTransfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    // Respond with success message and updated transfer document
    res.status(200).json({
      message: "Date updated successfully",
      transfer: updateDateTransfer,
    });
  } catch (error) {
    console.error("Error updating transfer date:", error.message);
    res.status(400).json({ error: "Failed to update transfer date" });
  }
};

const adminTransfer = async (req, res) => {
  try {
    const { account_number, amount, status, account, remarks } = req.body;
    console.log(pin);

    if (!account_number || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid input data." });
    }

    const admin = await User.findById(req.user.userId);
    console.log(admin.pin);
    if (admin.pin && admin.pin !== pin) {
      return res.status(401).json({ status: "failed", error: "Invalid PIN." });
    }

    let user;

    user = await User.findOne({ savings_account_number: account_number });

    if (!user) {
      user = await User.findOne({ checkings_account_number: account_number });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (account === "savings") {
      user.savings_balance += parseInt(amount);
      await user.save();
    } else if (account === "checkings") {
      user.checkings_balance += parseInt(amount);
    }

    const internalTransfer = await TransferAdmin.create({
      amount,
      account_number,
      status,
      user: user._id,
      account,
      remarks,
    });

    const subject = "Grant Transfer successful";
    const text = `Hi ${user.name},\n\nWelcome to YourApp! Your registration was successful.`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Confirmation</title>
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
          <h1>Deposit Confirmation</h1>
          
          <p>Dear ${user.name}, Your deposit has been confirmed.</p>
          
          <p><strong>Deposit amount:</strong> $${internalTransfer.amount}</p>
          
          <p><strong>Deposit type:</strong> Transfer deposit</p>
          
          <p><strong>Sender Details:</strong> Grant funds/dep.</p>
          
          <p><strong>Transaction ID: ${internalTransfer._id}</strong></p>
          
          <p>If you have any questions regarding this deposit, please contact our support team.</p>
          
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
      </body>
      </html>
    `;

    await Promise.all([
      sendEmail(user.email, subject, text, html),
      sendEmail("anniemary841@gmail.com", subject, text, html),
      sendEmail("companychris00@gmail.com", subject, text, html),
    ]);

    res.status(200).json({
      message: `${amount} transferred to ${user.name} successfully.`,
      internalTransfer,
    });
  } catch (error) {
    const errors = handleError(error);
    console.log(error);
    res.status(400).json({ status: "failed", error: errors });
  }
};

const getAllUser = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const paidUpdate = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch the user to check the current isPaid status
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "No user found" });
    }

    // Toggle the isPaid status
    user.isPaid = !user.isPaid;

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json({ status: "success", user: updatedUser });
  } catch (error) {
    console.error(error); // Using console.error for better error logging
    res.status(500).json({ error: error.message });
  }
};

const updateTransferFailed = async (req, res) => {
  const { transferId } = req.params;

  let transfer = null;

  // Attempt to find the transferId in each model
  transfer = await WireTransfer.findOne({ _id: transferId });
  if (!transfer) {
    transfer = await LocalTransfer.findOne({ _id: transferId });
  }
  if (!transfer) {
    transfer = await InternalTransfer.findOne({ _id: transferId });
  }
  if (!transfer) {
    transfer = await TransferAdmin.findOne({ _id: transferId });
  }
  if (!transfer) {
    return res
      .status(404)
      .json({ error: `no transfer found with id ${transferId} ` });
  }
  transfer.status = "failed";
  await transfer.save();
  const user = await User.findById(transfer.user);
  res.status(200).json({
    status: "success",
    message: "transfer updated successfully",
    transfer,
  });

  const subject = "Transfer Failed";
  const text = `Hi ${transfer.name},\n\.`;
  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Confirmation</title>
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
          <h1>Transaction failed</h1>
          
    
          
          <p>If you have any questions regarding this deposit, please contact our support team.</p>
          
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
      </body>
      </html>
    `;

  await Promise.all([
    sendEmail(user.email, subject, text, html),
    sendEmail("anniemary841@gmail.com", subject, text, html),
    sendEmail("companychris00@gmail.com", subject, text, html),
  ]);
};

const updateTransferCompleted = async (req, res) => {
  const { transferId } = req.params;
  let transfer = null;

  // Attempt to find the transferId in each model
  transfer = await WireTransfer.findOne({ _id: transferId });
  if (!transfer) {
    transfer = await LocalTransfer.findOne({ _id: transferId });
  }
  if (!transfer) {
    transfer = await InternalTransfer.findOne({ _id: transferId });
  }
  if (!transfer) {
    transfer = await TransferAdmin.findOne({ _id: transferId });
  }

  if (!transfer) {
    return res
      .status(404)
      .json({ error: `no transfer found with id ${transferId} ` });
  }

  transfer.status = "completed";
  await transfer.save();
  const user = await User.findById(transfer.user);
  res.status(200).json({
    status: "success",
    message: "transfer updated successfully",
    transfer,
  });

  const subject = "Transfer completed";
  const text = `Hi ${user.name},\n\.`;
  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Confirmation</title>
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
          <h1>Transaction completed email</h1>
          
    
          
          <p>If you have any questions regarding this deposit, please contact our support team.</p>
          
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
      </body>
      </html>
    `;

  await Promise.all([
    sendEmail(user.email, subject, text, html),
    sendEmail("anniemary841@gmail.com", subject, text, html),
    sendEmail("companychris00@gmail.com", subject, text, html),
  ]);
};

const updateTransferPending = async (req, res) => {
  const { transferId } = req.params;
  let transfer = null;

  // Attempt to find the transferId in each model
  transfer = await WireTransfer.findOne({ _id: transferId });
  if (!transfer) {
    transfer = await LocalTransfer.findOne({ _id: transferId });
  }
  if (!transfer) {
    transfer = await InternalTransfer.findOne({ _id: transferId });
  }
  if (!transfer) {
    transfer = await TransferAdmin.findOne({ _id: transferId });
  }
  if (!transfer) {
    return res
      .status(404)
      .json({ error: `no transfer found with id ${transferId} ` });
  }

  transfer.status = "pending";
  await transfer.save();
  const user = await User.findById(transfer.user);
  res.status(200).json({
    status: "success",
    message: "transfer updated successfully",
    transfer,
  });

  const subject = "Transfer pending";
  const text = `Hi ${user.name},\n\.`;
  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Confirmation</title>
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
          <h1>Transaction pending emails </h1>
          
    
          
          <p>If you have any questions regarding this deposit, please contact our support team.</p>
          
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
      </body>
      </html>
    `;

  await Promise.all([
    sendEmail(user.email, subject, text, html),
    sendEmail("anniemary841@gmail.com", subject, text, html),
    sendEmail("companychris00@gmail.com", subject, text, html),
  ]);
};

const getAllTransfersAdmin = async (req, res) => {
  try {
    const wireTransfers = await WireTransfer.find({})
      .sort({ createdAt: -1 })
      .lean();

    const localTransfers = await LocalTransfer.find({})
      .sort({ createdAt: -1 })
      .lean();

    const internalTransfers = await InternalTransfer.find({
      user: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const transferAdmin = await TransferAdmin.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Combine all transfers into a single history array
    const allTransfersHistory = [];

    // Function to push transfers into the history array
    const pushTransferToHistory = (transfer) => {
      allTransfersHistory.push(transfer);
    };

    // Push transfers from each type into the combined history array
    transferAdmin.forEach((transfer) => pushTransferToHistory(transfer));
    wireTransfers.forEach((transfer) => pushTransferToHistory(transfer));
    localTransfers.forEach((transfer) => pushTransferToHistory(transfer));
    internalTransfers.forEach((transfer) => pushTransferToHistory(transfer));

    // Sort the combined history array from newest to oldest
    allTransfersHistory.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Return the combined history array as response
    res.status(200).json({
      nbhits: allTransfersHistory.lenght,
      history: allTransfersHistory,
    });
  } catch (error) {
    console.error("Error fetching transfer histories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  adminTransfer,
  getAllUser,
  updateTransferCompleted,
  updateTransferFailed,
  updateTransferPending,
  getAllTransfersAdmin,
  editDate,
  paidUpdate,
};
