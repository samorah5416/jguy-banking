const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleWare/authenticateUser");
const {
  adminTransfer,
  getAllUser,
  updateTransferCompleted,
  updateTransferFailed,
  updateTransferPending,
  getAllTransfersAdmin,
  editDate,
  paidUpdate
} = require("../controllers/adminController");

router
  .post(
    "/transfer/admin",
    authenticateUser,
    authorizePermissions("admin"),
    adminTransfer
  )
  .post(
    "/paid-update/admin/:userId",
    authenticateUser,
    authorizePermissions("admin"),
    paidUpdate
  )
  .post(
    "/edit-date/admin/:transferId",
    authenticateUser,
    authorizePermissions("admin"),
    editDate
  )
  .post(
    "/transfer/completed/:transferId",
    authenticateUser,
    authorizePermissions("admin"),
    updateTransferCompleted
  )
  .post(
    "/transfer/failed/:transferId",
    authenticateUser,
    authorizePermissions("admin"),
    updateTransferFailed
  )
  .post(
    "/transfer/pending/:transferId",
    authenticateUser,
    authorizePermissions("admin"),
    updateTransferPending
  )
  .get(
    "/user/admin",
    authenticateUser,
    authorizePermissions("admin"),
    getAllUser
  )
  .get(
    "/all-transfer/admin",
    authenticateUser,
    authorizePermissions("admin"),
    getAllTransfersAdmin
  );

module.exports = router;
