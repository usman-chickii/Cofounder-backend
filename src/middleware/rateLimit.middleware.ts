import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute, will reset after 1 minute
  max: 100, // Max requests per IP per window
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable deprecated headers
});
