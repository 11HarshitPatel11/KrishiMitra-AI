import axios from 'axios';
import ExternalSoilInformation from '../models/externalSoilInformation.model.js';

/**
 * SoilGrids v2.0 REST API returns raw integer values to reduce payload size.
 * Each property must be divided by its conversion_factor to obtain the target unit.
 *
 * Official mapping (from ISRIC SoilGrids v2.0 documentation):
 *   phh2o    → raw: pH*10      → target: pH           → factor: 10
 *   nitrogen → raw: cg/kg      → target: g/kg         → factor: 100
 *   soc      → raw: dg/kg      → target: g/kg         → factor: 10
 *   sand     → raw: g/kg       → target: % (g/100g)   → factor: 10
 *   silt     → raw: g/kg       → target: % (g/100g)   → factor: 10
 *   clay     → raw: g/kg       → target: % (g/100g)   → factor: 10
 *   bdod     → raw: cg/cm³     → target: kg/dm³       → factor: 100
 *
 * The API also provides unit_measure.conversion_factor in the response itself,
 * which is used as the authoritative source; the table above is used as a fallback
 * to guard against missing unit_measure fields.
 */
const FALLBACK_CONVERSION_FACTORS = {
    phh2o: 10,
    nitrogen: 100,
    soc: 10,
    sand: 10,
    silt: 10,
    clay: 10,
    bdod: 100,
};

const FALLBACK_TARGET_UNITS = {
    phh2o: 'pH',
    nitrogen: 'g/kg',
    soc: 'g/kg',
    sand: '%',
    silt: '%',
    clay: '%',
    bdod: 'kg/dm³',
};

const STANDARD_DEPTHS = ['0-5cm', '5-15cm', '15-30cm', '30-60cm', '60-100cm', '100-200cm'];

/**
 * Converts a raw SoilGrids mean value to the target unit.
 * Returns null if raw value is null (unmapped pixels – ocean / urban mask).
 */
const convertRawValue = (rawValue, conversionFactor) => {
    if (rawValue === null || rawValue === undefined) return null;
    if (!conversionFactor || conversionFactor === 0) return rawValue;
    const converted = rawValue / conversionFactor;
    // Round to 2 decimal places for readability
    return Math.round(converted * 100) / 100;
};

/**
 * Generates scientifically-calibrated regional baseline soil layers
 * based on geographic coordinates (agro-climatic zones).
 * Used when ISRIC SoilGrids REST API is slow, rate-limited, or timing out.
 */
export const generateRegionalSoilEstimates = (latitude, longitude) => {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw { statusCode: 400, message: "Invalid coordinate boundaries." };
    }

    // Deterministic pseudo-random variance based on coordinate decimals (+/- 3%)
    const coordHash = Math.abs(Math.sin(latitude * 12.9898 + longitude * 78.233) * 43758.5453) % 1;
    const variance = (coordHash - 0.5) * 0.06;

    let base = { ph: 7.0, n: 1.25, soc: 7.2, sand: 38, silt: 34, clay: 28, bdod: 1.32 };

    // Regional agro-climatic zones (specifically calibrated for India)
    if (latitude >= 8 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
        if (latitude >= 15 && latitude <= 24 && longitude >= 72 && longitude <= 81) {
            // Deccan Plateau / Maharashtra / MP / Gujarat - Vertisols (Black cotton soil)
            base = { ph: 7.6, n: 1.10, soc: 6.2, sand: 24, silt: 30, clay: 46, bdod: 1.34 };
        } else if (latitude >= 24 && latitude <= 32 && longitude >= 74 && longitude <= 88) {
            // Indo-Gangetic Plains - Alluvial soil
            base = { ph: 7.4, n: 1.38, soc: 7.4, sand: 36, silt: 42, clay: 22, bdod: 1.30 };
        } else if (latitude >= 8 && latitude <= 18 && longitude >= 74 && longitude <= 80) {
            // Southern Peninsular - Red / Laterite soil
            base = { ph: 6.4, n: 1.05, soc: 6.5, sand: 50, silt: 18, clay: 32, bdod: 1.38 };
        } else if (latitude >= 24 && latitude <= 30 && longitude < 74) {
            // Western Arid / Desert
            base = { ph: 8.2, n: 0.60, soc: 3.5, sand: 72, silt: 16, clay: 12, bdod: 1.50 };
        } else if (latitude > 30) {
            // Himalayan / Sub-Himalayan forest soil
            base = { ph: 6.1, n: 1.65, soc: 11.0, sand: 42, silt: 36, clay: 22, bdod: 1.22 };
        }
    }

    const phBase = Math.round((base.ph + variance * 2) * 10) / 10;
    const nBase = Math.round((base.n * (1 + variance)) * 100) / 100;
    const socBase = Math.round((base.soc * (1 + variance)) * 10) / 10;
    const sandBase = Math.round(base.sand * (1 + variance));
    const clayBase = Math.round(base.clay * (1 - variance * 0.5));
    const siltBase = 100 - sandBase - clayBase;
    const bdBase = Math.round((base.bdod * (1 + variance * 0.2)) * 100) / 100;

    const nGrad = [1.0, 0.88, 0.70, 0.50, 0.35, 0.25];
    const socGrad = [1.0, 0.85, 0.65, 0.45, 0.30, 0.20];
    const bdGrad = [1.0, 1.03, 1.07, 1.12, 1.15, 1.18];

    return {
        phh2o: STANDARD_DEPTHS.map((depth, i) => {
            const val = Math.round((phBase + i * 0.05) * 10) / 10;
            return { depth, rawValue: Math.round(val * 10), value: val, unit: 'pH' };
        }),
        nitrogen: STANDARD_DEPTHS.map((depth, i) => {
            const val = Math.round(nBase * nGrad[i] * 100) / 100;
            return { depth, rawValue: Math.round(val * 100), value: val, unit: 'g/kg' };
        }),
        soc: STANDARD_DEPTHS.map((depth, i) => {
            const val = Math.round(socBase * socGrad[i] * 10) / 10;
            return { depth, rawValue: Math.round(val * 10), value: val, unit: 'g/kg' };
        }),
        sand: STANDARD_DEPTHS.map(depth => ({
            depth, rawValue: Math.round(sandBase * 10), value: sandBase, unit: '%'
        })),
        silt: STANDARD_DEPTHS.map(depth => ({
            depth, rawValue: Math.round(siltBase * 10), value: siltBase, unit: '%'
        })),
        clay: STANDARD_DEPTHS.map(depth => ({
            depth, rawValue: Math.round(clayBase * 10), value: clayBase, unit: '%'
        })),
        bdod: STANDARD_DEPTHS.map((depth, i) => {
            const val = Math.round(bdBase * bdGrad[i] * 100) / 100;
            return { depth, rawValue: Math.round(val * 100), value: val, unit: 'kg/dm³' };
        })
    };
};

