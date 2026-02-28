
import "dotenv/config";
import express from "express";
import Db from "./data/mongo.js";
import cors from "cors";
import authRouter from "./routes/route.js";
import itemsRouter from "./routes/items.js";
import claimsRouter from "./routes/claims.js";
import adminRouter from "./routes/admin.js";
import notificationRouter from "./routes/notifications.js";
import claimsDetail from "./routes/claimDetails.js";
import profileRouter from "./routes/users.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));  // Serve images
Db();

app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/claimDetails",  claimsDetail);
app.use("/api/users",profileRouter)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));