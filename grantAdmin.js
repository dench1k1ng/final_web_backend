#!/usr/bin/env node

/**
 * Script to grant admin privileges to a user
 * Usage: node grantAdmin.js <email>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function grantAdmin(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`ℹ️  User "${user.username}" is already an admin`);
            process.exit(0);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully granted admin role to "${user.username}" (${email})`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const email = process.argv[2];

if (!email) {
    console.error('Usage: node grantAdmin.js <email>');
    console.error('Example: node grantAdmin.js user@example.com');
    process.exit(1);
}

grantAdmin(email);
