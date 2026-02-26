import jwt from "jsonwebtoken";
import User from "../models/user.js"; 

const Protect = (roles = []) => {
  return async (req, res, next) => {  
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SEC);
      req.user = decoded;  

      if (roles.length > 0) {
        if (!decoded.role || !roles.includes(decoded.role)) {
          return res.status(403).json({ message: "Access denied - insufficient role" });
        }
      }


      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

export default Protect;