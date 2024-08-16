const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleWare/authenticateUser");
const {
  createLocalTransfer,
  getUserLocalTransfer,
  getAllLocalTransfer,
  verifyOtp,
} = require("../controllers/localTransferController");

router
  .post(
    "/local-transfer",
    authenticateUser,
    authorizePermissions("user", "admin"),
    createLocalTransfer
  )
  .post(
    "/verify-otp",
    authenticateUser,
    authorizePermissions("user", "admin"),
    verifyOtp
  )
  .get(
    "/local-transfer",
    authenticateUser,
    authorizePermissions("user", "admin"),
    getUserLocalTransfer
  )
  .get(
    "/local-transfer/admin",
    authenticateUser,
    authorizePermissions("admin"),
    getAllLocalTransfer
  );

module.exports = router;
