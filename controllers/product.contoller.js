const { response } = require("express")
const ProductModel = require("../models/product.model")
const cloudinary = require("cloudinary").v2


cloudinary.config({
    api_key:process.env.CLOUD_KEY,
    cloud_name:process.env.CLOUD_NAME,
    api_secret:process.env.CLOUD_SECRET
})


const listProduct=async(request, response)=>{
    const{productName, productPrice, productQuantity, productImage}= request.body

    
    
    try {
        // console.log(productImage);
       const result = await cloudinary.uploader.upload(productImage)

       let image = {
        public_id:result.public_id,
        secure_url: result.secure_url
       }

        const product = await ProductModel.create({
            productName,
            productPrice,
            productQuantity,
            productImage:image,
            createdBy:request.user.id
        })

        response.status(201).send({
            message:"Product added successfully",
            data:product
        })
    } catch (error) {
        console.log(error);

        response.status(400).send({
            message:"Error adding product"
        })
        
    }
}


const getproducts=async(request, response)=>{
    try {
        const products = await ProductModel.find().populate("createdBy","firstName lastName email")

        response.status(200).send(
            {
                message:"Products fetched successfully",
                data:products

            }
        )
    } catch (error) {
        console.log(error);
        
        response.status(404).send({
            message:"failed to fetch products"
        })
    }
}


const getproductsBy=async(request, response)=>{
const {productName, productPrice, createdBy}= request.query
    const page = parseInt(request.query.page)||1
    const limit = parseInt(request.query.limit)||10
    const skip = (page -1)*10

    try {
        const filter ={}
        if(productName)
          filter.productName={$regex:productName , $options:"i"} 
        if(productPrice)
            filter.productPrice= productPrice
        if(createdBy)
            filter.createdBy= createdBy
        // if(author)
        //     filter.author= {$regex:author.firstName, $options:"i"}

        const product =await ProductModel.find(filter).populate("createdBy","firstName lastName email")
        .skip(skip)
        .limit(limit)
        .sort({createdAt:-1})


        const total = await ProductModel.countDocuments(filter)

        response.status(200).send({
            message:"Products fetched successfully",
            data:product,
            meta:{
                currentPage:page,
                totalPages:Math.ceil(total/limit),
                total
            }
        })
        
    } catch (error) {
        console.log(error);
        
        response.status(404).send({
            message:"Failed to fetch products"
        })
    }
}



module.exports= {
    listProduct,
    getproducts,
    getproductsBy
}