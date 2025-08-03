# TinyMCE Rich Text Editor Configuration

## Overview
Newsletterfy uses TinyMCE as the rich text editor for newsletter content creation. The platform is configured with a free TinyMCE API key that works for all users.

## Configuration

### Environment Variables
The TinyMCE API key is configured at the platform level through environment variables:

```bash
NEXT_PUBLIC_TINYMCE_API_KEY=qagffr3pkuv17a8on1afax661irst1hbr4e6tbv888sz91jc
```

### Implementation
TinyMCE is implemented in the following components:
- `src/app/user-dashboard/components/Newsletter.jsx` - Main newsletter editor
- `src/app/user-dashboard/components/NewsletterTemplates.jsx` - Template editor
- `src/app/brand-dashboard/components/SponsoredAds.jsx` - Sponsored ad content editor

### Features Enabled
- Rich text formatting (bold, italic, colors, alignment)
- Lists and indentation
- Image upload and media insertion
- Link management
- Code view and HTML editing
- Templates for common newsletter formats
- Paste from Word/other applications
- Responsive design

### API Key Management
- **Platform Level**: Single API key configured in environment variables
- **User Level**: No individual API keys required - users share the platform key
- **Free Tier**: Uses TinyMCE's free tier which supports the platform's needs
- **No User Prompts**: Users will never see API key prompts or warnings

### Fallback Configuration
If the API key is not configured, the editor falls back to:
```javascript
apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
```

### Security
- API key is public (NEXT_PUBLIC_*) as required by TinyMCE client-side usage
- Free tier key with domain restrictions for security
- No sensitive operations performed through the editor

### Troubleshooting
If users see TinyMCE API key warnings:
1. Ensure `NEXT_PUBLIC_TINYMCE_API_KEY` is set in environment variables
2. Restart the development server after environment changes
3. Check that the API key is valid and not expired
4. Verify the domain is allowed for the API key

### Upgrading
To upgrade to a paid TinyMCE plan:
1. Sign up for TinyMCE Cloud
2. Get a new API key
3. Update the environment variable
4. Configure any additional features in the `init` configuration 