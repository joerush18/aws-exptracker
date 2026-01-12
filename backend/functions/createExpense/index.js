const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const jwt = require("jsonwebtoken");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

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
  console.log("Create expense event:", JSON.stringify(event, null, 2));

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
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

    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { amount, category, date, notes } = body;

    // Validation
    if (!amount || !category || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields: amount, category, date",
        }),
      };
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Amount must be a positive number" }),
      };
    }

    // Generate expense ID
    const expenseId = `exp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create expense item
    const expense = {
      userId,
      expenseId,
      amount: parseFloat(amount),
      category: category.trim(),
      date: date,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: process.env.EXPENSES_TABLE,
        Item: expense,
      })
    );

    // Check daily threshold and send alert if needed
    await checkDailyThreshold(userId, date, parseFloat(amount));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Expense created successfully",
        expense,
      }),
    };
  } catch (error) {
    console.error("Error creating expense:", error);
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

async function checkDailyThreshold(userId, date, newAmount) {
  try {
    // Get all expenses for the user on this date
    const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

    // Use existing docClient from outer scope

    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.EXPENSES_TABLE,
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "#date = :date",
        ExpressionAttributeNames: {
          "#date": "date",
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":date": date,
        },
      })
    );

    const dailyTotal = result.Items.reduce((sum, item) => sum + item.amount, 0);
    const threshold = 50;

    if (dailyTotal > threshold) {
      const message = `Daily expense threshold exceeded! You've spent $${dailyTotal.toFixed(
        2
      )} today (threshold: $${threshold}).`;

      await snsClient.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: "Daily Expense Alert",
          Message: message,
        })
      );

      console.log(`Alert sent for user ${userId}: ${message}`);
    }
  } catch (error) {
    console.error("Error checking threshold:", error);
    // Don't fail the request if threshold check fails
  }
}
