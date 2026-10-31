import mongoose from 'mongoose';

const cropHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        farmId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Farm',
            required: [true, 'Farm ID is required'],
        },
        crop: {
            type: String,
            required: [true, 'Crop name is required'],
            trim: true,
        },
        season: {
            type: String,
            required: [true, 'Season is required'],
            enum: ['Kharif', 'Rabi', 'Zaid', 'Other'],
            trim: true,
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
            min: [1900, 'Year must be a reasonable value'],
            max: [new Date().getFullYear() + 5, 'Year cannot be too far in the future'],
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        }
    },
    {
        timestamps: true,
    }
);

cropHistorySchema.index({ userId: 1, farmId: 1 });

const CropHistory = mongoose.model('CropHistory', cropHistorySchema);
export default CropHistory;
