import DiseaseInformation from '../models/diseaseInformation.model.js';

export class DiseaseInformationService {
    static async getDiseaseByCode(diseaseCode) {
        // Return null if not found
        return await DiseaseInformation.findOne({ diseaseCode });
    }

    static async getAllSupportedDiseases() {
        return await DiseaseInformation.find({}, 'diseaseCode crop name').sort({ crop: 1, name: 1 });
    }
}
