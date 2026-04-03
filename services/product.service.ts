import {prisma} from "../model/prisma" ;
import { deleteLocalUploadIfExists } from "../utils/uploadFile";

export class product_services {
    constructor(){} 
    
    // search 
    async search_product(fillters : {
        brand_id? : string ,
        gender? : string ,
        fragrance_family? : string ,
        is_new_arrival? : boolean ,
        search? : string ,
        page? : number ,
        limit? : number
    }){

        const { brand_id , gender , fragrance_family , is_new_arrival, search , page = 1 , limit = 10 } = fillters ;

        const where : any = {} ;

        if(brand_id) where.brand_id = brand_id ;
        if(gender) where.gender = gender ;
        if(fragrance_family) where.fragrance_family = fragrance_family ;
        if(typeof is_new_arrival === "boolean") where.is_new_arrival = is_new_arrival ;
        if(search) where.OR = [
            { name : { contains : search , mode : "insensitive" } } ,
            { description : { contains : search , mode : "insensitive" } } ,
            { brand : { name : { contains : search , mode : "insensitive" } } }
        ]

        const [ products , total ] = await prisma.$transaction([

            prisma.product.findMany({
                where , 
                skip : (page - 1) * limit ,
                take : limit ,
                orderBy : { created_at : "desc" } ,
                include : {
                    brand : { select : { id : true , name : true  , logo_url : true} },
                    reviews : { select : { rating : true } },
                    sizes : { select : { size : true , price : true } ,
                    orderBy : { price : "asc" } }
                }        
            }),
            prisma.product.count({ where })
        ]);

        const productsWithRating = products.map((p) => ({
            ...p ,
            avg_rating : 
                p.reviews.length > 0
                    ? p.reviews.reduce((sum , r) => sum + r.rating , 0) / p.reviews.length
                    : 0,
            reviews_count : p.reviews.length,
            reviews : undefined
        }));

        return {
            data : productsWithRating ,
            pagination : {
                total ,
                page ,
                limit ,
                total_pages : Math.ceil(total / limit)
            }
        }
    }

    // getProductById
    async getProductByIdService (id : string) {

        const product = await prisma.product.findUnique({
            where : { id : id},
            include : {
                brand : { select : { id : true , name : true  , logo_url : true} },
                sizes : { orderBy : { price : "asc" } } ,
                reviews : {
                    include : {
                        user : { select : { id : true , full_name : true , avatar_url : true } }
                    },
                    orderBy : { created_at : "desc" }
                }
            }
        });

        if(!product) throw new Error("Product not found") ;

        const avg_rating = product.reviews.length > 0
            ? product.reviews.reduce((sum , r) => sum + r.rating , 0) / product.reviews.length
            : 0;
        
        return {
            ...product ,
            avg_rating ,
            reviews_count : product.reviews.length
        }
    }

    // createProduct => only for admin
    async createProductService (data : {
        brand_id: string;
        name: string;
        description?: string;
        story?: string;
        image_url?: string;
        gender: string;
        fragrance_family: string;
        top_notes?: string;
        middle_notes?: string;
        base_notes?: string;
        is_featured?: boolean;
        is_new_arrival?: boolean;
        sizes: { size: string; price: number; stock: number }[];
    }) {

        const {sizes , ...productData} = data ;

        const product = await prisma.product.create({
            data : {
                ...productData,
                gender : productData.gender as any ,
                fragrance_family : productData.fragrance_family as any ,
                sizes : {
                    create : sizes
                }
            },
            include : {
                brand : { select : { id : true , name : true}},
                sizes : true
            }
        });

        return product ;    
    }

    // updateProduct
    async updateProductService(product_id : string , data : {
        name?: string;
        description?: string;
        story?: string;
        image_url?: string;
        gender?: string;
        fragrance_family?: string;
        top_notes?: string;
        middle_notes?: string;
        base_notes?: string;
        is_featured?: boolean;
        is_new_arrival?: boolean;
    }) {
        const existingProduct = await prisma.product.findUnique({
            where: { id: product_id },
            select: { id: true, image_url: true },
        });

        if (!existingProduct) {
            throw new Error("Product not found");
        }

        const product = await prisma.product.update({
            where : {id : product_id},
            data : {
                ...data ,
                gender : data.gender as any ,
                fragrance_family : data.fragrance_family as any
            },
            include : {
                brand: { select: { id: true, name: true } },
                sizes: true,
            }        
        });

        if (
            data.image_url &&
            existingProduct.image_url &&
            existingProduct.image_url !== data.image_url
        ) {
            await deleteLocalUploadIfExists(existingProduct.image_url);
        }

        return product ;
    }

    async updateProductImageService(product_id: string, image_url: string) {
        const existingProduct = await prisma.product.findUnique({
            where: { id: product_id },
            select: { id: true, image_url: true },
        });

        if (!existingProduct) {
            throw new Error("Product not found");
        }

        const product = await prisma.product.update({
            where: { id: product_id },
            data: { image_url },
            include: {
                brand: { select: { id: true, name: true } },
                sizes: true,
            },
        });

        if (existingProduct.image_url && existingProduct.image_url !== image_url) {
            await deleteLocalUploadIfExists(existingProduct.image_url);
        }

        return product;
    }

    async updateBrandLogoService(brand_id: string, logo_url: string) {
        const existingBrand = await prisma.brand.findUnique({
            where: { id: brand_id },
            select: { id: true, logo_url: true },
        });

        if (!existingBrand) {
            throw new Error("Brand not found");
        }

        const brand = await prisma.brand.update({
            where: { id: brand_id },
            data: { logo_url },
            select: { id: true, name: true, logo_url: true },
        });

        if (existingBrand.logo_url && existingBrand.logo_url !== logo_url) {
            await deleteLocalUploadIfExists(existingBrand.logo_url);
        }

        return brand;
    }

    // deleteProduct
    async deleteProductService (product_id : string) {

        await prisma.product.delete({ where : { id : product_id}});
        return { message : "Product deleted successfully" } ;
    }

    // getProductReviews
    async getProductReviewsService (product_id : string ){
        const reviews = await prisma.review.findMany({
            where : { product_id } ,
            include : {
                user : { select : { id : true , full_name : true , avatar_url : true } } 
            },
            orderBy : { created_at : "desc" }
        });
        return reviews ;
    }

    // addProductReview
    async addProductReviewService (user_id : string , product_id : string , rating : number , comment? : string) {
        
        // تأكد إن اليوزر اشترى المنتج
        const orderItem = await prisma.orderItem.findFirst({
            where : {
                product_id ,
                order : {
                    user_id ,
                    status : "delivered"
                }
            }
        });

        if(!orderItem) throw new Error("You can only review products you have purchased") ;

        const review = await prisma.review.create({
            data : {
                user_id ,
                product_id ,
                rating ,
                comment
            },
            include : {
                user : { select : { id : true , full_name : true , avatar_url : true } }
            }
        });
        return review ;
    }

}