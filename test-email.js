const axios = require('axios');
require('dotenv').config();

async function testEmail() {
  try {
    const res = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.BREVO_SENDER,
          name: 'CityMart'
        },
        to: [{ email: 'test@example.com' }],
        subject: 'CityMart Verification Code',
        htmlContent: `
          <h2>CityMart OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1>123456</h1>
          <p>This OTP is valid for 5 minutes.</p>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
testEmail();
