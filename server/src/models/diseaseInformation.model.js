import mongoose from 'mongoose';

const diseaseInformationSchema = new mongoose.Schema(
    {
        diseaseCode: {
            type: String,
            required: [true, 'Disease code is required'],
            unique: true,
            trim: true,
            index: true
        },
        crop: {
            type: String,
            required: [true, 'Crop name is required'],
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Disease name is required'],
            trim: true
        },
        symptoms: {
            type: [String],
            required: [true, 'At least one symptom is required']
        },
        causes: {
            type: [String],
            default: []
        },
        prevention: {
            type: [String],
            default: []
        },
        management: {
            type: [String],
            default: []
        },
        sourceName: {
            type: String,
            trim: true,
            default: ''
        },
        sourceUrl: {
            type: String,
            trim: true,
            default: ''
        },
        limitations: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true,
    }
);

const DiseaseInformation = mongoose.model('DiseaseInformation', diseaseInformationSchema);

export default DiseaseInformation;
