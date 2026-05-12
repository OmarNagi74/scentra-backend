import nodemailer from "nodemailer";
import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

const db = admin.firestore();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const getFirebaseAdmin = () => admin;

export async function sendOTPEmail(email: string, otp: string | number) {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Your OTP Code - Scentra",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
          <p style="color: #666;">Valid for 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">Do not share this code with anyone.</p>
        </div>
      `,
        });

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.collection("otps").doc(email).set({
            code: otp.toString(),
            email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
            verified: false,
        });

        console.log(`[OTP] Email sent to ${email} and OTP stored in Firestore`);
        return true;
    } catch (error: any) {
        console.error("[OTP] Error:", error.message);
        return false;
    }
}

export async function verifyOTP(email: string, otp: string | number) {
    try {
        const otpDoc = await db.collection("otps").doc(email).get();

        if (!otpDoc.exists) {
            console.log(`[OTP VERIFY] No OTP found for ${email}`);
            return false;
        }

        const otpData = otpDoc.data();
        if (!otpData) {
            return false;
        }

        const expiresAt = otpData.expiresAt?.toDate ? otpData.expiresAt.toDate() : new Date(otpData.expiresAt);
        if (expiresAt < new Date()) {
            console.log(`[OTP VERIFY] OTP expired for ${email}`);
            return false;
        }

        if (otpData.code !== otp.toString()) {
            console.log(`[OTP VERIFY] Invalid OTP for ${email}`);
            return false;
        }

        await db.collection("otps").doc(email).update({
            verified: true,
        });

        console.log(`[OTP VERIFY] OTP verified for ${email}`);
        return true;
    } catch (error: any) {
        console.error("[OTP VERIFY] Error:", error.message);
        return false;
    }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Reset Your Password - Scentra",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p style="color: #666;">This link expires in 1 hour.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
        });
        console.log(`[PASSWORD RESET] Email sent to ${email}`);
        return true;
    } catch (error: any) {
        console.error("[PASSWORD RESET] Error:", error.message);
        return false;
    }
}

export async function sendOrderConfirmationEmail(
    email: string,
    orderDetails: {
        orderId: string | number;
        total: string | number;
        status: string;
    },
) {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Order Confirmation - Scentra",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order!</h2>
          <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
          <p><strong>Total:</strong> $${orderDetails.total}</p>
          <p><strong>Status:</strong> ${orderDetails.status}</p>
          <p style="color: #666;">We'll notify you when your order ships.</p>
        </div>
      `,
        });
        console.log(`[ORDER] Email sent to ${email}`);
        return true;
    } catch (error: any) {
        console.error("[ORDER] Error:", error.message);
        return false;
    }
}

export async function sendNotificationEmail(email: string, message: string) {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Notification - Scentra",
            html: `<div style="font-family: Arial, sans-serif;"><p>${message}</p></div>`,
        });
        console.log(`[NOTIFICATION] Email sent to ${email}`);
        return true;
    } catch (error: any) {
        console.error("[NOTIFICATION] Error:", error.message);
        return false;
    }
}

export async function sendMarketingEmail(
    email: string,
    campaignContent: {
        subject: string;
        html: string;
    },
) {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: campaignContent.subject,
            html: campaignContent.html,
        });
        console.log(`[MARKETING] Email sent to ${email}`);
        return true;
    } catch (error: any) {
        console.error("[MARKETING] Error:", error.message);
        return false;
    }
}
