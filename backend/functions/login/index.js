const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

exports.handler = async (event) => {
  console.log("Login event:", JSON.stringify(event, null, 2));

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
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
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Email and password are required" }),
      };
    }

    // Get user from database
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { email: email.toLowerCase() },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid email or password" }),
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      result.Item.password
    );

    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid email or password" }),
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.Item.userId,
        email: result.Item.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Login successful",
        token,
        user: {
          userId: result.Item.userId,
          email: result.Item.email,
        },
      }),
    };
  } catch (error) {
    console.error("Login error:", error);
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
