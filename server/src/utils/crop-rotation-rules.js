// Static metadata for supported crops in the ML model
// Used strictly for conservative crop rotation scoring, NOT for ML feature inputs.

export const cropMetadata = {
    // Annuals - Cereals & Grains
    rice: { type: 'annual', category: 'cereal', legume: false },
    maize: { type: 'annual', category: 'cereal', legume: false },
    jute: { type: 'annual', category: 'cash_crop', legume: false },
    cotton: { type: 'annual', category: 'cash_crop', legume: false },

    // Annuals - Legumes (Nitrogen Fixing)
    chickpea: { type: 'annual', category: 'legume', legume: true },
    kidneybeans: { type: 'annual', category: 'legume', legume: true },
    pigeonpeas: { type: 'annual', category: 'legume', legume: true },
    mothbeans: { type: 'annual', category: 'legume', legume: true },
    mungbean: { type: 'annual', category: 'legume', legume: true },
    blackgram: { type: 'annual', category: 'legume', legume: true },
    lentil: { type: 'annual', category: 'legume', legume: true },

    // Annuals - Fruits/Vegetables
    watermelon: { type: 'annual', category: 'fruit', legume: false },
    muskmelon: { type: 'annual', category: 'fruit', legume: false },
    papaya: { type: 'annual', category: 'fruit', legume: false }, // Often grown as annual/short-lived perennial in farming

    // Perennials - Trees and Orchards
    mango: { type: 'perennial', category: 'fruit', legume: false },
    apple: { type: 'perennial', category: 'fruit', legume: false },
    orange: { type: 'perennial', category: 'fruit', legume: false },
    coconut: { type: 'perennial', category: 'fruit', legume: false },
    grapes: { type: 'perennial', category: 'fruit', legume: false },
    pomegranate: { type: 'perennial', category: 'fruit', legume: false },
    banana: { type: 'perennial', category: 'fruit', legume: false },
    coffee: { type: 'perennial', category: 'cash_crop', legume: false },
};

/**
 * Derives a conservative rotation factor based on the previous and candidate crop.
 * 
 * @param {string|null} previousCrop 
 * @param {string} candidateCrop 
 * @returns {number} rotationFactor
 */
export const calculateRotationFactor = (previousCrop, candidateCrop) => {
    // Clean inputs
    const prev = previousCrop ? previousCrop.toLowerCase().trim() : null;
    const cand = candidateCrop ? candidateCrop.toLowerCase().trim() : null;

    // Rule A - No History
    if (!prev || !cand) {
        return 1.0;
    }

    const prevMeta = cropMetadata[prev];
    const candMeta = cropMetadata[cand];

    // If metadata is unknown, be conservative and assume 1.0
    if (!prevMeta || !candMeta) {
        return 1.0;
    }

    // Rule D - Same Perennial Crop
    // Do not penalize perennial crops (like mango, apple, etc.)
    if (prev === cand && candMeta.type === 'perennial') {
        return 1.0;
    }

    // Rule B - Same Annual Crop
    if (prev === cand && candMeta.type === 'annual') {
        return 0.75; // Moderate penalty
    }

    // Rule E - Legume Context (Bonus/Neutral)
    // "If insufficient reliable metadata to justify a numeric bonus, use 1.0 and only provide explanatory note."
    // We will stick to 1.0 here, but the layer above can detect this and generate the note.

    // Default Rule C - Different Crop
    return 1.0;
};
