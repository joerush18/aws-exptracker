const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// JWT token verification function
function verifyToken(event) {
  try {
    const authHeader =
      event.headers?.Authorization || event.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return null;
    }

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

exports.handler = async (event) => {
  console.log("Delete expense event:", JSON.stringify(event, null, 2));

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  const httpMethod =
    event.requestContext?.http?.method ||
    event.httpMethod ||
    event.requestContext?.httpMethod;
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Verify JWT token and get user ID
    const user = verifyToken(event);

    if (!user || !user.userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: "Unauthorized - Invalid or missing token",
        }),
      };
    }

    const userId = user.userId;

    // Get expense ID from path parameters
    const expenseId = event.pathParameters?.expenseId;

    if (!expenseId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Expense ID is required" }),
      };
    }

    // Verify the expense belongs to the user
    const getResult = await docClient.send(
      new GetCommand({
        TableName: process.env.EXPENSES_TABLE,
        Key: {
          userId,
          expenseId,
        },
      })
    );

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Expense not found" }),
      };
    }

    // Delete the expense
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.EXPENSES_TABLE,
        Key: {
          userId,
          expenseId,
        },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Expense deleted successfully",
        expenseId,
      }),
    };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
