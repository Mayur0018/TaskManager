import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env reliably from the backend directory
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

import connectDB               from "./config/db.js";
import authRoutes              from "./routes/authRoutes.js";
import taskRoutes              from "./routes/taskRoutes.js";
import teamRoutes              from "./routes/teamRoutes.js";
import notificationRoutes      from "./routes/notificationRoutes.js";
import analyticsRoutes         from "./routes/analyticsRoutes.js";
import chatRoutes              from "./routes/chatRoutes.js";
import documentRoutes          from "./routes/documentRoutes.js";
import { setIO }               from "./utils/socketManager.js";
import { startDeadlineCron }   from "./utils/deadlineCron.js";

const app        = express();
const httpServer = createServer(app);

// Trust reverse proxies (Render, Vercel, Railway, Heroku, Nginx)
app.set("trust proxy", 1);

const rawClientUrls = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : [];
const configuredOrigins = rawClientUrls.map((u) => u.trim().replace(/\/$/, "")).filter(Boolean);

const allowedOrigins = [
    ...configuredOrigins,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
];

const isOriginAllowed = (origin) => {
    if (!origin) return true; // allow curl, mobile apps, server-to-server
    const normalized = origin.trim().replace(/\/$/, "");
    if (allowedOrigins.includes(normalized) || allowedOrigins.includes("*")) {
        return true;
    }
    // Allow localhost in development
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return true;
    }
    return false;
};

// ── Socket.IO setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            callback(null, isOriginAllowed(origin));
        },
        methods:     ["GET", "POST"],
        credentials: true
    }
});

setIO(io);

// Authenticate Socket.IO connections with JWT
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return next(new Error("User not found"));
        socket.userId = decoded.id;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
});

io.on("connection", (socket) => {
    // Join personal user room
    socket.join(`user:${socket.userId}`);
    console.log(`Socket connected: user:${socket.userId}`);

    // Join team chat room
    socket.on("join_team", (teamId) => {
        if (teamId) {
            socket.join(`team:${teamId}`);
            console.log(`User ${socket.userId} joined team:${teamId}`);
        }
    });

    // Leave team chat room
    socket.on("leave_team", (teamId) => {
        if (teamId) {
            socket.leave(`team:${teamId}`);
            console.log(`User ${socket.userId} left team:${teamId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: user:${socket.userId}`);
    });
});

// ── Express middleware ───────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true
}));

app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // limit each IP to 20 auth requests per windowMs
    message: { message: "Too many attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/teams",         teamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/documents",     documentRoutes);

// ── Serve Production Frontend (if built) ─────────────────────────────────────
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA catch-all fallback middleware (Express 4 & 5 compatible, avoids path-to-regexp PathError)
    app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
            return res.sendFile(path.join(frontendDist, "index.html"));
        }
        next();
    });
} else {
    app.get("/", (req, res) => {
        res.send("MERN Task Manager API is running");
    });
}

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            startDeadlineCron();
        });

        // Handle port already in use gracefully
        httpServer.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                console.error(`\n❌ Port ${PORT} is already in use!`);
                console.error(`   Run this to free it:`);
                console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
                process.exit(1);
            } else {
                console.error("Server error:", err);
            }
        });

        // Graceful shutdown on nodemon restart (SIGUSR2) & termination
        const cleanExit = () => {
            httpServer.close(() => {
                process.exit(0);
            });
        };
        process.once("SIGUSR2", () => {
            httpServer.close(() => {
                process.kill(process.pid, "SIGUSR2");
            });
        });
        process.on("SIGINT", cleanExit);
        process.on("SIGTERM", cleanExit);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
