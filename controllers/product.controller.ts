import { Request , Response } from "express";
import multer from "multer";
import { product_services } from "../services/product.service";
import { toPublicUploadPath } from "../utils/uploadFile";

const productService = new product_services() ;

export const getProducts = async (req : Request , res : Response) => {

    try {
        const {brand_id, gender, fragrance_family, search, is_new_arrival, page, limit} = req.query ;

        let isNewArrival: boolean | undefined;
        if (typeof is_new_arrival === "string") {
            isNewArrival = is_new_arrival.toLowerCase() === "true";
        }

        const products = await productService.search_product({
            brand_id : brand_id as string ,
            gender : gender as string ,
            fragrance_family : fragrance_family as string ,
            is_new_arrival : isNewArrival,
            search : search as string ,
            page : parseInt(page as string) || 1 ,
            limit : parseInt(limit as string) || 10
        });

       res.status(200).json(products) ;

    } 
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}

export const getProductById = async (req : any , res : Response) => {

    try {
        const  id : string = req.params.id ;

        const product = await productService.getProductByIdService(id) ;
        res.status(200).json(product) ;
    }
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}

// Admin only
export const createProduct = async (req : any , res : Response) => {

    try {
        const productData = req.body ;
        const product = await productService.createProductService(productData) ;
        res.status(201).json(product) ;
    }
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}

export const updateProduct = async (req : any , res : Response) => {

    try {
        const product_id = req.params.id ;
        const data = req.body ;
        const updatedProduct = await productService.updateProductService(product_id , data) ;
        res.status(200).json(updatedProduct) ;
    }
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}

export const uploadProductImageById = async (req: any, res: Response) => {
    try {
        const product_id = req.params.id;

        if (!req.file) {
            res.status(400).json({ error: "Product image is required" });
            return;
        }

        const image_url = toPublicUploadPath(req.file.path);
        const updatedProduct = await productService.updateProductImageService(product_id, image_url);
        res.status(200).json(updatedProduct);
    }
    catch (error: any) {
        if (error instanceof multer.MulterError) {
            const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            res.status(statusCode).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: error.message });
    }
}

export const addBrandLogoImage = async (req: any, res: Response) => {
    try {
        const brand_id = req.params.brand_id;

        if (!req.file) {
            res.status(400).json({ error: "Brand logo is required" });
            return;
        }

        const logo_url = toPublicUploadPath(req.file.path);
        const brand = await productService.updateBrandLogoService(brand_id, logo_url);
        res.status(200).json(brand);
    }
    catch (error: any) {
        if (error instanceof multer.MulterError) {
            const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            res.status(statusCode).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: error.message });
    }
}

export const deleteProduct = async (req : any , res : Response) => {

    try {
        const product_id = req.params.id ;
        await productService.deleteProductService(product_id) ;
        res.status(200).json({ message : "Product deleted successfully" }) ;
    }
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}

export const getProductReviews = async (req : any , res : Response) => {

    try {
        const product_id = req.params.id ;
        const reviews = await productService.getProductReviewsService(product_id) ;
        res.status(200).json(reviews) ;
    }
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}

export const addProductReview = async (req : any , res : Response) => {

    try {
        const product_id = req.params.id ;
        const user_id = req.user.userId ;
        const { rating , comment } = req.body ;

        if(!rating){
            res.status(400).json({ error : "Rating is required" }) ;
            return ;
        }

        const review = await productService.addProductReviewService(user_id , product_id , rating , comment) ;
        res.status(201).json(review) ;
    }
    catch (error : any) {
        res.status(500).json({ error : error.message }) ;
    }
}