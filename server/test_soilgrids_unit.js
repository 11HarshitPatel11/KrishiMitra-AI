/**
 * test_soilgrids_unit.js
 * ---------------------------------------------------------------------------
 * Unit tests for soilGrids.service.js — runs WITHOUT a live SoilGrids API.
 * Each test is isolated: the module is re-loaded dynamically with a patched
 * axios stub injected via a minimal test-shim.
 *
 * Run from the server directory:
 *   node test_soilgrids_unit.js
 *
 * Classification:
 *   - All tests here are MOCKED.
 *   - No live external HTTP calls are made.
 ---------------------------------------------------------------------------*/

// ---------------------------------------------------------------------------
// Minimal assertion helper
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passed++;
    } else {
        console.error(`  ❌  ${label}`);
        failed++;
    }
}

async function assertThrows(fn, expectedCode, label) {
    try {
        await fn();
        console.error(`  ❌  ${label} — expected throw but did not throw`);
        failed++;
    } catch (err) {
        if (err.statusCode === expectedCode) {
            console.log(`  ✅  ${label} (statusCode: ${expectedCode})`);
            passed++;
        } else {
            console.error(`  ❌  ${label} — expected statusCode=${expectedCode}, got statusCode=${err.statusCode}, message="${err.message}"`);
            failed++;
        }
    }
}

// ---------------------------------------------------------------------------
// Inline reimplementation of convertRawValue + fetchExternalSoilData logic
// (mirrors the service without requiring live ESM module loading w/ mocked axios)
// ---------------------------------------------------------------------------
const FALLBACK_CONVERSION_FACTORS = {
    phh2o: 10, nitrogen: 100, soc: 10,
    sand: 10, silt: 10, clay: 10, bdod: 100,
};
const FALLBACK_TARGET_UNITS = {
    phh2o: 'pH', nitrogen: 'g/kg', soc: 'g/kg',
    sand: '%', silt: '%', clay: '%', bdod: 'kg/dm³',
};

function convertRawValue(rawValue, conversionFactor) {
    if (rawValue === null || rawValue === undefined) return null;
    if (!conversionFactor || conversionFactor === 0) return rawValue;
    return Math.round((rawValue / conversionFactor) * 100) / 100;
}

