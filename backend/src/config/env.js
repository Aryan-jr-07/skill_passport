require('dotenv').config();

const config = {
    port: parseInt(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    jwt: {
        secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },

    scoring: {
        weightTest: parseFloat(process.env.WEIGHT_TEST) || 0.35,
        weightProject: parseFloat(process.env.WEIGHT_PROJECT) || 0.35,
        weightReviewer: parseFloat(process.env.WEIGHT_REVIEWER) || 0.30,
        verificationThreshold: parseFloat(process.env.VERIFICATION_THRESHOLD) || 70,
    },
};

module.exports = config;
