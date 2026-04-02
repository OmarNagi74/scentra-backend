import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan' ;
import path from 'path';
import authRouter from './routes/auth.route';
import "dotenv/config";
import homeRouter from './routes/home.route';
import discoverRouter from './routes/discover.route';
import productRouter from './routes/product.route';
import cartRouter from './routes/cart.route';
import addressRouter from './routes/address.route';
import paymentRouter from './routes/payment.route';
import orderRouter from './routes/order.route';
import wishlistRouter from './routes/wishlist.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended :true})) ;
app.use(morgan("dev"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// apis

app.use('/api/auth' , authRouter);
app.use('/api/home' , homeRouter);
app.use('/api/discover' , discoverRouter) ;
app.use('/api/products' , productRouter) ;
app.use('/api/cart' , cartRouter) ;
app.use('/api/address' , addressRouter) ;
app.use('/api/payment' , paymentRouter) ;
app.use('/api/orders' , orderRouter) ;
app.use('/api/wishlist' , wishlistRouter) ;

app.listen(PORT, ()=>{
      console.log(`server running at => http://localhost:${PORT} ;`);
});


export default app;