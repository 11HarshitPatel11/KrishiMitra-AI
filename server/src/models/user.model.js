import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ]
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        mobileNumber: {
            type: String,
            trim: true,
            required: [false, 'Mobile number is optional'],
        },
        location: {
            type: String,
            trim: true,
            required: [false, 'Location is optional'],
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);
export default User;
