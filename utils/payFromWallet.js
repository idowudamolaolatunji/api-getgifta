const User = require('../models/userModel');
const Wallet = require('../models/walletModel');

//////////////////////////////////////////////////////
async function payFromWallet(_, res, userId, amount) {
    try {
        // DEDUCT AMOUNT FROM USER WALLET BALANCE
        const user = await User.findById(userId);
        const userWallet = await Wallet.findOne({ user: user._id });
        if(!userWallet || user.walletBalance < Number(amount)) {
            throw new Error('Insufficient funds in the wallet');
        }

        userWallet.walletBalance -= Number(amount);
        await userWallet.save({});

        return res.status(200).json({
            status: 'success',
            message: 'Payment successful from wallet',
            data: {
                user,
                userWallet
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message || 'Failed to process payment from wallet',
        });
    }
}

module.exports = payFromWallet;