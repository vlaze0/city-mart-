# City Mart Server Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)
- npm (comes with Node.js)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
The `.env` file has been created with default values. Update the following:

#### Required for Basic Functionality:
- `MONGODB_URI`: Your MongoDB connection string (default: `mongodb://localhost:27017/citymart`)
- `JWT_SECRET`: Change to a secure random string

#### Optional Services (can be configured later):

**Razorpay Payment Gateway:**
- `RAZORPAY_KEY_ID`: Get from https://dashboard.razorpay.com/
- `RAZORPAY_KEY_SECRET`: Get from https://dashboard.razorpay.com/
- Note: Payment features will be disabled if not configured

**Brevo Email Service (for OTP):**
- `BREVO_API_KEY`: Get from https://app.brevo.com/
- `BREVO_SENDER`: Your verified sender email
- Note: Email verification will not work if not configured

### 3. Start MongoDB
Make sure MongoDB is running:
```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod
```

### 4. Start the Server

**Option 1: Using the batch file**
```bash
start-city-mart-server.bat
```

**Option 2: Using npm**
```bash
npm start
```

**Option 3: Using Node directly**
```bash
node server.js
```

The server will start on http://localhost:3000

## Common Issues

### Issue: "MongoDB connection error"
- **Solution**: Make sure MongoDB is running and the connection string in `.env` is correct

### Issue: "Razorpay credentials not configured"
- **Solution**: This is a warning, not an error. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` to enable payment features

### Issue: Email sending fails
- **Solution**: Configure `BREVO_API_KEY` and `BREVO_SENDER` in `.env` to enable email features

## Development Mode
The server will run in development mode with:
- Payment gateway disabled (if Razorpay not configured)
- Email service disabled (if Brevo not configured)
- All other features working normally

## Production Setup
For production:
1. Update all placeholder values in `.env`
2. Use a secure `JWT_SECRET`
3. Configure Razorpay for payments
4. Configure email service for OTP verification
5. Use a production MongoDB instance

## Next Steps
1. Open http://localhost:3000 in your browser
2. Configure your payment and email services when ready
3. Create an admin account to manage the platform
