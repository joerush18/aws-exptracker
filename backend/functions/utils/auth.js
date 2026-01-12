const jwt = require("jsonwebtoken");

// JWT_SECRET should be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Extract and verify JWT token from request
 * @param {Object} event - API Gateway event
 * @returns {Object} - { userId, email } or null if invalid
 */
function verifyToken(event) {
  try {
    const authHeader =
      event.headers?.Authorization || event.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const decoded = jwt.verify(token, JWT_SECRET);

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

module.exports = { verifyToken };
