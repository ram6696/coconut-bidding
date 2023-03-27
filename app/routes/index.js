const express = require("express");

const rootRoute = express.Router();

const usersController = require("../controllers/userController");
const productController = require("../controllers/productController");
const walletController = require("../controllers/walletController");
const UserComplaints = require("../models/UserComplaints");

/* GET api root */
rootRoute.get("/status", (req, res, next) => {
    res.status(200).send("OK");
});

/**
 * API for user registration
 */
rootRoute.post("/users", usersController.createUser);
rootRoute.get("/users", usersController.getUsers);
rootRoute.get('/users/:id', usersController.getUserById);
rootRoute.delete("/users/:id", usersController.deleteUserByAdmin);
rootRoute.post('/users/forgot-password', usersController.forgotPassword);
rootRoute.post('/users/reset-password', usersController.resetPassword);

/**
 * API for products
 */
rootRoute.post("/products", productController.createProduct)
rootRoute.get("/products", productController.getProducts);
rootRoute.get("/products/:id", productController.getProductById);

/**
 * API for wallets
 */
rootRoute.post("/users/wallets", walletController.upsertWallet);
rootRoute.get("/users/:userName/wallets", walletController.getWalletByUserName);

/** 
 * API for complaints
 */
rootRoute.post("/users/complaints", async (req, res) => {
  try {
    const payload = req.body.complaint;
    if (!payload.complaintBy || !payload.complaintOn || !payload.productId || !payload.complaintText) {
      return AppResponse.badRequest(
        res,
        'MISSING_REQUIRED_FIELDS',
        'MISSING_REQUIRED_FIELDS' 
      ) 
    }
    const complaint = await UserComplaints.create(payload)
    return AppResponse.success(res, complaint)
  } catch (error) {
    throw error
  }
});

rootRoute.get("users/complaints", async (req, res) => {
  try {
    const complaints = await UserComplaints.find();
    return AppResponse.success(res, complaints)
  } catch (error) {
    throw error
  }
})

/**
 * API for user login
 */
rootRoute.post("/login", usersController.login);
// rootRoute.get("/employees/:employeeId", usersController.getEmployeeById);
// rootRoute.put("/employees/:employeeId", usersController.updateEmployee);
// rootRoute.delete("/employees/:employeeId", usersController.deleteEmployee);
module.exports = rootRoute;
