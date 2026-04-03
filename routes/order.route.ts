import { Router } from "express";
import { getOrderById, getOrderHistory, placeOrder } from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const orderRouter = Router() ;

orderRouter.post('/' ,  authMiddleware() ,placeOrder);
orderRouter.get('/' , authMiddleware() ,getOrderHistory);
orderRouter.get('/:id' , authMiddleware() ,getOrderById);

export default orderRouter ;