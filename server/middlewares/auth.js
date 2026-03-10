import jwt from 'jsonwebtoken';

const auth = async (request, response, next) => {
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1];

        if (!token) {
            return response.status(401).json({
                message: "Authentication required. Please login.",
                error: true,
                success: false
            });
        }

        // ✅ FIX: jwt.verify is synchronous - no need for await, and it throws on invalid token
        let decode;
        try {
            decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
        } catch (jwtError) {
            // ✅ FIX: Distinguish between expired and invalid token
            if (jwtError.name === 'TokenExpiredError') {
                return response.status(401).json({
                    message: "Session expired. Please login again.",
                    error: true,
                    success: false,
                    code: "TOKEN_EXPIRED"
                });
            }
            return response.status(401).json({
                message: "Invalid token. Please login again.",
                error: true,
                success: false,
                code: "TOKEN_INVALID"
            });
        }

        request.userId = decode.id;
        next();

    } catch (error) {
        return response.status(500).json({
            message: "Authentication error",
            error: true,
            success: false
        });
    }
};

export default auth;