import { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
    windowMs: number;
    maxRequests: number;
    message?: string;
};

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

export const createRateLimit = ({ windowMs, maxRequests, message = "Too many requests. Please try again later." }: RateLimitOptions) => {
    const requests = new Map<string, RateLimitEntry>();

    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        const key = `${req.ip}:${req.path}`;
        const existing = requests.get(key);

        if (!existing || existing.resetAt <= now) {
            requests.set(key, {
                count: 1,
                resetAt: now + windowMs,
            });
            next();
            return;
        }

        if (existing.count >= maxRequests) {
            const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
            res.setHeader("Retry-After", retryAfter.toString());
            res.status(429).json({ error: message });
            return;
        }

        existing.count += 1;
        requests.set(key, existing);
        next();
    };
};
