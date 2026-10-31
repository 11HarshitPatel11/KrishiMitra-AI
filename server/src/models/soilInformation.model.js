import mongoose from 'mongoose';

const soilInformationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        farmId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Farm',
            required: true,
            index: true
        },
        soilType: {
            type: String,
            trim: true,
            maxlength: 100
        },
        pH: {
            type: Number,
            min: 0,
            max: 14
        },
        nitrogen: {
            type: Number,
            min: 0
        },
        phosphorus: {
            type: Number,
            min: 0
        },
        potassium: {
            type: Number,
            min: 0
        },
        moisture: {
            type: Number,
            min: 0
        },
        source: {
            type: String,
            enum: ['manual', 'external'],
            default: 'manual'
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true,
    }
);

// Enforce single current record per farm
soilInformationSchema.index({ farmId: 1, userId: 1 }, { unique: true });

const SoilInformation = mongoose.model('SoilInformation', soilInformationSchema);

export default SoilInformation;
