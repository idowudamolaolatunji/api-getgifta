const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const Admin = require('../models/adminModel');

const sendEmail = require('../utils/sendEmail');
const otpEmail = require('../utils/emailTemplates/otpEmail');
const Notification = require("../models/NotificationModel");

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

// GENERATE OTP
const generateOtp = () => {
	return Math.floor(1000 + Math.random() * 9000);
};


function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// USER SIGNUP
exports.userSignup = async (req, res) => {
	try {
		const emailExist = await User.findOne({ email: req.body.email });
		const usernameExist = await User.findOne({ username: req.body.username });
		const AcctExistAndUnverified = await User.findOne({ email: req.body.email, username: req.body.username, fullName: req.body.fullName, isOTPVerified: false })
		if(AcctExistAndUnverified) return res.json({ message: "Email Already Exists and Unverified!" });
		if (emailExist) return res.json({ message: "Email already exist!" });
		if (usernameExist) return res.json({ message: "Username already exist!" });

		const newOtp = generateOtp();
		const emailOtp = otpEmail(newOtp);
		const newUser = await User.create({
			fullName: req.body.fullName,
			email: req.body.email,
			username: req.body.username,
			password: req.body.password,
			passwordConfirm: req.body.passwordConfirm,
			role: "user",
			isActive: true,
			otpCode: newOtp,
			pushToken: req.body.pushToken,
			myInviterCode: req.params.referralCode ? req.params.referralCode : null,
		});

		await Wallet.create({
			user: newUser._id,
			walletBalance: 0,
			pointBalance: 250,
		});
		
		res.status(201).json({
			status: "success",
			message: "Signup Successful!",
		});

		await sendEmail({
            email: newUser.email,
            subject: "Gifta Verification Code",
            message: emailOtp
        });
		
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


// USER VENDOR
exports.vendorCreation = async (req, res) => {
	try {
		const alreadyExist = await User.findOne({ email: req.body.email });
		if (alreadyExist)
		return res.json({
			message: "Email already used, User Exists",
		});

		const newUser = await User.create({
			email: req.body.email,
			username: req.body.username,
			fullName: req.body.fullName,
			password: req.body.password,
			passwordConfirm: req.body.passwordConfirm,
			role: "vendor",
			isActive: true,
			otpCode: generateOtp(),
			isOTPVerified: true,
		});

		const wallet = await Wallet.create({
			user: newUser._id,
			pointBalance: 250
		});
		
		res.status(201).json({
			status: "success",
			message: "Vendor Creation Successful!",
			data: {
				vendor: newUser,
				wallet,
			},
		});
		
		
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// USER SUB ADMIN
exports.adminCreation = async (req, res) => {
	try {
		const alreadyExistAdmin = await Admin.findOne({ email: req.body.email });
		const alreadyExistUser = await User.findOne({ email: req.body.email });
		if (alreadyExistAdmin || alreadyExistUser) {
			return res.json({
				message: "Email already used, Admin Exists",
			});
		}

		const newAdmin = await Admin.create({
			email: req.body.email,
			fullName: req.body.fullName,
			password: req.body.password,
			passwordConfirm: req.body.passwordConfirm,
			role: req.body.role,
		});

		res.status(201).json({
			status: "success",
			message: "Admin Creation Successful!",
			data: {
				admin: newAdmin
			}
		});
		
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


// REQUEST OTP
exports.requestOtp = async (req, res) => {
	try {
		const requestingUser = await User.findOne({ email: req.body.email });
		if (!requestingUser) return res.json({ message: "You are not a valid user" });

		// SOME CHECKINGS
		if(requestingUser.isOTPVerified) {
			return res.json({ message: "You are already a verified user" });
		};
		if(!requestingUser.isOTPExpired()) {
			return res.json({ message: "OTP not yet expired" });
		}

		// GENRATE OTP
		const newOtp = generateOtp();
		const emailOtp = otpEmail(newOtp)
		requestingUser.otpCode = newOtp;
		await requestingUser.save({ validateBeforeSave: false });

		res.status(200).json({
			status: 'success',
			message: 'Gifta Verification Code Resent!',
			data: {
				verifyingUser: requestingUser
			}
		})

		// SEND OTP TO THE USER EMAIL
		return await sendEmail({
			email: requestingUser.email,
            subject: "Gifta Verification Code Resent!",
            message: emailOtp,
		});

	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// VERIFYING OTP
exports.verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;

		// CHECK IF USER TRULY EXIST
		const requestingUser = await User.findOne({ email });
		if (!requestingUser || !requestingUser?.isActive) {
			return res.json({ message: "Invalid User, User no longer exist!" });
		}

		// CHECK IF OTP HAS EXPIRED (ONLY VALID FOR 3 MINUTES)
		if (requestingUser.isOTPExpired()) {
			return res.json({ message: "OTP expired. Please request a new one." });
		}

		// NOW CHECK IF OTP IS CORRECT
		if (requestingUser?.otpCode !== otp) {
			return res.json({ message: "Invalid OTP Code, Try again!" });
		}

		// UPDATE THE USER AND GRANT ACCESS
		requestingUser.isOTPVerified = true;
		requestingUser.otpCode = undefined;
		await requestingUser.save({ validateBeforeSave: false });

		// CREATE NOTIFICATION DOCUMENT
		await Notification.create({
			user: requestingUser._id,
			title: 'Signup Successful!',
			content: `250 points on signup bonus`,
		});

		if (requestingUser.myInviterCode) {
			// FIND THE RECRUITER AND UPDATE HIM
			const recruiter = await User.findOneAndUpdate({ referralCode: requestingUser.myInviterCode }, {
					$inc: { referralsCount: 1 },
					$push: { referralsList: requestingUser._id },
				}, { new: true, runValidators: true },
			);

			if(!recruiter || !recruiter.isActive) {
				return res.json({ message: 'User no longer exist' });
			}

			const userWallet = await Wallet.findOne({ user: recruiter._id });
			userWallet.pointBalance += 500;
			await userWallet.save({});

			// CREATE NOTIFICATION DOCUMENT
			await Notification.create({
				user: recruiter._id,
				title: 'New Invite Signup!',
				content: `500 points for invite on sucessful signup`,
			});
		}

		// CREATING AND SETTING TOKEN
		const token = jwt.sign({ id: requestingUser._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});
		
		return res.status(200).json({
			status: "success",
			message: "OTP Verified",
			data: {
				verifiedUser: requestingUser,
			},
			token,
		});

	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


// USER LOGIN
exports.userLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email }).select("+password");

		// SOME USER CHECKINGS
		if (!user || !user.email) {
			return res.json({ message: "Account does not exist" });
		}
		if (!user?.isActive) {
			return res.json({ message: "Account no longer active" });
		}
		if (!user?.email || !(await user.comparePassword(password, user?.password))) {
			return res.json({ message: "Incorrect email or password " });
		}
		if (!user.isOTPVerified) {
			return res.json({ message: "Not Verified!" });
		}
		user.pushToken = req.body.pushToken;
		user.save({ validateBeforeSave: false });

		// CREATING AND SETTING TOKEN
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});
		// const cookieOptions = {
		// 	expires: new Date(Date.now() + process.env.COOKIES_EXPIRES * 24 * 60 * 60 * 1000),
		// 	httpOnly: true,
		// 	secure: true,
		// };

		// res.cookie("jwt", token, cookieOptions);
		res.status(200).json({
			status: "success",
			message: "Login Successful!",
			data: {
				user,
			},
			token,
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


exports.updatePushToken = async (req, res) => {
	try {
		const user = await User.findByIdAndUpdate(req.user._id, 
			{ pushToken: req.body.pushToken },
			{ runValidators: true, new: true }
		);

		res.status(200).json({
			status: "success",
			data: {
				user
			},
		});
	} catch(err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}


// ADMIN LOGIN
exports.adminLogin = async (req, res) => {
	console.log(req.body);
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.json({ message: "Please provide email and password!" });

		const admin = await Admin.findOne({ email }).select("+password");
		if (!admin?.email || !(await admin.comparePassword(password, admin.password))) {
			return res.json({ message: "Incorrect email or password " });
		}
		const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		return res.status(200).json({
			status: "success",
			data: {
				admin,
			},
			token,
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message
		});
	}
};



// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
	try {
		// 1) Get user based on POSTed email
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({ message: "There is no user with email address" });
		}

		// 2) Generate the random reset token
		const resetToken = user.createPasswordResetToken();
		await user.save({ validateBeforeSave: false });

		// 3) Send it to user's email

		const resetURL = `https://www.gifta.com/reset-password/${resetToken}`;

		const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
		await sendEmail({
			email: user.email,
			subject: 'Your password reset token (valid for 10 min)',
			message
		});

		user.passwordResetToken = undefined;
		user.passwordResetEpires = undefined;
		await user.save({ validateBeforeSave: false });

		res.status(200).json({
			status: "success",
			message: "Token Email successfully sent to email!",
			data: {
				user
			}
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


// RESET PASSWORD
exports.resetPassword = async (req, res) => {
	try {
		// get user based on token
		const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetEpires: { $gt: Date.now() },
		});
		console.log(user);

		// if token has not expired, there is a user, set new password
		if (!user) return res.status(404).json({ message: "Token is invalid or has expired" });
		user.password = req.body.password;
		user.passwordConfirm = req.body.passwordConfirm;
		user.passwordResetToken = undefined;
		user.passwordResetEpires = undefined;
		await user.save();

		// update changedPasswordAt for the user
		// done in userModel on the user schema

		// login user, send jwt
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		return res.status(200).json({
			status: "success",
			message: "Password reset successful",
			data: {
				user,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


// USER LOGOUT
exports.logout = (req, res) => {
	res.clearCookie("jwt");
	res.status(200).json({ status: "success" });
};


// PASSWORD UPDATE
exports.updatePassword = async (req, res) => {
	try {
		// get user
		const user = await User.findById(req.user._id).select("+password");

		// check if POSTED current password is correct
		if (!(await user.comparePassword(req.body.passwordCurrent, user.password))) {
			return res.json({ message: "Your current password is wrong." });
		}

		// if so, update user password
		user.password = req.body.password;
		user.passwordConfirm = req.body.passwordConfirm;
		await user.save({ validateModifiedOnly: true });
		// User.findByIdAndUpdate, will not work here...

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		return res.status(201).json({
			status: "success",
			token,
			data: {
				user,
			},
		});
	} catch (err) {
		return res.status(404).json({
			status: "fail",
			message: err,
		});
	}
};


// exports.adminSignup = async (req, res) => {
// 	try {
// 		const admin = await Admin.create({
// 			email: req.body.email,
// 			password: req.body.password,
// 			passwordConfirm: req.body.passwordConfirm,
// 			role: 'admin',
// 		});

// 		res.status(200).json({
// 			status: "success",
// 			data: {
// 				user: admin,
// 			},
// 		});
// 	} catch (err) {
// 		return res.status(400).json({
// 			status: "fail",
// 			message: err.message || "Something went wrong!",
// 		});
// 	}
// };