// Email Service - Handles sending notifications (ESM version for Vercel API functions)
import nodemailer from 'nodemailer';

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
            <p>Your account is currently under review by our admin team. We will notify you of the decision within 24-48 hours.</p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    }),

    tutorApproved: (tutorName) => ({
        subject: 'Congratulations! Your Smart Up Account is Approved',
        html: `
            <h2>Account Approved, ${tutorName}!</h2>
            <p>Your tutor account has been approved and is now active.</p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    }),

    tutorRejected: (tutorName, reason) => ({
        subject: 'Smart Up Tutor Application - Decision Update',
        html: `
            <h2>Regarding Your Smart Up Tutor Application, ${tutorName}</h2>
            <p>After reviewing your application, we have decided not to approve it at this time.</p>
            <p><strong>Reason:</strong> ${reason || 'Your application does not meet our current requirements.'}</p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    }),

    tutorAppeal: (tutorName, appealReason) => ({
        subject: 'New Tutor Appeal Submission',
        html: `
            <h2>New Appeal from Tutor: ${tutorName}</h2>
            <p><strong>Appeal Reason:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${appealReason}</div>
            <p>Please review this appeal and take appropriate action in the admin dashboard.</p>
        `
    }),

    studentApprovalGranted: (studentName, tutorName) => ({
        subject: 'Smart Up - Access Approved!',
        html: `
            <h2>Your Access Has Been Approved!</h2>
            <p>Hi ${studentName},</p>
            <p><strong>${tutorName}</strong> has approved your access to their materials.</p>
            <p>Happy learning!<br>Smart Up Team</p>
        `
    }),

    studentApprovalRejected: (studentName, tutorName) => ({
        subject: 'Smart Up - Access Request',
        html: `
            <h2>Access Request Status</h2>
            <p>Hi ${studentName},</p>
            <p><strong>${tutorName}</strong> was unable to approve your access request at this time.</p>
            <p>Best regards,<br>Smart Up Team</p>
        `
    })
};

async function sendEmail(to, template, ...args) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log(`[EMAIL DISABLED] Would send to ${to}:`, template);
            return { success: true, message: 'Email service not configured' };
        }

        const emailContent = emailTemplates[template](...args);
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
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

const emailService = {
    sendTutorWelcome: (tutorEmail, tutorName) => sendEmail(tutorEmail, 'tutorSignupWelcome', tutorName),
    sendTutorApproved: (tutorEmail, tutorName) => sendEmail(tutorEmail, 'tutorApproved', tutorName),
    sendTutorRejected: (tutorEmail, tutorName, reason) => sendEmail(tutorEmail, 'tutorRejected', tutorName, reason),
    sendTutorAppealNotification: (adminEmail, tutorName, appealReason) => sendEmail(adminEmail, 'tutorAppeal', tutorName, appealReason),
    sendStudentApprovalGranted: (studentEmail, studentName, tutorName) => sendEmail(studentEmail, 'studentApprovalGranted', studentName, tutorName),
    sendStudentApprovalRejected: (studentEmail, studentName, tutorName) => sendEmail(studentEmail, 'studentApprovalRejected', studentName, tutorName)
};

export default emailService;
