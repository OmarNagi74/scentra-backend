import {prisma} from "../model/prisma";

export class order_services {
    constructor(){}

    async placeOrderService (userId : string , addressId : string , delivery_method : string , payment_method : string){

        const cart = await prisma.cart.findUnique({
            where : {
                user_id : userId
            },
            include : {
                cart_items : {
                    include : {
                        product : {
                            include : {
                                sizes : true
                            }
                        }
                    }
                }
            }
        });
        
        if(!cart || cart.cart_items.length === 0){
            throw new Error("Cart is empty");
        }

        const address = await prisma.address.findUnique({
            where : {
                id : addressId
            }
        });

        if(!address){
            throw new Error("Address not found");
        }

        const subtotal = cart.cart_items.reduce((sum , it) =>{
            const sizeprice = it.product.sizes.find(s => s.size === it.size)?.price ?? 0 ;
            return sum + it.quantity * Number(sizeprice);
        } , 0 );

        const tax = subtotal * 0.08 ; // 8% tax
        const shipping = delivery_method === "express" ? 70 : 0 ;
        const total = subtotal + tax + shipping ;

        const points_earned = Math.floor(subtotal / 10) ; // 1 point per $10 spent

        return prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data : {
                    user_id : userId ,
                    address_id : addressId ,
                    delivery_method ,
                    payment_method,
                    total_price : total.toFixed(2) ,
                    order_items : {
                        create : cart.cart_items.map(it => {
                            const sizeprice = it.product.sizes.find(s => s.size === it.size)?.price ?? 0 ;
                            return {
                                product_id : it.product_id ,
                                size : it.size ,
                                quantity : it.quantity ,
                                price : sizeprice.toFixed(2)
                            }
                        })
                    }
                },
                include : { 
                    order_items : {
                        include : {
                            product : {
                                select : {
                                    id : true ,
                                    name : true ,
                                    image_url : true,
                                    brand : {
                                        select : {
                                            name : true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    address : true
                }
            });

            // Clear cart
            await tx.cartItem.deleteMany({
                where : {
                    cart_id : cart.id
                }
            });

            // Update user points
            const updatedUser = await tx.user.update({
                where : {
                    id : userId
                },
                data : {
                    points : {
                        increment : points_earned
                    }
                },
                select : {
                    id : true,
                    points : true
                }
            });

            return {
                order,
                points_earned,
                points: updatedUser.points,
            };
        });
    }

    async getOrderHistoryService (userId : string){

        const orders = await prisma.order.findMany({
            where : {
                user_id : userId
            },
            orderBy : {
                created_at : "desc"
            },
            include : {
                order_items : {
                    include : {
                        product : {
                            select : {
                                id : true ,
                                name : true ,
                                image_url : true ,
                                brand : {
                                    select : {
                                        name : true
                                    }
                                }
                            }
                        }
                    }
                },
                address : true
            }
        });

        return orders ;
    }

    async getOrderByIdService(userId : string , orderId : string){

        const order = await prisma.order.findFirst({
            where : {
                id : orderId ,
                user_id : userId
            },
            include : {
                order_items : {
                    include : {
                        product : {
                            select : {
                                id : true ,
                                name : true ,
                                image_url : true ,
                                brand : {
                                    select : {
                                        name : true
                                    }
                                }
                            }
                        }
                    }
                },
                address : true
            }
        });

        return order ;
    }
}