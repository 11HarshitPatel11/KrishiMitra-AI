import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
    {
        farmName: {
            type: String,
            required: [true, 'Farm name is required'],
            trim: true,
        },
        area: {
            type: Number,
            required: [true, 'Area is required'],
            min: [0.01, 'Area must be greater than 0'],
        },
        areaUnit: {
            type: String,
            required: [true, 'Area unit is required'],
            enum: {
                values: ['acre', 'hectare'],
                message: '{VALUE} is not a supported area unit',
            },
        },
        nitrogen: {
            type: Number,
            required: [true, 'Nitrogen (N) value is required'],
            min: [0, 'Nitrogen must be a positive number'],
        },
        phosphorus: {
            type: Number,
            required: [true, 'Phosphorus (P) value is required'],
            min: [0, 'Phosphorus must be a positive number'],
        },
        potassium: {
            type: Number,
            required: [true, 'Potassium (K) value is required'],
            min: [0, 'Potassium must be a positive number'],
        },
        pH: {
            type: Number,
            required: [true, 'pH value is required'],
            min: [0, 'pH cannot be less than 0'],
            max: [14, 'pH cannot be greater than 14'],
        },
        latitude: {
            type: Number,
            required: false,
            min: [-90, 'Latitude cannot be less than -90'],
            max: [90, 'Latitude cannot be greater than 90'],
        },
        longitude: {
            type: Number,
            required: false,
            min: [-180, 'Longitude cannot be less than -180'],
            max: [180, 'Longitude cannot be greater than 180'],
        },
        location: {
            type: String,
            required: false,
            trim: true,
            default: '',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        }
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

// Index user-scoped farm lookups (e.g. Farm.find({ userId })) to prevent collection scans
farmSchema.index({ userId: 1 });

const Farm = mongoose.model('Farm', farmSchema);
export default Farm;
