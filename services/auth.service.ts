import { prisma } from "../model/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "crypto";

export class auth_services {
    constructor(){}

    private readonly verificationTtlMs = 10 * 60 * 1000;
    private readonly resendCooldownMs = 60 * 1000;

    private buildVerificationCode() {
        return randomInt(100000, 1000000).toString();
    }

    private async issueVerificationCode(userId: string, email: string) {
        const verificationCode = this.buildVerificationCode();
        const email_verification_code_hash = await bcrypt.hash(verificationCode, 10);
        const now = new Date();
        const email_verification_code_expires_at = new Date(now.getTime() + this.verificationTtlMs);

        await prisma.user.update({
            where: { id: userId },
            data: {
                email_verification_code_hash,
                email_verification_code_expires_at,
                email_verification_sent_at: now,
            },
        });

        if (process.env.NODE_ENV !== "production") {
            console.info(`[DEV-EMAIL] verification code for ${email}: ${verificationCode}`);
        }
    }

    async registerService (full_name : string , email : string , password : string){
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where : {
                email : normalizedEmail
            }
        });

        if(existingUser){
            throw new Error("User already exists");
        }

        const password_hash : string = await bcrypt.hash(password , 10) ;

        const user = await prisma.user.create({
            data: {
                full_name,
                email: normalizedEmail,
                password_hash,
                is_email_verified: false,
            }
        });

        await prisma.cart.create({
            data : {
                user_id : user.id
            }
        });

        await prisma.wishlist.create({
            data : {
                user_id : user.id
            }
        });

        await this.issueVerificationCode(user.id, user.email);

        return {            
                email : user.email,
            verification_required: true,
        };
    }

    async loginService (email : string , password : string){
        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where : {
                email : normalizedEmail
            }
        });

        if (!user){
            throw new Error("Invalid email");
        }

        const ispasswordValid = await bcrypt.compare(password , user.password_hash);

        if(!ispasswordValid){
            throw new Error("Invalid password");
        }

        if (!user.is_email_verified) {
            throw new Error("EMAIL_NOT_VERIFIED");
        }

        const token = jwt.sign(
            {
                userId : user.id,
                email: user.email,
                role : user.role
            },
            process.env.JWT_SECRET!,
            {
                expiresIn : "7d"
            }
        );

        return {
            token,
            user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            is_email_verified: user.is_email_verified,
            }
        }
    }

    async verifyEmailService(email: string, code: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = code.trim();

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            throw new Error("Invalid verification request");
        }

        if (user.is_email_verified) {
            return { message: "Email is already verified" };
        }

        if (
            !user.email_verification_code_hash ||
            !user.email_verification_code_expires_at ||
            user.email_verification_code_expires_at.getTime() < Date.now()
        ) {
            throw new Error("Verification code expired. Please request a new one.");
        }

        const isCodeValid = await bcrypt.compare(normalizedCode, user.email_verification_code_hash);
        if (!isCodeValid) {
            throw new Error("Invalid verification code");
        }

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                is_email_verified: true,
                email_verification_code_hash: null,
                email_verification_code_expires_at: null,
                email_verification_sent_at: null,
            },
        });

        return { message: "Email verified successfully" };
    }

    async resendVerificationService(email: string) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            throw new Error("Invalid verification request");
        }

        if (user.is_email_verified) {
            return { message: "Email is already verified" };
        }

        const now = Date.now();
        if (
            user.email_verification_sent_at &&
            now - user.email_verification_sent_at.getTime() < this.resendCooldownMs
        ) {
            const remainingMs = this.resendCooldownMs - (now - user.email_verification_sent_at.getTime());
            const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
            throw new Error(
                `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"} before requesting a new code.`,
            );
        }

        await this.issueVerificationCode(user.id, user.email);
        return { message: "Verification code sent" };
    }

    async getMeService (userId : string){

        const user = await prisma.user.findUnique({
            where : {
                id : userId
            }, 
            select : {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                role: true,
                points: true,                
                created_at: true,
                _count: {
                    select: {
                    orders: true,
                    reviews: true,
                    },
                },
            }
        });

        if(!user)
            throw new Error("User not found");

        return user ;
    }

    async updateProfileService (userId : string , data : {
        full_name?:string,
        phone?:string
    }){
        const user = await prisma.user.update({
            where : {
                id : userId
            },
            data,
            select :{
                id: true,
                full_name: true,
                email: true,
                phone: true,
            }
        });

        return user ;
    }

    async changePasswordService (userId : string , oldpass : string , newpass : string){

        const user = await prisma.user.findUnique({
            where : {
                id : userId
            }
        });

        if(!user) throw new Error ("User not found");

        const isMatch = await bcrypt.compare(oldpass , user.password_hash);

        if(!isMatch) throw new Error("Old password is incorrect");

        const password_hash = await bcrypt.hash(newpass , 10) ;

        await prisma.user.update({
            where : {
                id : userId
            },
            data : {
                password_hash
            }
        });
    }
}