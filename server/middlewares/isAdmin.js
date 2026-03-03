import UserModel from "../models/user.model.js";

const isAdmin = async (request, response, next) => {
  try {
    const user = await UserModel.findById(request.userId).select("role");

    if (!user) {
      return response.status(401).json({ success: false, message: "User not found" });
    }

    if (user.role !== "ADMIN") {
      return response.status(403).json({ success: false, message: "Only admin can access this resource" });
    }

    next();
  } catch (error) {
    return response.status(500).json({ success: false, message: error.message });
  }
};

export default isAdmin;