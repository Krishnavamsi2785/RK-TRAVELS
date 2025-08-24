require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const Booking = require('./models/Booking'); // Booking model
const http = require('http');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let transporter;
const canSendEmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;
if (canSendEmail) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    console.warn('EMAIL_USER or EMAIL_PASS not set — email notifications disabled');
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// Create a new booking and send a confirmation email
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        io.emit('newBooking', booking);

        // Send a booking received email to customer immediately
        if (canSendEmail && booking.email) {
            const mailOptions = {
                from: `"RK_TRAVELS" <${process.env.EMAIL_USER}>`,
                to: booking.email,
                subject: 'Your Booking Has Been Received',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>🚖 Thank You for Your Booking!</h2>
                        <p>Dear <strong>${booking.name}</strong>,</p>
                        <p>Your booking request from <b>${booking.pickup}</b> to <b>${booking.drop}</b> has been received. Our team will review it and send a confirmation shortly.</p>
                        <p><strong>Booking ID:</strong> ${booking._id}</p>
                        <p>You can use this ID to check your booking status on our website.</p>
                        <p style="color:#555;">— The RK_TRAVELS Team</p>
                    </div>
                `,
            };
            try {
                await transporter.sendMail(mailOptions);
                console.log('✅ Initial booking email sent to', booking.email);
            } catch (emailErr) {
                console.error('❌ Email send error:', emailErr.message);
            }
        }
        res.json({ success: true, booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json({ success: true, bookings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get a single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }
        res.json({ success: true, booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update booking status and send a confirmation email
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Send email for "Accepted" status
        if (String(status).toLowerCase() === 'accepted' && canSendEmail && booking.email) {
            const mailOptions = {
                from: `"RK_TRAVELS" <${process.env.EMAIL_USER}>`,
                to: booking.email,
                subject: 'Your Taxi Booking has been Accepted ✅',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>🚖 Great News! Your Booking is Confirmed!</h2>
                        <p>Dear <strong>${booking.name}</strong>,</p>
                        <p>Your booking from <b>${booking.pickup}</b> to <b>${booking.drop}</b> on <b>${new Date(booking.dateTime).toLocaleString()}</b> has been <b>accepted</b> by our team.</p>
                        <p><strong>Booking ID:</strong> ${booking._id}</p>
                        <p>For any changes or questions, please contact us.</p>
                        <p>Thank you for trusting <strong>RK_TRAVELS</strong>!</p>
                        <p style="color:#555;">— The RK_TRAVELS Team</p>
                    </div>
                `,
            };
            try {
                await transporter.sendMail(mailOptions);
                console.log('✅ Acceptance email sent to', booking.email);
            } catch (emailErr) {
                console.error('❌ Acceptance email send error:', emailErr.message);
            }
        }

        // Send email for "Canceled" status
        if (String(status).toLowerCase() === 'canceled' && canSendEmail && booking.email) {
            const mailOptions = {
                from: `"RK_TRAVELS" <${process.env.EMAIL_USER}>`,
                to: booking.email,
                subject: 'Your Taxi Booking Has Been Canceled ❌',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>😞 We're Sorry, Your Booking Has Been Canceled</h2>
                        <p>Dear <strong>${booking.name}</strong>,</p>
                        <p>Unfortunately, we had to cancel your booking from <b>${booking.pickup}</b> to <b>${booking.drop}</b> on <b>${new Date(booking.dateTime).toLocaleString()}</b>.</p>
                        <p>This may be due to an unexpected issue or unavailability. We apologize for any inconvenience this may cause.</p>
                        <p><strong>Booking ID:</strong> ${booking._id}</p>
                        <p>We hope to serve you again soon!</p>
                        <p style="color:#555;">— The RK_TRAVELS Team</p>
                    </div>
                `,
            };
            try {
                await transporter.sendMail(mailOptions);
                console.log('✅ Cancellation email sent to', booking.email);
            } catch (emailErr) {
                console.error('❌ Cancellation email send error:', emailErr.message);
            }
        }
        
        res.json({ success: true, booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Connect MongoDB & Start Server
async function start() {
    try {
        if (!mongoUri) {
            console.error('MongoDB URI not set in .env');
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected');
        server.listen(PORT, () =>
            console.log(`🚀 Server running at http://localhost:${PORT}`)
        );
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
}
start();

// Socket.IO
io.on('connection', (socket) => {
    console.log('⚡ Admin connected via Socket.IO');
    socket.on('disconnect', () => {
        console.log('⚡ Admin disconnected');
    });
});