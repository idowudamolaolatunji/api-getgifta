const Reminder = require("../models/reminderModel");
const Notification = require("../models/NotificationModel");
const User = require("../models/userModel");
const formatDate = require("../utils/formatDate");
const formatTime = require("../utils/formatTime");

const sendPushNotification = require("../utils/pushNotification");

const moment = require("moment");

function YmdConvertDate(dateString) {
	const date = new Date(dateString);
	const year = date.getFullYear();
	let month = (date.getMonth() + 1).toString().padStart(2, "0");
	let day = date.getDate().toString().padStart(2, "0");

	return `${year}-${month}-${day}`;
}

const mapAndSend = async (reminders) => {
	const userIds = reminders.map((reminder) => reminder.user._id);
	console.log("extractedIds", userIds);

	console.log("==========================================================");

	const usersPushToken = await User.find({
		_id: { $in: userIds },
	}).select("pushToken _id");
	// console.log(usersPushToken);

	// SEND PUSH NOTIFICATIONS TO USERS WITH PUSH TOKENS
	reminders.map(async (reminder) => {
		const reminderUserPushToken = usersPushToken.find((userPushObj) => userPushObj._id.equals(reminder.user._id));
		console.log("ReminderUserPushTokens", reminderUserPushToken);

		//now lets cook the reminder obj nigga

		const reminderObject = {
			title: reminder.title,
			body: `A ${reminder.purpose} reminder for you!`,
			pushToken: reminderUserPushToken.pushToken,
		};
		console.log(reminderObject);
		await sendPushNotification(reminderObject);
	});

	await Reminder.updateMany({ _id: { $in: reminders.map((reminder) => reminder._id) } }, { status: "sent" });
};

