import jwt from "jsonwebtoken";

const Protect = (roles = []) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SEC);
      req.user = decoded;  
      if (roles.length > 0) {
        // Fetch user to check role
        User.findById(decoded.id).then(user => {
          if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: "Access denied" });
          }
          req.user.role = user.role;
          next();
        }).catch(err => res.status(500).json({ error: err }));
      } else {
        next();
      }
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

export default Protect;