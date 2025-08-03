const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const sgMail = require('@sendgrid/mail');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generate newsletter-specific sender email (simplified backend version)
 */
function generateNewsletterSenderEmail(newsletterName) {
    if (!newsletterName) return 'newsletter@mail.newsletterfy.com';
    
    const sanitized = newsletterName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)
        .replace(/-$/, '');
    
    return `${sanitized || 'newsletter'}@mail.newsletterfy.com`;
}

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Newsletterfy backend is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Newsletterfy Backend'
    });
});

// Endpoint to send an email using SendGrid with dynamic sender
app.post('/api/send-email', async (req, res) => {
    const { to, subject, content, html, newsletter, user } = req.body;
    
    if (!to || !subject || (!content && !html)) {
        return res.status(400).json({ 
            error: 'Missing required fields: to, subject, and content/html' 
        });
    }

    // Generate sender email based on newsletter name
    let senderEmail = process.env.EMAIL_FROM || 'noreply@newsletterfy.com';
    let senderName = process.env.EMAIL_FROM_NAME || 'Newsletterfy';

    if (newsletter && newsletter.name) {
        senderEmail = generateNewsletterSenderEmail(newsletter.name);
        senderName = newsletter.name || newsletter.title || 'Newsletter';
    }

    const msg = {
        to,
        from: {
            email: senderEmail,
            name: senderName
        },
        subject,
        text: content,
        html: html || content,
        trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true },
            subscriptionTracking: { enable: true },
        },
        asm: {
            groupId: parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1'),
            groupsToDisplay: [parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1')],
        },
        customArgs: {
            newsletter_name: newsletter?.name || 'Newsletter',
            sender_email: senderEmail
        }
    };

    // Add reply-to if user email is available
    if (user && user.email) {
        msg.replyTo = user.email;
    }

    try {
        await sgMail.send(msg);
        res.status(200).json({ 
            message: 'Email sent successfully',
            to: to,
            subject: subject,
            senderEmail: senderEmail
        });
    } catch (error) {
        console.error('SendGrid error:', error);
        res.status(500).json({ 
            error: 'Failed to send email',
            details: error.message
        });
    }
});

// Endpoint to verify SendGrid connection
app.get('/api/email/verify', async (req, res) => {
    try {
        // Try to get SendGrid account info
        const sgClient = require('@sendgrid/client');
        sgClient.setApiKey(process.env.SENDGRID_API_KEY);
        
        const [response] = await sgClient.request({
            method: 'GET',
            url: '/v3/user/profile'
        });

        res.json({
            success: true,
            message: 'SendGrid connection verified',
            account: {
                username: response.username,
                email: response.email
            }
        });
    } catch (error) {
        console.error('SendGrid verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify SendGrid connection',
            details: error.message
        });
    }
});

// Newsletter endpoint (placeholder)
app.post('/api/newsletter', async (req, res) => {
    const { subject, content, recipients } = req.body;
    
    try {
        // This would typically involve database operations
        // For now, just return success
        res.json({ 
            message: 'Newsletter saved successfully',
            id: Date.now(), // Temporary ID
            subject: subject,
            recipientCount: recipients?.length || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subscriber management endpoint (placeholder)
app.post('/api/subscribers', async (req, res) => {
    const { email, name, preferences } = req.body;
    
    try {
        // This would typically involve database operations
        res.json({ 
            message: 'Subscriber added successfully',
            subscriber: {
                email,
                name,
                preferences,
                id: Date.now(),
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
    console.log(`Newsletterfy backend server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
});
