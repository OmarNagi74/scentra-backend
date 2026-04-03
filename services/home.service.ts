import {prisma} from "../model/prisma";

export class home_services {
    constructor(){}   
    
    async getHomeData (baseUrl: string){

        const toAbsoluteUrl = (imageUrl: string | null | undefined) => {
            const value = (imageUrl ?? "").trim();
            if (!value) return "";
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return value;
            }
            if (value.startsWith("/")) {
                return `${baseUrl}${value}`;
            }
            return `${baseUrl}/${value}`;
        };

         // Banners
        const banners = await prisma.banner.findMany({
            include : {
                product :{
                    select : {
                        id : true,
                        name : true,
                        image_url : true,
                },
            },
        }
        });

         // New Arrivals
        const products = await prisma.product.findMany({
            orderBy : {
                created_at : "desc"
            },
            include : {
                brand : {
                    select : {
                        name : true
                    }
                },
                sizes : {
                    select : {
                        size : true,
                        price : true,
                    },
                    orderBy : {
                        price : "asc"
                    }
                }
            }
        });

        const normalizedBanners = banners.map((banner) => ({
            ...banner,
            image_url: toAbsoluteUrl(banner.image_url),
            product: banner.product
                ? {
                      ...banner.product,
                      image_url: toAbsoluteUrl(banner.product.image_url),
                  }
                : null,
        }));

        const normalizedProducts = products.map((product) => ({
            ...product,
            image_url: toAbsoluteUrl(product.image_url),
        }));
       
        
        return {
            banners: normalizedBanners,
            new_arrivals : normalizedProducts,            
        };
    }
}