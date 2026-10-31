import mongoose from 'mongoose';

const externalSoilInformationSchema = new mongoose.Schema(
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
        source: {
            type: String,
            required: true,
            default: 'soilgrids',
            enum: ['soilgrids']
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        properties: {
            type: mongoose.Schema.Types.Mixed,
            required: true // Structured as returned by SoilGrids normalization
        },
        retrievedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
    }
);

// One soilgrids record per farm, update it when a new request happens
externalSoilInformationSchema.index({ farmId: 1, userId: 1 }, { unique: true });

const ExternalSoilInformation = mongoose.model('ExternalSoilInformation', externalSoilInformationSchema);

export default ExternalSoilInformation;
