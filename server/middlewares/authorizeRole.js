import UserModel from "../models/user.model.js";

const authorizeRole = (...allowedRoles) => {
  return async (request, response, next) => {
    try {
      const userId = request.userId;

      if (!userId) {
        return response.status(401).json({
          message: "Unauthorized",
          error: true,
          success: false,
        });
      }

      const user = await UserModel.findById(userId).select("role status");

      if (!user) {
        return response.status(401).json({
          message: "User not found",
          error: true,
          success: false,
        });
      }

      if (user.status !== "Active") {
        return response.status(403).json({
          message: "Account is not active",
          error: true,
          success: false,
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return response.status(403).json({
          message: "Forbidden",
          error: true,
          success: false,
        });
      }

      request.currentUser = user;
      return next();
    } catch (error) {
      return response.status(500).json({
        message: error.message || error,
        error: true,
        success: false,
      });
    }
  };
};

export default authorizeRole;