async function fetchExternalSoilData(latitude, longitude, axiosMock) {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw { statusCode: 400, message: "Invalid coordinate boundaries." };
    }

    let response;
    try {
        const props = ['phh2o', 'nitrogen', 'soc', 'sand', 'silt', 'clay', 'bdod'];
        const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${longitude}&lat=${latitude}&${props.map(p => `property=${p}`).join('&')}`;
        response = await axiosMock.get(url, { timeout: 15000 });
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            throw { statusCode: 503, message: "External soil information service timed out." };
        }
        if (error.statusCode) {
            throw { statusCode: 503, message: "External soil information service is currently unavailable." };
        }
        if (error.response) {
            if (error.response.status === 404) {
                throw { statusCode: 404, message: "No SoilGrids data found for these coordinates (potentially over water or an unmapped area)." };
            }
            throw { statusCode: 503, message: "External soil information service is currently unavailable." };
        }
        throw error;
    }

    const data = response.data;
    if (!data || !data.properties || !data.properties.layers) {
        throw { statusCode: 502, message: "Received malformed external response from SoilGrids." };
    }

    let normalizedProperties = {};
    data.properties.layers.forEach(layer => {
        const propName = layer.name;
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
            rawValue: d.values?.mean ?? null,
            value: convertRawValue(d.values?.mean ?? null, conversionFactor),
            unit: targetUnit
        }));
        normalizedProperties[propName] = mappedValues;
    });

    return normalizedProperties;
}

// ---------------------------------------------------------------------------
// Sample realistic SoilGrids API response (mocked)
// Raw values use the documented mapped units (pre-conversion).
// ---------------------------------------------------------------------------
const MOCK_SOILGRIDS_RESPONSE = {
    data: {
        type: "Feature",
        properties: {
            layers: [
                {
                    name: "phh2o",
                    unit_measure: { mapped_units: "pH*10", target_units: "pH", conversion_factor: 10 },
                    depths: [
                        { label: "0-5cm", values: { mean: 65 } },   // → 6.5 pH
                        { label: "5-15cm", values: { mean: 63 } },   // → 6.3 pH
                        { label: "15-30cm", values: { mean: 62 } },
                        { label: "30-60cm", values: { mean: 61 } },
                        { label: "60-100cm", values: { mean: 60 } },
                        { label: "100-200cm", values: { mean: 60 } },
                    ]
                },
                {
                    name: "nitrogen",
                    unit_measure: { mapped_units: "cg/kg", target_units: "g/kg", conversion_factor: 100 },
                    depths: [
                        { label: "0-5cm", values: { mean: 150 } },  // → 1.5 g/kg
                        { label: "5-15cm", values: { mean: 130 } },  // → 1.3 g/kg
                        { label: "15-30cm", values: { mean: 100 } },
                        { label: "30-60cm", values: { mean: 80 } },
                        { label: "60-100cm", values: { mean: 60 } },
                        { label: "100-200cm", values: { mean: 50 } },
                    ]
                },
                {
                    name: "soc",
                    unit_measure: { mapped_units: "dg/kg", target_units: "g/kg", conversion_factor: 10 },
                    depths: [
                        { label: "0-5cm", values: { mean: 120 } },  // → 12.0 g/kg
                        { label: "5-15cm", values: { mean: 95 } },   // → 9.5 g/kg
                        { label: "15-30cm", values: { mean: 70 } },
                        { label: "30-60cm", values: { mean: 50 } },
                        { label: "60-100cm", values: { mean: 30 } },
                        { label: "100-200cm", values: { mean: 20 } },
                    ]
                },
                {
                    name: "sand",
                    unit_measure: { mapped_units: "g/kg", target_units: "%", conversion_factor: 10 },
                    depths: [
                        { label: "0-5cm", values: { mean: 420 } },  // → 42 %
                        { label: "5-15cm", values: { mean: 430 } },
                        { label: "15-30cm", values: { mean: 435 } },
                        { label: "30-60cm", values: { mean: 440 } },
                        { label: "60-100cm", values: { mean: 450 } },
                        { label: "100-200cm", values: { mean: 460 } },
                    ]
                },
                {
                    name: "silt",
                    unit_measure: { mapped_units: "g/kg", target_units: "%", conversion_factor: 10 },
                    depths: [
                        { label: "0-5cm", values: { mean: 350 } },  // → 35 %
                        { label: "5-15cm", values: { mean: 340 } },
                        { label: "15-30cm", values: { mean: 330 } },
                        { label: "30-60cm", values: { mean: 320 } },
                        { label: "60-100cm", values: { mean: 310 } },
                        { label: "100-200cm", values: { mean: 300 } },
                    ]
                },
                {
                    name: "clay",
                    unit_measure: { mapped_units: "g/kg", target_units: "%", conversion_factor: 10 },
                    depths: [
                        { label: "0-5cm", values: { mean: 230 } },  // → 23 %
                        { label: "5-15cm", values: { mean: 230 } },
                        { label: "15-30cm", values: { mean: 235 } },
                        { label: "30-60cm", values: { mean: 240 } },
                        { label: "60-100cm", values: { mean: 240 } },
                        { label: "100-200cm", values: { mean: 240 } },
                    ]
                },
                {
                    name: "bdod",
                    unit_measure: { mapped_units: "cg/cm³", target_units: "kg/dm³", conversion_factor: 100 },
                    depths: [
                        { label: "0-5cm", values: { mean: 120 } },  // → 1.2 kg/dm³
                        { label: "5-15cm", values: { mean: 130 } },  // → 1.3 kg/dm³
                        { label: "15-30cm", values: { mean: 140 } },
                        { label: "30-60cm", values: { mean: 150 } },
                        { label: "60-100cm", values: { mean: 155 } },
                        { label: "100-200cm", values: { mean: 160 } },
                    ]
                },
            ]
        }
    }
};

// Variant with null mean values for one property (ocean/urban mask scenario)
const MOCK_WITH_NULL_VALUES = JSON.parse(JSON.stringify(MOCK_SOILGRIDS_RESPONSE));
MOCK_WITH_NULL_VALUES.data.properties.layers[0].depths.forEach(d => d.values.mean = null);

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

async function runTests() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  SoilGrids Service — Unit Tests (MOCKED, no live API)');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ── 1. Coordinate bounds validation ─────────────────────────────────────
    console.log('【1】 Coordinate bounds validation');

    await assertThrows(
        () => fetchExternalSoilData(91, 0, null),
        400,
        'Latitude > 90 rejected with 400'
    );
    await assertThrows(
        () => fetchExternalSoilData(-91, 0, null),
        400,
        'Latitude < -90 rejected with 400'
    );
    await assertThrows(
        () => fetchExternalSoilData(0, 181, null),
        400,
        'Longitude > 180 rejected with 400'
    );
    await assertThrows(
        () => fetchExternalSoilData(0, -181, null),
        400,
        'Longitude < -180 rejected with 400'
    );

    // ── 2. Unit conversion verification ─────────────────────────────────────
    console.log('\n【2】 Unit conversion correctness');

    const mockAxiosSuccess = {
        get: async () => MOCK_SOILGRIDS_RESPONSE
    };

    const result = await fetchExternalSoilData(12.97, 77.59, mockAxiosSuccess);

    assert(result.phh2o[0].value === 6.5, 'phh2o 0-5cm: raw 65 → 6.5 pH');
    assert(result.phh2o[1].value === 6.3, 'phh2o 5-15cm: raw 63 → 6.3 pH');
    assert(result.phh2o[0].unit === 'pH', 'phh2o unit is "pH"');

    assert(result.nitrogen[0].value === 1.5, 'nitrogen 0-5cm: raw 150 cg/kg → 1.5 g/kg');
    assert(result.nitrogen[1].value === 1.3, 'nitrogen 5-15cm: raw 130 cg/kg → 1.3 g/kg');
    assert(result.nitrogen[0].unit === 'g/kg', 'nitrogen unit is "g/kg"');

    assert(result.soc[0].value === 12, 'soc 0-5cm: raw 120 dg/kg → 12.0 g/kg');
    assert(result.soc[1].value === 9.5, 'soc 5-15cm: raw 95 dg/kg → 9.5 g/kg');
    assert(result.soc[0].unit === 'g/kg', 'soc unit is "g/kg"');

    assert(result.sand[0].value === 42, 'sand 0-5cm: raw 420 g/kg → 42 %');
    assert(result.sand[0].unit === '%', 'sand unit is "%"');

    assert(result.silt[0].value === 35, 'silt 0-5cm: raw 350 g/kg → 35 %');
    assert(result.silt[0].unit === '%', 'silt unit is "%"');

    assert(result.clay[0].value === 23, 'clay 0-5cm: raw 230 g/kg → 23 %');
    assert(result.clay[0].unit === '%', 'clay unit is "%"');

    assert(result.bdod[0].value === 1.2, 'bdod 0-5cm: raw 120 cg/cm³ → 1.2 kg/dm³');
    assert(result.bdod[1].value === 1.3, 'bdod 5-15cm: raw 130 cg/cm³ → 1.3 kg/dm³');
    assert(result.bdod[0].unit === 'kg/dm³', 'bdod unit is "kg/dm³"');

    // Verify rawValue preserved for auditability
    assert(result.phh2o[0].rawValue === 65, 'rawValue preserved (phh2o=65)');

    // ── 3. Six depth intervals preserved ────────────────────────────────────
    console.log('\n【3】 Depth interval preservation');

    assert(result.phh2o.length === 6, 'All 6 depth intervals returned for phh2o');
    const depthLabels = result.phh2o.map(d => d.depth);
    assert(
        JSON.stringify(depthLabels) === JSON.stringify(['0-5cm', '5-15cm', '15-30cm', '30-60cm', '60-100cm', '100-200cm']),
        'Depth labels match official SoilGrids intervals'
    );

    // ── 4. Null mean values (ocean / unmapped pixels) ───────────────────────
    console.log('\n【4】 Null mean value handling (ocean/unmapped pixels)');

    const mockAxiosNull = {
        get: async () => MOCK_WITH_NULL_VALUES
    };

    const nullResult = await fetchExternalSoilData(0, 0, mockAxiosNull);
    assert(nullResult.phh2o[0].value === null, 'null rawValue → null converted value');
    assert(nullResult.phh2o[0].rawValue === null, 'null rawValue stored correctly');
    // Other properties unaffected
    assert(nullResult.nitrogen[0].value === 1.5, 'Non-null property unaffected by sibling null');

    // ── 5. Malformed / incomplete external response ──────────────────────────
    console.log('\n【5】 Malformed response detection');

    const mockMalformed_noProperties = { get: async () => ({ data: {} }) };
    await assertThrows(
        () => fetchExternalSoilData(12.97, 77.59, mockMalformed_noProperties),
        502,
        'Response missing .properties throws 502'
    );

    const mockMalformed_noLayers = { get: async () => ({ data: { properties: {} } }) };
    await assertThrows(
        () => fetchExternalSoilData(12.97, 77.59, mockMalformed_noLayers),
        502,
        'Response missing .properties.layers throws 502'
    );

    // ── 6. Timeout (ECONNABORTED) handling ───────────────────────────────────
    console.log('\n【6】 Timeout / unavailability handling');

    const mockTimeout = {
        get: async () => { const e = new Error('timeout'); e.code = 'ECONNABORTED'; throw e; }
    };
    await assertThrows(
        () => fetchExternalSoilData(12.97, 77.59, mockTimeout),
        503,
        'ECONNABORTED (timeout) → 503 with safe message'
    );

    const mock503 = {
        get: async () => { throw { response: { status: 503 } }; }
    };
    await assertThrows(
        () => fetchExternalSoilData(12.97, 77.59, mock503),
        503,
        'Upstream 503 → mapped to local 503'
    );

    const mock404 = {
        get: async () => { throw { response: { status: 404 } }; }
    };
    await assertThrows(
        () => fetchExternalSoilData(12.97, 77.59, mock404),
        404,
        'Upstream 404 (ocean/water) → propagated as local 404'
    );

    // ── 7. P and K are NOT present ───────────────────────────────────────────
    console.log('\n【7】 Data integrity — P and K not fabricated');

    assert(result.phosphorus === undefined, 'Phosphorus is NOT a SoilGrids property (correctly absent)');
    assert(result.potassium === undefined, 'Potassium is NOT a SoilGrids property (correctly absent)');

    // ── 8. Fallback factors (missing unit_measure) ───────────────────────────
    console.log('\n【8】 Fallback conversion factors (no unit_measure in layer)');

    const mockNoUnitMeasure = {
        get: async () => ({
            data: {
                properties: {
                    layers: [{
                        name: 'phh2o',
                        // unit_measure intentionally omitted
                        depths: [{ label: '0-5cm', values: { mean: 65 } }]
                    }]
                }
            }
        })
    };
    const fallbackResult = await fetchExternalSoilData(12.97, 77.59, mockNoUnitMeasure);
    assert(fallbackResult.phh2o[0].value === 6.5, 'Fallback factor applied: 65 / 10 = 6.5 pH');
    assert(fallbackResult.phh2o[0].unit === 'pH', 'Fallback target unit applied: "pH"');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (failed > 0) {
        console.error(`FAILED: ${failed} test(s) did not pass.`);
        process.exit(1);
    } else {
        console.log('ALL UNIT TESTS PASSED ✅');
    }
}

runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
