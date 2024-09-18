const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
const PORT = process.env.PORT || 3020;

// Database connection

/*
mongoose.connect(DB)
    .then((con) => {
        console.log('Database connected successfully!');
    })
    .catch((err) => {
        console.log(err)
    })
;

app.listen(PORT, () => {
    console.log(`App running on Port ${PORT}...`)
});
*/

// REDO THE CONNECTIONS FOR CYCLIC
const connectDB = async function() {
    try {
        await mongoose.connect(DB);
        console.log('Database connected successfully!');

    } catch(err) {
        console.log(err)
    }
}

console.log('Connecting...');

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`App running on Port ${PORT}...`)
    });
})