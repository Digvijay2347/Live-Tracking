const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

// In-memory store for users
const users = {};

passport.use(new GoogleStrategy({
    clientID: '361962871344-8oju8fegs9l4fi85jc09au2k3pke7qca.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    users[profile.id] = profile;
    done(null, profile);
}));

const opts = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'jwt_secret_key'
};

passport.use(new JWTStrategy(opts, (jwtPayload, done) => {
    if (users[jwtPayload.sub]) {
        return done(null, users[jwtPayload.sub]);
    } else {
        return done(null, false);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    done(null, users[id]);
});

module.exports = passport;
