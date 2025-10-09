const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
            // Create transporter using environment variables
            this.transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER || 'sudarakakm2024@gmail.com',
                    pass: process.env.EMAIL_PASSWORD || 'LoanMeta@2025' // This should be an App Password for Gmail
                },
                // Additional Gmail-specific settings
                secure: true, // Use TLS
                port: 465
            });
        }
    

    /**
     * Send invitation email to new user
     * @param {Object} userDetails - User details
     * @param {string} userDetails.name - User's name
     * @param {string} userDetails.email - User's email
     * @param {string} userDetails.role - User's role
     * @returns {Promise<Object>} Email send result
     */
    async sendInvitationEmail(userDetails) {
        const { name, email, role } = userDetails;
        
        // Get current date
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // App download links (you can customize these)
        const downloadLinks = {
            android: process.env.ANDROID_APP_LINK || 'https://play.google.com/store/apps/details?id=com.yourcompany.microfinance',
          
        };

        const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LoanMeta Service</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px 0;
        }
        .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .download-section {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .download-section h3 {
            color: #1e3a8a;
            margin-top: 0;
        }
        .download-links {
            display: flex;
            gap: 10px;
            margin-left: -10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .download-button {
            display: inline-block;
            padding: 12px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background 0.3s;
        }
        .download-button:hover {
            background: #5a6fd8;
        }
        .steps {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .steps h3 {
            color: #b7750e;
            margin-top: 0;
        }
        .steps ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .steps li {
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 14px;
            color: #6c757d;
        }
        .highlight {
            background: #ffffcc;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏦 Welcome to LoanMeta Service</h1>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                Dear <strong>${name}</strong>,
            </div>
            
            <p>Welcome to our Microfinance Management System! Your account has been created successfully and you're invited to join our platform.</p>
            
            <div class="info-box">
                <h3>📋 Your Account Details</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
                <p><strong>Account Created:</strong> ${currentDate}</p>
                <p><strong>Account expires:</strong> ${process.env.INVITATION_EMAIL_EXPIRY_DAYS || 7} days from creation</p>
            </div>

            <div class="download-section">
                <h3>📱 Download Our App</h3>
                <p>Get started by downloading our mobile application or access the web version:</p>
                <div class="download-links">
                    <a href="${downloadLinks.android}" class="download-button">📱 Android App</a>
                  
                </div>
            </div>

            <div class="steps">
                <h3>🚀 Next Steps</h3>
                <ol>
                    <li>Download the app using one of the links above</li>
                    <li>Open the app and select <span class="highlight">"Complete Signup"</span></li>
                    <li>Enter your email address: <span class="highlight">${email}</span></li>
                    <li>Create a secure password</li>
                    <li>Complete your profile setup</li>
                    <li>Start using the platform!</li>
                </ol>
            </div>

            <div class="info-box">
                <h3>⚠️ Important Information</h3>
                <ul>
                    <li>Your account is currently <strong>pending completion</strong></li>
                    <li>You must complete the signup process within <strong>${process.env.INVITATION_EMAIL_EXPIRY_DAYS || 7} days</strong></li>
                    <li>If you encounter any issues, contact your administrator</li>
                    <li>Keep your login credentials secure and do not share them</li>
                </ul>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>${process.env.COMPANY_NAME}</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LoanMeta'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: {
                name: process.env.APP_NAME || 'LoanMeta Application',
                address: process.env.EMAIL_USER || 'sudarakakm2024@gmail.com'
            },
            to: email,
            subject: `🎉 Welcome to ${process.env.APP_NAME || 'LoanMeta Application'} - Account Created for ${name}`,
            html: emailTemplate,
            text: `
Welcome to ${process.env.APP_NAME || 'LoanMeta Service'}!

Dear ${name},

Your account has been created successfully with the following details:
- Name: ${name}
- Email: ${email}
- Role: ${role}
- Date Created: ${currentDate}
- Account expires: ${process.env.INVITATION_EMAIL_EXPIRY_DAYS || 7} days from creation

Next Steps:
1. Download our app:
   - Android: ${downloadLinks.android}
   - iOS: ${downloadLinks.ios}
   - Web: ${downloadLinks.web}

2. Complete your signup by entering your email: ${email}
3. Create a secure password
4. Start using the platform!

Important: You must complete the signup process within ${process.env.INVITATION_EMAIL_EXPIRY_DAYS || 7} days.

Best regards,
${process.env.COMPANY_NAME || 'Microfinance App Team'}
            `
        };

        try {
            if (this.testMode) {
                // Test mode: just log the email content
                console.log('\n📧 TEST MODE - Email would be sent with following details:');
                console.log('📬 To:', email);
                console.log('📝 Subject:', mailOptions.subject);
                console.log('👤 User:', name);
                console.log('🎭 Role:', role);
                console.log('📅 Date:', currentDate);
                console.log('🔗 Download Links:');
                console.log('   📱 Download Application:', downloadLinks.android);
                console.log('\n✅ Email simulation completed successfully');
                
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    message: 'Email simulated successfully (test mode)',
                    testMode: true
                };
            } else {
                // Real mode: send actual email
                const result = await this.transporter.sendMail(mailOptions);
                console.log('Invitation email sent successfully:', result.messageId);
                return {
                    success: true,
                    messageId: result.messageId,
                    message: 'Invitation email sent successfully',
                    testMode: false
                };
            }
        } catch (error) {
            console.error('Error sending invitation email:', error);
            throw new Error(`Failed to send invitation email: ${error.message}`);
        }
    }

    /**
     * Verify email configuration
     * @returns {Promise<boolean>} True if configuration is valid
     */
    async verifyConnection() {
        try {
            if (this.testMode) {
                console.log('📧 Email service is in TEST MODE - ready to simulate emails');
                return true;
            } else {
                await this.transporter.verify();
                console.log('Email service is ready to send emails');
                return true;
            }
        } catch (error) {
            console.error('Email service configuration error:', error);
            return false;
        }
    }
}

module.exports = EmailService;