const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
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
  console.log("Get expenses event:", JSON.stringify(event, null, 2));

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
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

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const category = queryParams.category;
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    // Build DynamoDB query parameters
    let dynamoQueryParams = {
      TableName: process.env.EXPENSES_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    // Build filter expressions
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = { ...dynamoQueryParams.ExpressionAttributeValues };

    // Add category filter if provided
    if (category) {
      filterExpressions.push("#category = :category");
      expressionAttributeNames["#category"] = "category";
      expressionAttributeValues[":category"] = category;
    }

    // Add date range filters if provided
    if (startDate) {
      filterExpressions.push("#date >= :startDate");
      expressionAttributeNames["#date"] = "date";
      expressionAttributeValues[":startDate"] = startDate;
    }

    if (endDate) {
      filterExpressions.push("#date <= :endDate");
      expressionAttributeNames["#date"] = "date";
      expressionAttributeValues[":endDate"] = endDate;
    }

    // Apply filters if any
    if (filterExpressions.length > 0) {
      dynamoQueryParams.FilterExpression = filterExpressions.join(" AND ");
      dynamoQueryParams.ExpressionAttributeNames = expressionAttributeNames;
      dynamoQueryParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    // Query DynamoDB
    const result = await docClient.send(new QueryCommand(dynamoQueryParams));

    // Sort by date (newest first)
    const expenses = (result.Items || []).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    // Calculate totals
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        expenses,
        total,
        categoryTotals,
        count: expenses.length,
      }),
    };
  } catch (error) {
    console.error("Error getting expenses:", error);
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
