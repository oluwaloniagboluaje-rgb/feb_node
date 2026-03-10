const express = require("express")
const { listProduct, getproducts, getproductsBy } = require("../controllers/product.contoller")
const { verifyUser } = require("../controllers/user.controller")

const router = express.Router()

router.post("/addProduct",verifyUser, listProduct)
router.get("/products",verifyUser, getproducts)
router.get("/productsBy/",verifyUser ,getproductsBy)



module.exports = router