const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const Admin = require('../models/adminModel');

exports.authProtected = async (req, res, next) => {
    try {
        let token;

        // CHECK TOKEN AND GET TOKEN
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(" ")[1];
        } else if(req.cookie.jwt) {
            token = req.cookie.jwt;
        }

        if(!token) {
            return res.status(401).json({
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // VERIFY THE TOKEN
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_TOKEN);
        req.user = {
            _id: decoded.id,
        }

        console.log(req.user)

        // CHECK IF THE USER EXIST
        const currentUser = await User.findById(decoded.id);
        // if(req.user.role)
        if (!currentUser) {
            return res.status(401).json({
                message: "The user belonging to this token does no longer exist.",
            });
        }

        // CHECK IF THE USER CHANGED AFTER TOKEN WAS ISSUED
        // if (currentUser.changedPasswordAfter(decoded.iat)) {
        //     return res.status(401).json({
        //         message: "User recently changed password! Please log in again."
        //     });
        // }

        // AT THIS POINT GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        res.locals.user = currentUser;

        return next();
    } catch(err) {
        return res.status(401).json({
            status: 'fail',
            message: err.message || 'You are unauthorised',
        })
    }
}



exports.authProtectedAdmin = async (req, res, next) => {
    try {
        let token;

        // CHECK TOKEN AND GET TOKEN
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(" ")[1];
        } else if(req.cookie.jwt) {
            token = req.cookie.jwt;
        }

        if(!token) {
            return res.status(401).json({
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // VERIFY THE TOKEN
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_TOKEN);
        req.user = {
            _id: decoded.id,
        }

        console.log(req.user)

        // CHECK IF THE USER EXIST
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({
                message: "The Admin belonging to this token does no longer exist.",
            });
        }

        // AT THIS POINT GRANT ACCESS TO PROTECTED ROUTE
        req.user = admin;
        res.locals.user = admin;

        return next();
    } catch(err) {
        return res.status(401).json({
            status: 'fail',
            message: err.message || 'You are unauthorised',
        })
    }
}


exports.isRestricted = function(req, res, next) {
    if (!req.user || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied." });
    }
    return next();
};
