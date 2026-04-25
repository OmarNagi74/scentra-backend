import {prisma} from "../model/prisma" ;
import { deleteLocalUploadIfExists, toAbsoluteUploadUrl } from "../utils/uploadFile";

export class ProductServiceError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

const ALLOWED_GENDERS = new Set(["male", "female", "unisex"]);
const ALLOWED_FRAGRANCE_FAMILIES = new Set([
    "floral",
    "woody",
    "oriental",
    "fresh",
    "citrus",
    "aquatic",
]);

const normalizeBrand = (baseUrl: string, brand?: { id: string; name: string; logo_url?: string | null } | null) => {
    if (!brand) {
        return brand;
    }

    return {
        ...brand,
        logo_url: toAbsoluteUploadUrl(baseUrl, brand.logo_url),
    };
};

const normalizeReview = (baseUrl: string, review: any) => {
    if (!review) {
        return review;
    }

    return {
        ...review,
        user: review.user
            ? {
                  ...review.user,
                  avatar_url: toAbsoluteUploadUrl(baseUrl, review.user.avatar_url),
              }
            : review.user,
    };
};

const normalizeProduct = (baseUrl: string, product: any) => ({
    ...product,
    image_url: toAbsoluteUploadUrl(baseUrl, product.image_url),
    brand: normalizeBrand(baseUrl, product.brand),
    reviews: Array.isArray(product.reviews)
        ? product.reviews.map((review: any) => normalizeReview(baseUrl, review))
        : product.reviews,
});

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
    }, baseUrl = ""){

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

        const normalizedProducts = products.map((product: any) => normalizeProduct(baseUrl, product));

        const productsWithRating = normalizedProducts.map((product: any) => ({
            ...product ,
            avg_rating : 
                product.reviews.length > 0
                    ? product.reviews.reduce((sum: number , r: any) => sum + r.rating , 0) / product.reviews.length
                    : 0,
            reviews_count : product.reviews.length,
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
    async getProductByIdService (id : string , baseUrl = "") {

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

        const normalizedProduct = normalizeProduct(baseUrl, product);
        const avg_rating = normalizedProduct.reviews.length > 0
            ? normalizedProduct.reviews.reduce((sum: number , r: any) => sum + r.rating , 0) / normalizedProduct.reviews.length
            : 0;
        
        return {
            ...normalizedProduct ,
            avg_rating ,
            reviews_count : normalizedProduct.reviews.length
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
    }, baseUrl = "") {
        const brandId = typeof data.brand_id === "string" ? data.brand_id.trim() : "";
        const name = typeof data.name === "string" ? data.name.trim() : "";
        const gender = typeof data.gender === "string" ? data.gender.trim().toLowerCase() : "";
        const fragranceFamily = typeof data.fragrance_family === "string"
            ? data.fragrance_family.trim().toLowerCase()
            : "";

        if (!brandId) {
            throw new ProductServiceError(400, "brand_id is required");
        }

        if (!name) {
            throw new ProductServiceError(400, "name is required");
        }

        if (!ALLOWED_GENDERS.has(gender)) {
            throw new ProductServiceError(400, "Invalid gender");
        }

        if (!ALLOWED_FRAGRANCE_FAMILIES.has(fragranceFamily)) {
            throw new ProductServiceError(400, "Invalid fragrance_family");
        }

        if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
            throw new ProductServiceError(400, "At least one size is required");
        }

        const normalizedSizes = data.sizes.map((entry) => {
            const size = typeof entry.size === "string" ? entry.size.trim() : "";
            const price = Number(entry.price);
            const stock = Number(entry.stock);

            if (!size) {
                throw new ProductServiceError(400, "Each size requires a non-empty size value");
            }

            if (!Number.isFinite(price) || price <= 0) {
                throw new ProductServiceError(400, `Invalid price for size ${size}`);
            }

            if (!Number.isFinite(stock) || stock < 0) {
                throw new ProductServiceError(400, `Invalid stock for size ${size}`);
            }

            return {
                size,
                price,
                stock: Math.floor(stock),
            };
        });

        const sizeKeys = new Set<string>();
        for (const size of normalizedSizes) {
            const key = size.size.toLowerCase();
            if (sizeKeys.has(key)) {
                throw new ProductServiceError(400, `Duplicate size value: ${size.size}`);
            }
            sizeKeys.add(key);
        }

        const existingBrand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { id: true },
        });

        if (!existingBrand) {
            throw new ProductServiceError(404, "Brand not found");
        }

        const {sizes , ...productData} = data ;
        void sizes;

        const product = await prisma.product.create({
            data : {
                ...productData,
                brand_id: brandId,
                name,
                gender : gender as any ,
                fragrance_family : fragranceFamily as any ,
                sizes : {
                    create : normalizedSizes
                }
            },
            include : {
                brand : { select : { id : true , name : true , logo_url : true }},
                sizes : true
            }
        });

        return normalizeProduct(baseUrl, product) ;    
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
    }, baseUrl = "") {
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
                brand: { select: { id: true, name: true, logo_url: true } },
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

        return normalizeProduct(baseUrl, product) ;
    }

    async updateProductImageService(product_id: string, image_url: string , baseUrl = "") {
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
                brand: { select: { id: true, name: true, logo_url: true } },
                sizes: true,
            },
        });

        if (existingProduct.image_url && existingProduct.image_url !== image_url) {
            await deleteLocalUploadIfExists(existingProduct.image_url);
        }

        return normalizeProduct(baseUrl, product);
    }

    async updateBrandLogoService(brand_id: string, logo_url: string , baseUrl = "") {
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

        return normalizeBrand(baseUrl, brand);
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

        //if(!orderItem) throw new Error("You can only review products you have purchased") ;

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