import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

const optionalAuth = async (request, response, next) => {
  try {
    const token = request.cookies?.accessToken || request?.headers?.authorization?.split(' ')[1];
    if (!token) return next();

    const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    if (!decode?.id) return next();

    const user = await UserModel.findById(decode.id).select('role status email');
    if (user && user.status === 'Active') {
      request.userId = decode.id;
      request.currentUser = user;
    }
  } catch (error) {
    // Public Go Market endpoints should continue to work without auth.
  }
  return next();
};

export default optionalAuth;
