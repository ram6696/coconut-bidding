const ProductModel = require("../models/Products");
const AppResponse = require("../services/AppResponse");
const UserProductBiddingModel = require("../models/UserProductBidding");
const Users = require("../models/Users");

const createProduct = async (req, res) => {
    try {
      const payload = req.body.product;
      const product = await ProductModel.create(payload)
      return AppResponse.success(res, product)
    } catch (error) {
      if(error.message.includes('E11000 duplicate key error collection')) {
        return AppResponse.conflict(
          res,
          'Product with the same name already exists',
          error.message
        )
      } else if (error.name = 'ValidationError') {
        return AppResponse.badRequest(
          res,
          'Invalid Payload',
          error.message
        )
      } else {
        return AppResponse.error(
          res,
          'INTERNAL SERVER ERROR',
          error.message
        )
      }
    }
};

const getProducts = async (req, res) => {
    try {
      const conditions = []
      const { producerId } = req.query;
      if(producerId) {
        conditions.push(producerId)
      }

      const aggregation = [];

      if(conditions.length) {
        aggregation.push({
          $match: { $and: conditions },
        })
      }
      aggregation.push(
        {
          $project: {
            producerId: 1,
            name: 1,
            _id: 1,
            basePrice: 1,
            imageUrl: 1,
            bidStartDate: 1,
            bidEndDate: 1,
            noOfUnits: 1,
            createdAt: 1,
            updatedAt: 1,
            productType: 1,
            dateDiffs: {
              $dateDiff: {
                startDate: new Date(),
                endDate: "$bidEndDate",
                unit: 'day'
              }
            }
          }
        }
      )

      aggregation.push({
        $sort: {
          dateDiffs: -1
        }
      })

      const products = await ProductModel.aggregate(aggregation);
        const updatedProducts = []
        for (const product of products) {
          updatedProducts.push(await getHighestBidder(product))
        }
        return AppResponse.success(res, {products: updatedProducts})
      } catch (error) {
        return AppResponse.error(
          res,
          'INTERNAL SERVER ERROR',
          error.message
        )
      }
  };

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        console.log(product, 'product controller');
        const updatedProduct = await getHighestBidder(product)
        return AppResponse.success(res, {product: updatedProduct})
    } catch (error) {
        return AppResponse.error(
            res,
            'INTERNAL SERVER ERROR',
            error.message
      )
    }
};

const getHighestBidder = async (product) => {
  const productCopy = JSON.parse(JSON.stringify(product))
  if(new Date(productCopy.bidEndDate) <= new Date()) {
    // get the highest biding for the productId
    const userProductBiding = await UserProductBiddingModel.
      find({productId: productCopy._id.toString()}).sort({biddingAmount: -1});
    const userProductBidingCopy = JSON.parse(JSON.stringify(userProductBiding));
    if(userProductBidingCopy.length) {
      const highestBidding = userProductBidingCopy[0];
      // get the user details for the same
      const userDetails = await Users.findOne({userName: highestBidding.userName});
      if(userDetails) {
        const userDetailsCopy = JSON.parse(JSON.stringify(userDetails));
        delete userDetailsCopy.password;
        productCopy['biddingWinner'] = {
          biddingAmount: highestBidding.biddingAmount,
          ...userDetailsCopy,
        }
      }
    }
  }
  return productCopy;
}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
}