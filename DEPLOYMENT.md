# Deployment Guide for Microfinance Backend

## Free Hosting Options:

### 1. Render.com (Recommended)
1. Push code to GitHub
2. Connect GitHub to Render
3. Deploy automatically

### 2. Railway.app
1. Push code to GitHub  
2. Connect GitHub to Railway
3. Deploy automatically

### 3. Heroku (with buildpack)
1. Push code to GitHub
2. Connect GitHub to Heroku
3. Deploy automatically

## Environment Variables to Set:
- DB_URL: Your MongoDB Atlas connection string
- PORT: Automatically set by hosting platform
- NODE_ENV: production
