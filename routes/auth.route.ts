import { Router } from "express";
import { changePassword, getMe, Login, logout, register, resendVerification, updateProfile, verifyEmail } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const authRouter = Router() ;

authRouter.post('/register' , register);
authRouter.post('/login' , Login) ;
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/resend-verification', resendVerification);
authRouter.post('/logout', authMiddleware(), logout);
authRouter.get('/me' , authMiddleware() ,getMe) ;
authRouter.patch('/update' , authMiddleware() , updateProfile);
authRouter.patch('/me/passward' , authMiddleware() , changePassword);

export default authRouter ;