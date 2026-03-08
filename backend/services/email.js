// Email Service - Handles sending notifications
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const emailTemplates = {
    tutorSignupWelcome: (tutorName) => ({
        subject: 'Welcome to Smart Up - Account Under Review',
        html: `
            <h2>Welcome to Smart Up, ${tutorName}!</h2>
            <p>Thank you for registering as a tutor on our platform.</p>
            <p>Your account is currently under review by our admin team. We will verify your information and notify you of the decision within 24-48 hours.</p>
            <p>Once approved, you'll be able to:</p>
            <ul>
                <li>Upload educational materials</li>
                <li>Manage student access to your content</li>
                <li>Track material downloads and student engagement</li>
                <li>Receive feedback from students</li>
            </ul>
            <p>We'll send you an email as soon as your account is approved or if we need any additional information.</p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    }),

    tutorApproved: (tutorName) => ({
        subject: 'Congratulations! Your Smart Up Account is Approved',
        html: `
            <h2>Account Approved, ${tutorName}!</h2>
            <p>Great news! Your tutor account has been approved and is now active.</p>
            <p>You can now:</p>
            <ul>
                <li><strong>Upload Materials:</strong> Share your educational content with students</li>
                <li><strong>Manage Access:</strong> Approve or reject student access requests</li>
                <li><strong>Track Analytics:</strong> View downloads and engagement metrics</li>
                <li><strong>Student Feedback:</strong> Receive and respond to feedback from learners</li>
            </ul>
            <p><a href="http://localhost:3000/frontend/pages/materials.html" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Start Uploading Materials</a></p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy teaching!<br>Smart Up Team</p>
        `
    }),

    tutorRejected: (tutorName, reason) => ({
        subject: 'Smart Up Tutor Application - Decision Update',
        html: `
            <h2>Regarding Your Smart Up Tutor Application, ${tutorName}</h2>
            <p>Thank you for your interest in becoming a tutor on Smart Up.</p>
            <p>After reviewing your application, we have made the following decision:</p>
            <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
                <strong>Status:</strong> Application Rejected
                <br><br>
                <strong>Reason:</strong> ${reason || 'Your application does not meet our current requirements.'}
            </div>
            <p>If you believe this is a mistake or would like to provide additional information, you can submit an appeal through our platform. We'll review your appeal and get back to you within 48 hours.</p>
            <p><a href="http://localhost:3000/frontend/pages/status.html" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Submit an Appeal</a></p>
            <p>We look forward to working with you in the future.</p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    }),

    tutorAppeal: (tutorName, appealReason) => ({
        subject: 'New Tutor Appeal Submission',
        html: `
            <h2>New Appeal from Tutor: ${tutorName}</h2>
            <p><strong>Tutor:</strong> ${tutorName}</p>
            <p><strong>Appeal Reason:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                ${appealReason}
            </div>
            <p>Please review this appeal and take appropriate action in the admin dashboard.</p>
            <p><a href="http://localhost:3000/frontend/pages/dashboard.html" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a></p>
        `
    }),

    studentApprovalGranted: (studentName, tutorName) => ({
        subject: 'Smart Up - Access Approved!',
        html: `
            <h2>Your Access Has Been Approved!</h2>
            <p>Hi ${studentName},</p>
            <p>Good news! <strong>${tutorName}</strong> has approved your access to their materials.</p>
            <p>You can now:</p>
            <ul>
                <li>Download educational materials</li>
                <li>Access all shared content</li>
                <li>Leave feedback and ratings</li>
            </ul>
            <p><a href="http://localhost:3000/frontend/pages/materials.html" style="background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Materials Now</a></p>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Happy learning!<br>Smart Up Team</p>
        `
    }),

    studentApprovalRejected: (studentName, tutorName) => ({
        subject: 'Smart Up - Access Request',
        html: `
            <h2>Access Request Status</h2>
            <p>Hi ${studentName},</p>
            <p><strong>${tutorName}</strong> has reviewed your access request.</p>
            <p>Unfortunately, your request was not approved at this time. You may reach out to the tutor for more information, or try accessing materials from other tutors.</p>
            <p><a href="http://localhost:3000/frontend/pages/materials.html" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Browse Other Materials</a></p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    })
};

// Send email helper function
async function sendEmail(to, template, ...args) {
    try {
        // Check if email service is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log(`[EMAIL DISABLED] Would send to ${to}:`, template);
            return { success: true, message: 'Email service not configured' };
        }

        const emailContent = emailTemplates[template](...args);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${info.response}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        return { success: false, error: error.message };
    }
}

// Specific email functions
const emailService = {
    // Tutor signup welcome
    sendTutorWelcome: async (tutorEmail, tutorName) => {
        return sendEmail(tutorEmail, 'tutorSignupWelcome', tutorName);
    },

    // Admin approved tutor
    sendTutorApproved: async (tutorEmail, tutorName) => {
        return sendEmail(tutorEmail, 'tutorApproved', tutorName);
    },

    // Admin rejected tutor
    sendTutorRejected: async (tutorEmail, tutorName, reason) => {
        return sendEmail(tutorEmail, 'tutorRejected', tutorName, reason);
    },

    // Tutor submitted appeal
    sendTutorAppealNotification: async (adminEmail, tutorName, appealReason) => {
        return sendEmail(adminEmail, 'tutorAppeal', tutorName, appealReason);
    },

    // Student approved for materials
    sendStudentApprovalGranted: async (studentEmail, studentName, tutorName) => {
        return sendEmail(studentEmail, 'studentApprovalGranted', studentName, tutorName);
    },

    // Student rejected from materials
    sendStudentApprovalRejected: async (studentEmail, studentName, tutorName) => {
        return sendEmail(studentEmail, 'studentApprovalRejected', studentName, tutorName);
    }
};

module.exports = emailService;