exports.checkCurrentReminders = async (req, res) => {
	try {
		const currentDate = moment();
		const currentTime = currentDate.format("HH:mm");
		const oneHour = currentDate.clone().add(1, "hour");
		const oneHourLater = oneHour.format("HH:mm");

		const elevenMinutes = currentDate.clone().subtract(11, "minute");
		const elevenMinutesBefore = elevenMinutes.format("HH:mm");
		const formattedCurrDateString = currentDate.toISOString().split("T")[0];

		const reminders = await Reminder.find({
			reminderDate: currentDate.toISOString().split("T")[0],
			$or: [{ reminderTime: currentTime }, { reminderTime: { $gt: elevenMinutesBefore, $lt: currentTime } }],
			status: "unsent",
		});

		const outstandingReminders = await Reminder.find({
			reminderDate: currentDate.toISOString().split("T")[0],
			reminderTime: { $lt: elevenMinutesBefore },
			status: "unsent",
		});

		await mapAndSend(reminders);
		await mapAndSend(outstandingReminders);

		return res.status(200).json({
			status: "success",
			reminderCount: reminders.length,
			outstandingReminderCount: outstandingReminders.length,
			data: {
				reminders,
				outstandingReminders,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// CREATING A REMINDER
exports.createReminder = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user || !user.isActive)
			return res.json({
				message: "Cannot find User!",
			});

		// CREATE REMINDER
		const reminder = await Reminder.create({
			user: user._id,
			title: req.body.title,
			purpose: req.body.purpose,
			reminderMessage: req.body.reminderMessage,
			reminderDate: req.body.reminderDate,
			image: req.body.image,
			reminderTime: req.body.reminderTime,
			sendMessage: req.body.sendMessage || null,
			sendThrough: req.body.sendThrough,
			emailAddress: req.body.emailAddress,
			phoneNumber: req.body.phoneNumber,
		});
		const newNotification = await Notification.create({
			user: user._id,
			title: "New Reminder",
			content: `A new ${req.body.purpose} reminder was made for ${formatDate(req.body.reminderDate)}`,
		});

		return res.status(201).json({
			status: "success",
			message: "Reminder created!",
			data: {
				reminder,
				newNotification,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// ADD IMAGES
exports.uploadReminderImg = async (req, res) => {
	try {
		let image;
		if (req.file) image = req.file.filename;
		const reminderID = req.params.id;

		const updated = await Reminder.findByIdAndUpdate(
			reminderID,
			{ image },
			{
				new: true,
				runValidators: true,
			},
		);

		res.status(200).json({
			status: "success",
			data: {
				reminder: updated,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET EVERY REMINDER
exports.everyReminder = async (req, res) => {
	try {
		const reminders = await Reminder.find({ isActive: true }).sort({
			reminderDate: -1,
		});

		res.status(200).json({
			status: "success",
			count: reminders.length,
			data: {
				reminders,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET EVERY REMINDER FOR CURRENT USER
exports.currUserReminder = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		const reminders = await Reminder.find({ user: currentUser._id }).sort({
			reminderDate: -1,
		});

		if (!reminders || reminders.length < 1) {
			return res.json({
				message: "No reminder Found",
			});
		}

		res.status(200).json({
			status: "success",
			count: reminders.length,
			data: {
				reminders,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


exports.addGiftToReminder = async(req, res) => {
	try {

		// FIND THE CURRENT USER AS THE REQUESTING USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		const reminder = await Reminder.findOne({ _id: req.params.reminderID, user: currentUser._id });;
		if(!reminder) {
			return res.json({
				message: 'Reminder not found!'
			});
		}

		reminder.addedGift = req.body.giftId;
		await reminder.save({});

		await Notification.create({
			user: currentUser._id,
			title: "Gift Added to Reminder 🎉",
			content: `You added Gift to a ${reminder?.purpose} reminder!`
		})

		res.status(200).json({
			status: 'success',
			message: 'Gift added to reminder successful!',
			data: {
				reminder
			}
		})

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message
		})
	}
}

// POSTPONE REMINDER BY ID
exports.postponeReminder = async (req, res) => {
	try {
		const { date, time, reminderID } = req.params;

		// FIND THE CURRENT USER AS THE REQUESTING USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive) {
			return res.json({
				message: "Cannot find user!",
			});
		}

		// POSTPONE THE REMINDER
		const reminder = await Reminder.findOneAndUpdate(
			{ _id: reminderID, user: currentUser._id },
			{
				// reminderDate: req.body.reminderDate,
				// reminderTime: req.body.reminderTime,
				reminderDate: date,
				reminderTime: time
			},
			{ runValidators: true, new: true },
		);

		await Notification.create({
			user: currentUser._id,
			title: "Reminder Postponed!",
			// content: `A ${reminder.purpose} reminder was just postponed for ${formatDate(req.body.reminderDate)} at ${req.body.reminderTime}`,
			content: `A ${reminder.purpose} reminder was just postponed for ${formatDate(date)} at ${formatTime(time)}`,
		});

		res.status(200).json({
			status: "success",
			message: "Reminder Postponed!",
			data: {
				reminder,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// UPDATE REMINDER BY ID
exports.updateReminder = async (req, res) => {
	try {
		// FIND THE CURRENT USER AS THE REQUESTING USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		// UPDATE THE REMINDER
		const reminder = await Reminder.findOneAndUpdate({ _id: req.params.reminderID, user: currentUser._id }, req.body, { runValidators: true, new: true });

		await Notification.create({
			user: currentUser._id,
			title: "Reminder Updated Successfully",
			content: `A ${reminder.purpose} reminder was just updated!`,
		});

		res.status(200).json({
			status: "success",
			message: "Reminder Updated!",
			data: {
				reminder,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// MARK REMINDER AS COMPLETED
exports.markReminderAsCompleted = async (req, res) => {
	try {
		const { reminderID } = req.params;
		// FIND THE CURRENT USER AS THE REQUESTING USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive) {
			return res.json({
				message: "Cannot find user!",
			});
		}
		if (!(await Reminder.findById(reminderID))) {
			return res.json({
				message: "Reminder not found",
			});
		}

		const reminder = await Reminder.findOne({
			_id: reminderID,
			user: currentUser._id,
		});
		if (reminder.isCompleted) {
			return res.json({ message: "Reminder already completed! " });
		}

		reminder.isCompleted = true;
		await reminder.save({});

		await Notification.create({
			user: currentUser._id,
			title: "Reminder Completed",
			content: `A ${reminder.purpose} reminder was completed!`,
		});

		res.status(200).json({
			status: "success",
			message: "Reminder Completed!",
			data: {
				reminder
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// CANCEL REMINDER
exports.cancelReminder = async (req, res) => {
	try {
		const { reminderID } = req.params;
		// FIND THE CURRENT USER AS THE REQUESTING USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		if (!(await Reminder.findById(reminderID))) {
			return res.json({
				message: "Reminder not found",
			});
		}
		await Reminder.findOneAndUpdate({ _id: reminderID, user: currentUser._id }, { isActive: false }, { new: true });

		await Notification.create({
			user: currentUser._id,
			title: "Reminder Cancelled",
			content: `A ${await Reminder.findById(reminderID).purpose} reminder was cancelled!`,
		});

		res.status(200).json({
			status: "success",
			message: "Reminder Canceled!",
			data: null,
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// DELETE REMINDER
exports.deleteReminder = async (req, res) => {
	try {
		// FIND THE CURRENT USER AS THE REQUESTING USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		// DELETE REMINDER
		await Reminder.findOneAndDelete({
			_id: req.params.reminderID,
			user: currentUser._id,
		});

		res.status(200).json({
			status: "success",
			message: "Reminder deleted!",
			data: null,
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};
