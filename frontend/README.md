# Frontend - Smart Up PWA

This directory contains all frontend assets for the Smart Up Progressive Web Application.

## Directory Structure

```
frontend/
├── pages/          # HTML page files
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── materials.html
│   ├── dashboard.html
│   └── feedback.html
├── js/             # JavaScript modules
│   ├── auth.js
│   ├── materials.js
│   ├── feedback.js
│   └── dashboard.js
├── css/            # Stylesheets
│   └── styles.css
└── assets/         # Static assets (images, icons, etc.)
```

## File Paths

All paths in HTML files are relative to the `pages/` directory:
- CSS: `../css/styles.css`
- JavaScript: `../js/[filename].js`
- Page links: `[filename].html` (same directory)

## Development

To serve the frontend locally, you can use any static file server:

```bash
# Using Python
cd frontend/pages
python -m http.server 8080

# Using Node.js http-server
npx http-server frontend/pages -p 8080

# Using PHP
cd frontend/pages
php -S localhost:8080
```

## Backend Integration

The frontend communicates with the backend API running on `http://localhost:3001`.

API endpoints are configured in:
- `js/auth.js` - Authentication endpoints
- `js/materials.js` - Materials endpoints
- `js/feedback.js` - Feedback endpoints
- `js/dashboard.js` - Dashboard endpoints

## Future Enhancements

This structure is designed to be scalable. Future improvements could include:
- Build process (Vite, Webpack)
- Component-based architecture (React, Vue)
- State management
- Routing system
- Testing framework
