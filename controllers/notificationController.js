const Notification = require('../models/NotificationModel');
const User = require('../models/userModel');


exports.allNotification = async (req, res) => {
    try {
        const notifications = await Notification.find({});
        
        res.status(200).json({
            status: 'success',
            count: notifications.length,
            data: {
                notifications
            }
        });
    } catch(err) {
        return res.status(400).json({
			status: "fail",
			message: err.message,
		});
    }
}


exports.currUserNotification = async (req, res) => {
    try {
        const myNotifications = await Notification.find({ user: req.user._id }).sort({ date: -1 }).limit(25);
        if(!myNotifications) return res.json({
            message: "No notification"
        });

        res.status(200).json({
            status: 'success',
            count: myNotifications.length,
            data: {
                notifications: myNotifications,
            }
        });
    } catch(err) {
        return res.status(400).json({
			status: "fail",
			message: err.message,
		});
    }
}


exports.setMessagesRead = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if(!user || !user.isActive) return res.json({
            message: 'User not found or not active.'
        });
        await Notification.updateMany(
            { user: user._id, status: 'unread' },
            { status: 'read' }
        );

        const notifications = await Notification.find({ user: user._id }).sort({ date: -1 }).limit(25);
        res.status(200).json({
            status: 'success',
            data: {
                notifications
            }
        });

    } catch(err) {
        return res.status(400).json({
			status: "fail",
			message: err.message,
		});
    }
}