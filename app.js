const path = require('path')
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// ROUTES
const userRouter = require('./routes/userRoutes');
const giftProductRouter = require('./routes/giftProductRoutes');
const digitalGiftRouter = require('./routes/digitalGiftsRoutes');
const digitalStickerRouter = require('./routes/digitalStickerRoutes');
const ideaBoxRouter = require('./routes/ideaBoxRoutes');
const giftingRouter = require('./routes/giftingRoutes');
const orderRouter = require('./routes/orderRoutes');
const reminderRouter = require('./routes/reminderRoutes');
const wishListRouter = require('./routes/wishListRoute')
const transactionRouter = require('./routes/transactionRoutes');
const walletRouter = require('./routes/walletRoutes');
const searchRouter = require('./routes/searchRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');
const kycRouter = require('./routes/kycRoutes');

const app = express();

// MIDDLEWARES
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));


app.use(cors());


app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log("Fecthing data...");
    next();
});


// MOUNTING ROUTES
app.use('/api/users', userRouter);
app.use('/api/gift-products', giftProductRouter);
app.use('/api/digital-giftings', digitalGiftRouter);
app.use('/api/digital-stickers', digitalStickerRouter);
app.use('/api/idea-box', ideaBoxRouter);
app.use('/api/giftings', giftingRouter);
app.use('/api/orders', orderRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/wishlists', wishListRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/search', searchRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/kycs', kycRouter);


module.exports = app;