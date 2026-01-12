const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log("Check threshold event:", JSON.stringify(event, null, 2));

  try {
    // Get today's date in Sydney timezone (YYYY-MM-DD format)
    const today = getSydneyDate();

    // Scan all expenses (for production, consider using GSI for better performance)
    // Note: This is acceptable for Free Tier with < 50 users
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.EXPENSES_TABLE,
      })
    );

    // Group expenses by userId and date
    const userDailyTotals = {};

    (result.Items || []).forEach((expense) => {
      if (expense.date === today) {
        if (!userDailyTotals[expense.userId]) {
          userDailyTotals[expense.userId] = 0;
        }
        userDailyTotals[expense.userId] += expense.amount;
      }
    });

    // Check threshold and send alerts
    const threshold = 50;
    const alerts = [];

    for (const [userId, total] of Object.entries(userDailyTotals)) {
      if (total > threshold) {
        const message = `Daily expense threshold exceeded! You've spent $${total.toFixed(
          2
        )} today (threshold: $${threshold}).`;

        try {
          await snsClient.send(
            new PublishCommand({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: "Daily Expense Alert",
              Message: message,
            })
          );

          alerts.push({ userId, total, message });
          console.log(`Alert sent for user ${userId}: ${message}`);
        } catch (error) {
          console.error(`Error sending alert for user ${userId}:`, error);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Threshold check completed",
        date: today,
        usersChecked: Object.keys(userDailyTotals).length,
        alertsSent: alerts.length,
        alerts,
      }),
    };
  } catch (error) {
    console.error("Error checking threshold:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};

function getSydneyDate() {
  // Get current date in Sydney timezone (AEDT/AEST)
  const sydneyTime = new Date().toLocaleString("en-US", {
    timeZone: "Australia/Sydney",
  });

  // Convert to YYYY-MM-DD format
  const date = new Date(sydneyTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
