// config/production.js
module.exports = {
  mongoURI: process.env.MONGODB_URI,
  port: process.env.PORT || 8080,
  cloudinary: {
    cloud_name: "du4w3c3ru",
    api_key: "379577128337343",
    api_secret: "QOqbjjisLKj7LorwgvWQ2c7ApQo"
  },
  cors: {
    origin: [
      'https://yourdomain.com',
      'https://yourapp.azurewebsites.net'
    ]
  }
};