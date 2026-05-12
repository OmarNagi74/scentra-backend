import { Router } from "express";
import { changePassword, getMe, getMyStats, Login, logout, register, removeAvatarImage, resendVerification, signup, updateProfile, uploadAvatarImage, verifyEmail, verifyOtpAndCreateUser } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createRateLimit } from "../middlewares/rateLimit";
import { uploadAvatar } from "../middlewares/uploadMiddleware";

const authRouter = Router() ;
const signupRateLimit = createRateLimit({
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    message: "Too many signup attempts. Please try again later.",
});
const verifyOtpRateLimit = createRateLimit({
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
    message: "Too many OTP verification attempts. Please try again later.",
});

authRouter.post('/register' , register);
authRouter.post('/signup', signupRateLimit, signup);
authRouter.post('/login' , Login) ;
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/verify-otp', verifyOtpRateLimit, verifyOtpAndCreateUser);
authRouter.post('/resend-verification', resendVerification);
authRouter.post('/logout', authMiddleware(), logout);
authRouter.get('/me' , authMiddleware() ,getMe) ;
authRouter.get('/me/stats' , authMiddleware() ,getMyStats) ;
authRouter.patch('/update' , authMiddleware() , updateProfile);
authRouter.patch('/avatar' , authMiddleware() , uploadAvatar.single('avatar') , uploadAvatarImage);
authRouter.delete('/avatar' , authMiddleware() , removeAvatarImage);
authRouter.patch('/me/password' , authMiddleware() , changePassword);
authRouter.patch('/me/passward' , authMiddleware() , changePassword);

export default authRouter ;
