//dependencies
var express = require("express");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var exphbs = require("express-handlebars");
var db = require("./models");
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var password_hash = require("password-hash");

//variables
var PORT = process.env.PORT || 8080;
var app = express();

var getPassport = function(){
    return passport;
}

module.exports = {
    "getPassport" : getPassport
}

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object
passport.use(new Strategy(function(username, password, cb) {
    db.User.findOne({
        where : {
            "username" : username
        }
    }).then(function(user) {
        if (!user) { 
            console.log("user doesn't exist with that username")
            return cb(null, false); 
        }
        if (!password_hash.verify(password,user.password)) { 
            console.log("password was incorrect");
            return cb(null, false);
        }
        return cb(null, user);
    }).catch(function(err){
        console.log(err);
        return cb(null, false);
    });
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.User.findOne({
        where : {
            "id" : id
        }
    }).then(function (user) {
        cb(null, user);
    }).catch(function(err){
        return cb(err); 
    });
});

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));
//use the body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));
//passport stuff
app.use(passport.initialize());
app.use(passport.session());

// Override POST for form submissions (may not be necessary)
app.use(methodOverride("_method"));
//use handlebars as the rendering engine
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
//set handlebars as the view engine
app.set("view engine", "handlebars");

// Import routes and give the server access to them.
var routes = require("./controllers/pokemon_controller.js");
var loginRoutes = require("./controllers/login_controller.js");
//root route is / (all other routes specified by the variable 'routes' will be derived from here)
app.use("/", routes);
app.use("/", loginRoutes);

//sync the db and start listening for client requests
db.sequelize.sync().then(function() {
    app.listen(PORT, function(){
        console.log("Server listening on port " + PORT);
    });
});