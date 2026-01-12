// Express server for containerized backend
const express = require('express');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// AWS Configuration
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE || 'users';
const EXPENSES_TABLE = process.env.EXPENSES_TABLE || 'expenses';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Invalid or missing token' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Signup endpoint
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await docClient.send({
      TableName: USERS_TABLE,
      Key: { email }
    });

    if (existingUser.Item) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await docClient.send({
      TableName: USERS_TABLE,
      Item: {
        email,
        userId,
        passwordHash,
        createdAt: new Date().toISOString()
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const result = await docClient.send({
      TableName: USERS_TABLE,
      Key: { email }
    });

    const user = result.Item;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create expense endpoint
app.post('/expenses', verifyToken, async (req, res) => {
  try {
    const { amount, category, date, notes } = req.body;
    const userId = req.user.userId;

    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'Amount, category, and date are required' });
    }

    const expenseId = uuidv4();

    await docClient.send({
      TableName: EXPENSES_TABLE,
      Item: {
        userId,
        expenseId,
        amount: parseFloat(amount),
        category,
        date,
        notes: notes || '',
        createdAt: new Date().toISOString()
      }
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expenseId
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expenses endpoint
app.get('/expenses', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, startDate, endDate } = req.query;

    const params = {
      TableName: EXPENSES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    if (category) {
      params.FilterExpression = '#category = :category';
      params.ExpressionAttributeNames = { '#category': 'category' };
      params.ExpressionAttributeValues[':category'] = category;
    }

    if (startDate) {
      if (!params.FilterExpression) {
        params.FilterExpression = '#date >= :startDate';
        params.ExpressionAttributeNames = { '#date': 'date' };
      } else {
        params.FilterExpression += ' AND #date >= :startDate';
        if (!params.ExpressionAttributeNames) params.ExpressionAttributeNames = {};
        params.ExpressionAttributeNames['#date'] = 'date';
      }
      params.ExpressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      if (!params.FilterExpression) {
        params.FilterExpression = '#date <= :endDate';
        params.ExpressionAttributeNames = { '#date': 'date' };
      } else {
        params.FilterExpression += ' AND #date <= :endDate';
        if (!params.ExpressionAttributeNames) params.ExpressionAttributeNames = {};
        params.ExpressionAttributeNames['#date'] = 'date';
      }
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }

    const result = await docClient.send({
      TableName: EXPENSES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ...(params.FilterExpression && { FilterExpression: params.FilterExpression }),
      ...(params.ExpressionAttributeNames && { ExpressionAttributeNames: params.ExpressionAttributeNames })
    });

    let expenses = result.Items || [];

    // Apply filters in memory if needed
    if (category && !params.FilterExpression) {
      expenses = expenses.filter(e => e.category === category);
    }
    if (startDate && !params.FilterExpression) {
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate && !params.FilterExpression) {
      expenses = expenses.filter(e => e.date <= endDate);
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({
      expenses,
      total,
      categoryTotals,
      count: expenses.length
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense endpoint
app.delete('/expenses/:expenseId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    // Verify ownership
    const result = await docClient.send({
      TableName: EXPENSES_TABLE,
      Key: { userId, expenseId }
    });

    if (!result.Item) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await docClient.send({
      TableName: EXPENSES_TABLE,
      Key: { userId, expenseId }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
