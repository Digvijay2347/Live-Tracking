const express = require('express');
const path = require('path');
const http = require("http");
const socketio = require("socket.io");
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const jwt = require('jsonwebtoken');
const ensureAuthenticated = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const users = {}; // In-memory store for users


app.use(express.static(path.join(__dirname, "public")));


app.set('view engine', 'ejs');


app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));


app.use(bodyParser.urlencoded({ extended: false }));


app.use(cookieParser());


app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    const publicRoutes = ['/login', '/signup', '/auth/google', '/auth/google/callback'];
    
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (publicRoutes.includes(req.path) || req.isAuthenticated() || req.cookies.jwt) {
        return next();
    }
    
    res.redirect('/login');
});


// ye hai routes
app.get('/login', (req, res) => {
    res.render('login'); 
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.user = username;
        return res.redirect('/'); 
    }
    res.redirect('/login');
});

app.get('/signup', (req, res) => {
    res.render('signup'); 
});

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.redirect('/signup');
    }
    users[username] = password;
    req.session.user = username;
    res.redirect('/'); 
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('jwt'); // Clear JWT cookie on logout
    res.redirect('/login'); 
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const token = jwt.sign({ sub: req.user.id }, 'jwt_secret_key');
        res.cookie('jwt', token);
        res.redirect('/'); // Redirect to index after successful login
    }
);

// Root route, serve index page if authenticated
app.get('/', (req, res) => {
    if (req.isAuthenticated() || req.cookies.jwt) {
        res.render('index'); // Render index page if authenticated
    } else {
        res.redirect('/login'); // Otherwise, redirect to login page
    }
});

io.on("connection", function(socket){
    console.log("connected", socket.id);

    // Corrected event name from "send-loaction" to "send-location"
    socket.on("send-location", function(data){
        io.emit("receive-location", {id: socket.id, ...data});
    });

    // socket handle disconnection
    socket.on("disconnect", function()  {
        io.emit("user-disconnected", socket.id); // Emit the disconnect event
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