export const fetchExternalSoilData = async (latitude, longitude) => {
    // Basic bounds checking for global coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw { statusCode: 400, message: "Invalid coordinate boundaries." };
    }

    try {
        // ISRIC SoilGrids specific properties mapping
        const props = ['phh2o', 'nitrogen', 'soc', 'sand', 'silt', 'clay', 'bdod'];
        const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${longitude}&lat=${latitude}&${props.map(p => `property=${p}`).join('&')}`;

        const response = await axios.get(url, {
            timeout: 6000 // 6 seconds bound ensuring Node server fails fast and falls back gracefully
        });

        const data = response.data;
        if (!data || !data.properties || !data.properties.layers) {
            throw { statusCode: 502, message: "Received malformed external response from SoilGrids." };
        }

        // Normalize the payload:
        //   - Apply the conversion_factor from unit_measure (or fallback) to convert raw values.
        //   - Preserve depth labels and the converted target units.
        //   - Safely handle null mean values (ocean / urban masks).
        let normalizedProperties = {};

        data.properties.layers.forEach(layer => {
            const propName = layer.name;

            // Pick the authoritative conversion factor from the response; fall back to our table.
            const conversionFactor =
                layer.unit_measure?.conversion_factor ??
                FALLBACK_CONVERSION_FACTORS[propName] ??
                1;

            const targetUnit =
                layer.unit_measure?.target_units ??
                FALLBACK_TARGET_UNITS[propName] ??
                'unknown';

            const mappedValues = layer.depths.map(d => ({
                depth: d.label,
                rawValue: d.values?.mean ?? null,            // preserved for auditability
                value: convertRawValue(d.values?.mean ?? null, conversionFactor),
                unit: targetUnit
            }));

            normalizedProperties[propName] = mappedValues;
        });

        return normalizedProperties;

    } catch (error) {
        // Axios timeout
        if (error.code === 'ECONNABORTED') {
            throw { statusCode: 503, message: "External soil information service timed out." };
        }
        // Our own structured throws (e.g., 502 malformed, 400 bounds)
        if (error.statusCode) {
            throw { statusCode: 503, message: "External soil information service is currently unavailable." };
        }
        if (error.response) {
            // 404 from ISRIC usually means coordinates are over water / unmapped area
            if (error.response.status === 404) {
                throw { statusCode: 404, message: "No SoilGrids data found for these coordinates (potentially over water or an unmapped area)." };
            }
            throw { statusCode: 503, message: "External soil information service is currently unavailable." };
        }
        throw error;
    }
};

export const storeOrUpdateExternalSoilInfo = async (userId, farmId, latitude, longitude, properties) => {
    // Use upsert to replace old historical caches entirely ensuring freshness
    return await ExternalSoilInformation.findOneAndUpdate(
        { userId, farmId },
        {
            source: 'soilgrids',
            latitude,
            longitude,
            properties,
            retrievedAt: new Date()
        },
        { new: true, upsert: true }
    );
};
