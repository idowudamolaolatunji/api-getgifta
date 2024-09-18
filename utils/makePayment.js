const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');


async function makePayment(response, req, res, type) {
    try {
        const user = await User.findOne({ email: response.email });
        if(!user || !user.isActive) return res.json({
            message: 'User not found!'
        });
        
        const amount = (Number(response.amount) / 100) - charges;

        const newTransaction = await Transaction.create({
            user: user._id,
            amount,
            status: 'success',
            reference: response.reference,
            purpose: type,
            charged: true
        });        
        
        res.status(201).json({
            status: 'success',
            message: `${type} successful`,
            data: {
                transaction: newTransaction,
            }
        })

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


module.exports = makePayment;