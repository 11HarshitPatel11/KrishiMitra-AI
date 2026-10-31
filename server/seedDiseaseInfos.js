import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DiseaseInformation from './src/models/diseaseInformation.model.js';

dotenv.config();

export const diseaseSeeds = [
    // -----------------------------------------------------------------------
    // APPLE (3 diseases)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Apple___Apple_scab",
        crop: "Apple",
        name: "Apple Scab",
        symptoms: [
            "Olive-green to black, velvety spots on leaves and fruit",
            "Severely infected leaves turn yellow and drop prematurely",
            "Infected fruit becomes distorted, cracked, and rough"
        ],
        causes: [
            "Fungal pathogen (Venturia inaequalis) surviving in fallen infected leaves over winter",
            "Spreads rapidly during wet spring weather with prolonged leaf moisture"
        ],
        prevention: [
            "Rake and destroy fallen leaves in autumn to reduce primary inoculum",
            "Prune trees to open the canopy for better air circulation and faster drying",
            "Plant scab-resistant apple cultivars (e.g., Liberty, Freedom, Enterprise)"
        ],
        management: [
            "Remove heavily infected material dynamically",
            "Follow locally approved horticultural management programs for persistent infections"
        ],
        sourceName: "Cornell Cooperative Extension / Penn State Extension",
        sourceUrl: "https://extension.psu.edu/apple-scab",
        limitations: "Early lesions can mimic frogeye leaf spot or sooty blotch; consult an extension specialist for laboratory confirmation."
    },
    {
        diseaseCode: "Apple___Black_rot",
        crop: "Apple",
        name: "Black Rot (Frogeye Leaf Spot)",
        symptoms: [
            "Circular purple spots on leaves expanding into 'frogeye' lesions with tan centers",
            "Concentric dark brown to black rot rings on fruit, turning into shriveled black mummies",
            "Depressed, reddish-brown cankers on branches and limbs"
        ],
        causes: [
            "Fungal pathogen (Botryosphaeria obtusa) overwintering in mummified fruit, dead wood, and cankers",
            "Dispersed by rain splash and wind during warm, humid weather"
        ],
        prevention: [
            "Prune out and destroy dead wood, cankers, and mummified apples during dormant pruning",
            "Maintain general orchard sanitation and avoid mechanical bark injuries",
            "Keep canopy open to promote sunlight penetration and air movement"
        ],
        management: [
            "Prune infected branches at least 6 to 8 inches below visible canker margins",
            "Sterilize pruning tools between cuts with 70% alcohol or 10% bleach solution"
        ],
        sourceName: "Ohio State University Extension / Penn State Extension",
        sourceUrl: "https://ohioline.osu.edu/factsheet/plpath-fru-47",
        limitations: "Leaf spots can be confused with chemical burn or cedar apple rust in early stages."
    },
    {
        diseaseCode: "Apple___Cedar_apple_rust",
        crop: "Apple",
        name: "Cedar Apple Rust",
        symptoms: [
            "Small, pale yellow spots on upper leaf surfaces turning bright orange-yellow",
            "Raised, tube-like fungal aecia structures forming on the underside of leaves",
            "Infected fruit displays small, firm, greenish-yellow to orange blemishes"
        ],
        causes: [
            "Heteroecious rust fungus (Gymnosporangium juniperi-virginianae) requiring both apple and eastern red cedar/juniper hosts",
            "Airborne basidiospores discharged from gelatinous cedar galls during warm spring rains"
        ],
        prevention: [
            "Remove eastern red cedar or juniper trees within 1-2 miles of commercial orchards where feasible",
            "Plant rust-resistant apple cultivars such as Liberty, Redfree, and Enterprise",
            "Inspect and prune brown cedar-apple galls from nearby ornamental junipers in winter"
        ],
        management: [
            "Rake and dispose of heavily infected fallen apple leaves",
            "Focus management on spring protection during the 4 to 6 weeks following bud break"
        ],
        sourceName: "University of Minnesota Extension",
        sourceUrl: "https://extension.umn.edu/plant-diseases/cedar-apple-rust",
        limitations: "Cannot spread from apple to apple; infection cycles require juniper alternate hosts."
    },

    // -----------------------------------------------------------------------
    // CHERRY (1 disease)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Cherry_(including_sour)___Powdery_mildew",
        crop: "Cherry",
        name: "Powdery Mildew",
        symptoms: [
            "White powdery fungal patches on new leaves, shoot tips, and developing fruit",
            "Infected leaves cup upward, crinkle, distort, and become brittle",
            "Immature cherries develop depressed circular blemishes and a white powdery coating"
        ],
        causes: [
            "Obligate fungal pathogen (Podosphaera clandestina) overwintering in canopy bark fissures",
            "Favored by high relative humidity, warm temperatures, and dense shaded canopies"
        ],
        prevention: [
            "Prune annually to maintain an open canopy that maximizes air movement and sunlight",
            "Avoid excessive nitrogen fertilization that produces dense, succulent vegetative flushes",
            "Eliminate wild seedlings and root suckers around the base of trees"
        ],
        management: [
            "Prune out infected terminal shoots during early summer scouting",
            "Apply approved horticultural mineral oils under local university extension guidance"
        ],
        sourceName: "Washington State University Extension / UC IPM",
        sourceUrl: "https://treefruit.wsu.edu/crop-protection/disease-management/cherry-powdery-mildew/",
        limitations: "Spores germinate under high relative humidity without needing free standing water."
    },

    // -----------------------------------------------------------------------
    // CORN / MAIZE (3 diseases)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        crop: "Corn (Maize)",
        name: "Gray Leaf Spot (Cercospora Leaf Spot)",
        symptoms: [
            "Small, tan rectangular lesions with distinct parallel borders bounded by leaf veins",
            "Lesions turn grayish to pale brown as fungal sporulation develops",
            "Severe blighting causes extensive foliar necrosis, premature leaf death, and stalk lodging"
        ],
        causes: [
            "Fungal pathogen (Cercospora zeae-maydis) overwintering in surface corn residue",
            "Spreads by wind and splashing rain during prolonged warm (75-85°F), humid periods with frequent dew"
        ],
        prevention: [
            "Select corn hybrids with high genetic tolerance or resistance to gray leaf spot",
            "Practice 1- to 2-year crop rotation with non-host crops (soybean, small grains)",
            "Manage crop residue with tillage where conservation goals permit"
        ],
        management: [
            "Scout fields routinely from V14 through flowering, especially on lower canopy leaves",
            "Ensure balanced soil potassium levels to improve natural plant defense"
        ],
        sourceName: "Purdue University Extension / Iowa State University Extension",
        sourceUrl: "https://extension.entm.purdue.edu/fieldcropsipm/diseases/gray-leaf-spot.php",
        limitations: "Early lesions can resemble Stewart's wilt or Diplodia leaf streak; scout whole plants."
    },
    {
        diseaseCode: "Corn_(maize)___Common_rust_",
        crop: "Corn (Maize)",
        name: "Common Rust",
        symptoms: [
            "Small, circular to elongate, cinnamon-brown pustules on both leaf surfaces",
            "Pustules rupture to reveal powdery spores",
            "Subsequent yellowing of the leaf and early dieback in severe cases"
        ],
        causes: [
            "Fungal spores (Puccinia sorghi) transported by wind over long distances from southern regions",
            "Favored by moderate temperatures (60-75°F) and high humidity/dew"
        ],
        prevention: [
            "Select and plant rust-resistant corn hybrids",
            "Plant early to try and outpace the arrival of spores mid-season"
        ],
        management: [
            "Monitor fields routinely; late infections often do not impact yield heavily",
            "Follow locally approved agricultural recommendations if severity is extremely high early in the season"
        ],
        sourceName: "University of Illinois Extension / Iowa State University Extension",
        sourceUrl: "https://cropprotectionnetwork.org/encyclopedia/common-rust-of-corn",
        limitations: "Can be confused with southern rust (Puccinia polysora), which forms smaller orange pustules primarily on upper surfaces."
    },
    {
        diseaseCode: "Corn_(maize)___Northern_Leaf_Blight",
        crop: "Corn (Maize)",
        name: "Northern Corn Leaf Blight",
        symptoms: [
            "Long, elliptical, cigar-shaped grayish-green to tan lesions (1 to 6 inches long)",
            "Dark, olive-gray fungal sporulation develops across lesions during damp weather",
            "Extensive leaf blighting reduces photosynthetic capacity and grain fill, increasing stalk rot"
        ],
        causes: [
            "Fungal pathogen (Exserohilum turcicum / Setosphaeria turcica) overwintering in corn residue",
            "Spreads via wind-blown spores and rain splash during moderate temperatures (65-80°F) and wet weather"
        ],
        prevention: [
            "Plant corn hybrids with qualitative (Ht genes) and quantitative multi-gene resistance",
            "Rotate out of corn for at least 1-2 seasons with non-hosts like soybeans or small grains",
            "Shred and incorporate crop residue post-harvest to accelerate microbial decomposition"
        ],
        management: [
            "Scout canopy weekly from whorl through silking; focus on ear leaves",
            "Avoid high plant densities that prolong canopy leaf wetness"
        ],
        sourceName: "Purdue University Extension / Penn State Extension",
        sourceUrl: "https://extension.psu.edu/northern-corn-leaf-blight",
        limitations: "Lesions on young plants can resemble Stewart's bacterial wilt; check for vascular streaming."
    },

    // -----------------------------------------------------------------------
    // GRAPE (3 diseases)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Grape___Black_rot",
        crop: "Grape",
        name: "Black Rot",
        symptoms: [
            "Small reddish-brown circular spots on young leaves with dark margins and tiny black pycnidia specks",
            "Berries develop soft brownish spots that rapidly shrivel into hard, black, wrinkled mummies",
            "Black elongated lesions on shoots, petioles, and cluster stems"
        ],
        causes: [
            "Fungal pathogen (Phyllosticta ampelicida / Guignardia bidwellii) overwintering in vine mummies and cankers",
            "Ascospores and conidia released during warm spring rains require leaf wetness to infect"
        ],
        prevention: [
            "Prune off all mummified grape clusters during winter and destroy or bury them",
            "Trellis and canopy prune vines to maximize sunlight exposure and rapid leaf drying",
            "Control vineyard weeds to lower canopy relative humidity"
        ],
        management: [
            "Prune out infected shoots during early season vineyard maintenance",
            "Prioritize preventative management from early bloom through 4 weeks post-bloom"
        ],
        sourceName: "Ohio State University Extension / Cornell Cooperative Extension",
        sourceUrl: "https://ohioline.osu.edu/factsheet/plpath-fru-24",
        limitations: "Berries become naturally resistant 4-5 weeks after bloom; focus sanitation early."
    },
    {
        diseaseCode: "Grape___Esca_(Black_Measles)",
        crop: "Grape",
        name: "Esca (Black Measles)",
        symptoms: [
            "'Tiger-stripe' chlorosis and necrosis between leaf veins appearing mid-to-late summer",
            "Small dark purple or black spots ('measles') on developing fruit with skin cracking",
            "Internal cross-sections of cordons or trunks display dark vascular streaking and white spongy wood rot"
        ],
        causes: [
            "Complex of fungal trunk pathogens (Phaeomoniella chlamydospora, Phaeoacremonium minimum, Fomitiporia)",
            "Spores enter through pruning wounds and slowly colonize vascular xylem tissues over multiple seasons"
        ],
        prevention: [
            "Delay annual pruning until late winter to accelerate wound healing and avoid peak spore discharge",
            "Apply protective wound sealants or biological pastes to large pruning cuts",
            "Source certified pathogen-free vine planting stock from reputable nurseries"
        ],
        management: [
            "Mark symptomatic vines in summer for separate winter pruning to prevent mechanical spore transfer",
            "Retrain healthy suckers from below cankers or perform trunk renewal surgery"
        ],
        sourceName: "University of California IPM",
        sourceUrl: "https://ipm.ucanr.edu/agriculture/grape/esca-black-measles/",
        limitations: "Chronic multi-year trunk disease; foliar symptoms may vary from season to season depending on vine stress."
    },
    {
        diseaseCode: "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        crop: "Grape",
        name: "Leaf Blight (Isariopsis Leaf Spot / Pseudocercospora Leaf Spot)",
        symptoms: [
            "Irregular, angular reddish-brown to dark brown necrotic lesions on older leaves",
            "Faint olivaceous, velvety spore tufts visible on the undersides of lesions",
            "Extensive leaf yellowing and premature defoliation occurring in late summer and autumn"
        ],
        causes: [
            "Fungal pathogen (Pseudocercospora vitis / Phaeoisariopsis vitis) surviving on dead fallen leaves",
            "Favored by warm humid conditions and frequent late-season rains"
        ],
        prevention: [
            "Prune and shoot-position vine canopies to promote maximum airflow",
            "Incorporate or remove fallen leaves post-harvest to reduce overwintering spore loads",
            "Maintain balanced vine nutrition and avoid dense vegetative overgrowth"
        ],
        management: [
            "Remove senescent lower leaves around cluster zones post-veraison to improve air movement",
            "Maintain vine vigor to prevent premature leaf loss from depleting winter root reserves"
        ],
        sourceName: "University of Florida Extension (EDIS) / Texas A&M AgriLife Extension",
        sourceUrl: "https://edis.ifas.ufl.edu/publication/HS100",
        limitations: "Typically develops late in the season; often of minor economic impact unless early defoliation impairs vine cold-hardiness."
    },

    // -----------------------------------------------------------------------
    // ORANGE / CITRUS (1 disease)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Orange___Haunglongbing_(Citrus_greening)",
        crop: "Orange",
        name: "Huanglongbing (Citrus Greening)",
        symptoms: [
            "Asymmetrical blotchy mottled yellowing across leaf veins (distinct from symmetrical nutritional chlorosis)",
            "Small, lopsided, bitter, and hard fruit that remains partially green at the stylar end",
            "Yellow shoot flushes, twig dieback, root decay, stunted growth, and heavy fruit drop"
        ],
        causes: [
            "Phloem-restricted bacterium (Candidatus Liberibacter asiaticus) vectored by Asian citrus psyllid (Diaphorina citri)",
            "Also transmitted via grafting with infected budwood"
        ],
        prevention: [
            "Plant only certified disease-free nursery trees from licensed insect-proof propagation facilities",
            "Strictly observe agricultural citrus quarantine rules; do not transport citrus plant material across quarantine boundaries",
            "Monitor and suppress Asian citrus psyllid populations using yellow sticky traps and extension-approved IPM programs"
        ],
        management: [
            "Promptly remove (cull) confirmed infected trees to eliminate inoculum reservoirs for surrounding groves",
            "Support surviving trees with enhanced balanced foliar and root nutrition under extension supervision"
        ],
        sourceName: "USDA APHIS / University of Florida IFAS Extension",
        sourceUrl: "https://www.aphis.usda.gov/plant-pests-diseases/citrus-diseases/citrus-greening",
        limitations: "Incurable systemic bacterial disease; regulatory laboratory PCR confirmation is necessary for formal diagnosis."
    },

    // -----------------------------------------------------------------------
    // PEACH (1 disease)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Peach___Bacterial_spot",
        crop: "Peach",
        name: "Bacterial Spot",
        symptoms: [
            "Small, angular, water-soaked spots on leaves turning purple-black with dead tissue falling out ('shot-hole')",
            "Severe yellowing of affected leaves leading to early summer defoliation",
            "Sunken, dark, pitted spots and gumming cracks on peach fruit skin"
        ],
        causes: [
            "Bacterial pathogen (Xanthomonas arboricola pv. pruni) overwintering in twig cankers and bud scales",
            "Disseminated by blowing rain and dew during warm, wet spring weather; exacerbated by sandy blowing soils"
        ],
        prevention: [
            "Select and plant peach cultivars with high bacterial spot tolerance adapted to local regions",
            "Establish windbreaks in sandy orchards to reduce abrasive wind-blown grit that damages leaf cuticles",
            "Avoid overhead irrigation and excessive high-nitrogen fertilization"
        ],
        management: [
            "Prune out blighted twigs and dead cankered wood during dormant pruning",
            "Apply protective dormant copper sprays at leaf fall and bud swell under local extension guidelines"
        ],
        sourceName: "Clemson University Cooperative Extension / North Carolina State Extension",
        sourceUrl: "https://hgic.clemson.edu/factsheet/peach-diseases/",
        limitations: "Foliar shot-holes can be confused with nitrogen deficiency, peach scab, or copper phytotoxicity."
    },

    // -----------------------------------------------------------------------
    // PEPPER (1 disease)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Pepper,_bell___Bacterial_spot",
        crop: "Bell Pepper",
        name: "Bacterial Spot",
        symptoms: [
            "Small, circular to irregular water-soaked spots on leaf undersides, turning dark brown with yellow halos",
            "Heavy leaf drop exposing developing peppers to sunscald",
            "Rough, raised, blister-like circular warts and scabs on fruit surfaces"
        ],
        causes: [
            "Bacterial pathogens (Xanthomonas euvesicatoria, Xanthomonas vesicatoria) carried on seed and crop residue",
            "Spreads rapidly through rain splash, overhead watering, and handling wet plants"
        ],
        prevention: [
            "Use certified pathogen-free, hot-water treated seed and disease-free transplants",
            "Plant resistant bell pepper varieties matching prevalent local bacterial races",
            "Implement a 2- to 3-year crop rotation away from solanaceous plants (peppers, tomatoes, eggplants)"
        ],
        management: [
            "Never cultivate or harvest in pepper fields while foliage is wet with rain or morning dew",
            "Incorporate or destroy crop debris immediately following harvest to speed bacterial breakdown"
        ],
        sourceName: "University of Florida IFAS Extension / Cornell Cooperative Extension",
        sourceUrl: "https://edis.ifas.ufl.edu/publication/VH056",
        limitations: "Systemic bacterial infection; cannot be cured once inside leaves. Control relies entirely on prevention."
    },

    // -----------------------------------------------------------------------
    // POTATO (2 diseases)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Potato___Early_blight",
        crop: "Potato",
        name: "Early Blight",
        symptoms: [
            "Dark brown to black spots with distinct concentric rings ('target board') on older, lower leaves",
            "Yellowing tissue surrounding lesions causes premature leaf desiccation and defoliation",
            "Tubers develop sunken, dark, irregular, leathery lesions with brown corky rot underneath"
        ],
        causes: [
            "Fungal pathogen (Alternaria solani) overwintering in infected crop debris, tubers, and solanaceous weeds",
            "Favored by warm temperatures (75-85°F), alternating wet/dry cycles, and plant maturity or nutrient stress"
        ],
        prevention: [
            "Plant certified, disease-free seed tubers",
            "Rotate fields out of solanaceous crops for at least 2 to 3 years",
            "Maintain balanced soil nitrogen and potassium fertility to avoid premature vine senescence"
        ],
        management: [
            "Irrigate early in the morning so foliage dries quickly before nightfall",
            "Cure harvested tubers at 50-55°F with high humidity for 10-14 days to heal wounds before cold storage"
        ],
        sourceName: "North Dakota State University Extension / University of Wisconsin Extension",
        sourceUrl: "https://www.ag.ndsu.edu/publications/crops/early-blight-in-potato",
        limitations: "Often attacks senescent lower leaves late in the season; concentric rings distinguish from Late Blight."
    },
    {
        diseaseCode: "Potato___Late_blight",
        crop: "Potato",
        name: "Late Blight",
        symptoms: [
            "Large, irregular water-soaked lesions on leaves rapidly expanding into dark brown to purplish-black blighted areas",
            "White fungal-like cottony sporulation visible on the underside of leaves at lesion edges in moist weather",
            "Tubers develop dry, granular, reddish-brown superficial rot penetrating irregularly into the flesh"
        ],
        causes: [
            "Destructive oomycete pathogen (Phytophthora infestans) surviving in infected seed tubers, cull piles, and volunteer potatoes",
            "Dispersed over miles by wind and rain under cool (60-70°F), damp, foggy, or rainy conditions"
        ],
        prevention: [
            "Plant only certified disease-free seed potatoes; cull out any suspect rotten seed pieces before planting",
            "Destroy all potato cull piles, rock piles, and volunteer potato sprouts before spring emergence",
            "Eliminate nightshade weeds that serve as alternate wild reservoirs"
        ],
        management: [
            "Immediately destroy and bag isolated infected vines to prevent field-wide spore dispersal",
            "Desiccate (kill) potato vines completely at least 2 weeks before harvest to prevent tuber infection during digging"
        ],
        sourceName: "Oregon State University Extension / Cornell Cooperative Extension",
        sourceUrl: "https://extension.oregonstate.edu/crop-production/potatoes/late-blight-management",
        limitations: "High-consequence disease; can devastate whole fields in days under wet weather. Contact local extension immediately."
    },

    // -----------------------------------------------------------------------
    // SQUASH (1 disease)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Squash___Powdery_mildew",
        crop: "Squash",
        name: "Powdery Mildew",
        symptoms: [
            "White, talcum powder-like fungal spots expanding across upper and lower surfaces of leaves and stems",
            "Infected leaves turn chlorotic, senesce prematurely, turn brown, and become dry and papery",
            "Premature defoliation leads to fruit sunscald, poor sugar content, and reduced harvest yields"
        ],
        causes: [
            "Fungal pathogens (Podosphaera xanthii / Erysiphe cichoracearum) producing airborne conidia",
            "Favored by dense shaded plant canopies, high humidity, and moderate temperatures (68-80°F)"
        ],
        prevention: [
            "Select and plant powdery mildew-resistant squash and pumpkin cultivars",
            "Space plants generously to promote sunlight penetration and air movement",
            "Plant in full sun locations and maintain weed control around the perimeter"
        ],
        management: [
            "Scout weekly starting at vine run, inspecting lower and inner canopy leaves first",
            "Remove severely blighted early foliage to slow disease spread across the patch"
        ],
        sourceName: "University of Minnesota Extension / Cornell Vegetable MD Online",
        sourceUrl: "https://extension.umn.edu/disease-management/powdery-mildew-cucurbits",
        limitations: "Distinct from downy mildew, which produces angular yellow patches constrained by leaf veins on the upper surface."
    },

    // -----------------------------------------------------------------------
    // STRAWBERRY (1 disease)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Strawberry___Leaf_scorch",
        crop: "Strawberry",
        name: "Leaf Scorch",
        symptoms: [
            "Numerous small, irregular purple to dark purplish-brown spots on upper leaf surfaces (lacking white centers)",
            "Spots coalesce as they mature, giving leaves a scorched, burnt reddish-brown appearance",
            "Leaf margins curl upward and wither; lesions may also girdle petioles and fruit pedicels"
        ],
        causes: [
            "Fungal pathogen (Diplocarpon earlianum) overwintering on green living leaves and dead strawberry foliage",
            "Conidia spread by splashing rain and irrigation during warm (65-80°F), wet spring periods"
        ],
        prevention: [
            "Plant certified disease-free strawberry crowns from reliable nurseries",
            "Select resistant cultivars and establish plantings in well-drained sunny sites with adequate row spacing",
            "Use drip irrigation rather than overhead sprinklers to prevent prolonged leaf wetness"
        ],
        management: [
            "Perform post-harvest renovation: mow and destroy old strawberry foliage in June-bearing beds",
            "Keep strawberry rows weeded to facilitate rapid leaf drying after rain"
        ],
        sourceName: "North Carolina State University Extension / Ohio State University Extension",
        sourceUrl: "https://content.ces.ncsu.edu/strawberry-leaf-scorch",
        limitations: "Differentiated from Common Leaf Spot (Mycosphaerella fragariae) because scorch spots never develop gray/white necrotic centers."
    },

    // -----------------------------------------------------------------------
    // TOMATO (9 diseases)
    // -----------------------------------------------------------------------
    {
        diseaseCode: "Tomato___Bacterial_spot",
        crop: "Tomato",
        name: "Bacterial Spot",
        symptoms: [
            "Small, water-soaked circular to angular dark brown spots on leaves, often surrounded by yellow halos",
            "Centers of older leaf spots tear and drop out, creating a ragged appearance",
            "Severe defoliation exposes fruit to sunscald; green fruit displays small, raised, black blister-like scabs"
        ],
        causes: [
            "Bacterial pathogens (Xanthomonas perforans, Xanthomonas vesicatoria) surviving in seed and solanaceous weed hosts",
            "Spreads rapidly via splashing rain, overhead irrigation, and handling wet plants"
        ],
        prevention: [
            "Plant certified pathogen-free, hot-water treated seed and clean transplants",
            "Use drip irrigation to keep foliage completely dry; avoid working in fields when plants are wet",
            "Implement a minimum 2-year crop rotation away from tomatoes, peppers, and eggplants"
        ],
        management: [
            "Disinfect stakes, cages, and tools between seasons with 10% bleach solution",
            "Plow under or remove crop residue immediately following final harvest"
        ],
        sourceName: "Penn State Extension / University of Florida IFAS Extension",
        sourceUrl: "https://extension.psu.edu/bacterial-spot-of-tomato",
        limitations: "Visual symptoms closely mimic bacterial speck (Pseudomonas syringae); laboratory testing confirms specific bacterium."
    },
    {
        diseaseCode: "Tomato___Early_blight",
        crop: "Tomato",
        name: "Early Blight",
        symptoms: [
            "Small, dark, necrotic lesions on older leaves",
            "Concentric rings resembling a target within spots",
            "Yellowing of tissue surrounding the spots",
            "Premature defoliation of lower leaves"
        ],
        causes: [
            "Fungal pathogen (Alternaria solani) initially infecting lower leaves",
            "Thrives in warm temperatures combined with high humidity",
            "Survives winter in infected plant debris in the soil"
        ],
        prevention: [
            "Rotate crops regularly (avoid planting tomatoes in same soil consecutive years)",
            "Ensure adequate spacing between plants for airflow",
            "Water at the base of the plant avoiding leaf wetness",
            "Keep the garden weed-free to improve air circulation"
        ],
        management: [
            "Remove and destroy heavily affected lower leaves immediately",
            "Apply mulch to prevent soil splashing onto bottom leaves",
            "Follow locally approved agricultural recommendations if disease progresses"
        ],
        sourceName: "Cornell Cooperative Extension / University of Maryland Extension",
        sourceUrl: "https://extension.umd.edu/resource/early-blight-tomatoes",
        limitations: "Target-ring lesions distinguish early blight from Septoria leaf spot and bacterial spot."
    },
    {
        diseaseCode: "Tomato___Late_blight",
        crop: "Tomato",
        name: "Late Blight",
        symptoms: [
            "Large, irregularly shaped, water-soaked spots on leaves",
            "White fungal growth on the underside of leaves during humid weather",
            "Dark, firm, and greasy lesions on fruit"
        ],
        causes: [
            "Oomycete pathogen (Phytophthora infestans) that spreads rapidly in cool, wet weather",
            "Wind-driven rain disperses spores efficiently"
        ],
        prevention: [
            "Plant resistant tomato varieties if available locally",
            "Avoid overhead watering; use drip irrigation",
            "Stake or cage plants to keep foliage off the ground"
        ],
        management: [
            "Remove entirely infected plants immediately and destroy them",
            "Do not compost infected plant material",
            "Ensure extensive sanitation of any tools used around affected plants"
        ],
        sourceName: "Cornell Cooperative Extension / University of Minnesota Extension",
        sourceUrl: "https://extension.umn.edu/disease-management/late-blight",
        limitations: "High-virulence organism capable of destroying healthy tomato plantings within a week under prolonged wet conditions."
    },
    {
        diseaseCode: "Tomato___Leaf_Mold",
        crop: "Tomato",
        name: "Leaf Mold",
        symptoms: [
            "Pale green to yellowish spots with indefinite margins on the upper leaf surface",
            "Olive-green to brown velvety fungal sporulation on the corresponding lower leaf surface",
            "Older lower leaves curl, wither, turn reddish-brown, and drop prematurely"
        ],
        causes: [
            "Fungal pathogen (Passalora fulva / Cladosporium fulvum) common in high tunnels and greenhouses",
            "Favored by prolonged relative humidity above 85% and temperatures between 70°F and 75°F"
        ],
        prevention: [
            "Maximize greenhouse or high-tunnel ventilation with exhaust fans and open sidewalls",
            "Space plants generously, prune lower suckers, and water only via root-level drip irrigation",
            "Select tomato varieties bred with genetic resistance to leaf mold races"
        ],
        management: [
            "Prune out symptomatic lower leaves at first detection to facilitate canopy drying",
            "Steam or sanitize greenhouse framing and trellis materials between crop cycles"
        ],
        sourceName: "University of Minnesota Extension / Missouri Botanical Garden",
        sourceUrl: "https://extension.umn.edu/disease-management/tomato-leaf-mold",
        limitations: "Primarily causes foliar defoliation; rarely attacks fruit directly unless humidity remains continuously saturating."
    },
    {
        diseaseCode: "Tomato___Septoria_leaf_spot",
        crop: "Tomato",
        name: "Septoria Leaf Spot",
        symptoms: [
            "Numerous small circular spots (1/16 to 1/8 inch) with dark brown margins and tan or light gray centers",
            "Tiny black speck-like pycnidia fruiting bodies visible inside lesion centers under magnification",
            "Leaves turn yellow, wither, and drop progressively from the bottom of the plant upward"
        ],
        causes: [
            "Fungal pathogen (Septoria lycopersici) overwintering in tomato debris, stakes, and horsenettle weeds",
            "Spores spread through rain splash, overhead watering, and equipment movement"
        ],
        prevention: [
            "Rotate crops for at least 2 to 3 years away from solanaceous plants",
            "Stake or cage plants and prune lower leaves to keep foliage off bare ground",
            "Apply mulch beneath plants to form a barrier against rain-splashed soil spores"
        ],
        management: [
            "Remove infected lower leaves promptly upon early detection; do not compost diseased leaves",
            "Disinfect tomato stakes, cages, and tools with 10% bleach solution between seasons"
        ],
        sourceName: "Missouri Botanical Garden / Penn State Extension",
        sourceUrl: "https://extension.psu.edu/septoria-leaf-spot-on-tomato",
        limitations: "Does not directly infect fruit, but heavy defoliation exposes fruit to sunscald and reduces yield."
    },
    {
        diseaseCode: "Tomato___Spider_mites Two-spotted_spider_mite",
        crop: "Tomato",
        name: "Two-Spotted Spider Mite",
        symptoms: [
            "Fine pale yellow, white, or stippled specks on the upper surfaces of leaves",
            "Silky delicate webbing visible on leaf undersides, leaf axils, and growing tips",
            "Leaves turn bronze or yellow, dry up, and drop; plants become stunted and unthrifty"
        ],
        causes: [
            "Microscopic arachnid pests (Tetranychus urticae) puncturing plant cells and sucking plant juices",
            "Population explodes during hot (>85°F), dry, dusty conditions and water-stressed plants"
        ],
        prevention: [
            "Maintain adequate irrigation; avoid drought stress which makes plants attractive to mites",
            "Control dust along farm paths with ground cover or water suppression",
            "Preserve beneficial natural predators (predatory mites, lady beetles, minute pirate bugs)"
        ],
        management: [
            "Rinse light mite colonies with strong water sprays directed at leaf undersides",
            "Apply horticultural insecticidal soaps or neem oil during early morning or evening"
        ],
        sourceName: "University of California IPM / University of Florida IFAS Extension",
        sourceUrl: "https://ipm.ucanr.edu/agriculture/tomato/spider-mites/",
        limitations: "Pest infestation rather than pathogen; verify crawling mites on leaf undersides with a 10x hand lens."
    },
    {
        diseaseCode: "Tomato___Target_Spot",
        crop: "Tomato",
        name: "Target Spot",
        symptoms: [
            "Small, pinpoint water-soaked spots on leaves expanding into circular brown lesions up to 1/2 inch",
            "Mature lesions exhibit dark brown margins with pale brown centers showing faint concentric rings",
            "Fruit lesions begin as small, sunken, circular brown pits, expanding into crater-like cracks"
        ],
        causes: [
            "Fungal pathogen (Corynespora cassiicola) surviving in crop debris, alternate hosts, and weeds",
            "Favored by warm temperatures (68-82°F) and extended periods of high humidity or free moisture"
        ],
        prevention: [
            "Practice crop rotation away from tomatoes, peppers, and cucurbits for at least 1-2 years",
            "Space plants generously to promote rapid foliar drying and good air movement",
            "Avoid excessive nitrogen fertilization that creates dense, humid canopy microclimates"
        ],
        management: [
            "Prune lower suckers and leaves to increase airflow within the plant canopy",
            "Remove and destroy severely blighted plants and unmarketable diseased fruit"
        ],
        sourceName: "University of Florida IFAS Extension",
        sourceUrl: "https://edis.ifas.ufl.edu/publication/PP316",
        limitations: "Foliar symptoms can closely resemble early blight; fruit symptoms differ with deeply cratered pits."
    },
    {
        diseaseCode: "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
        crop: "Tomato",
        name: "Tomato Yellow Leaf Curl Virus (TYLCV)",
        symptoms: [
            "Upward curling, cupping, and crinkling of leaf margins on young terminal growth",
            "Noticeable interveinal chlorosis and reduced leaf blade surface area",
            "Severe plant stunting, bushy erect appearance, flower abortion, and drastic fruit loss"
        ],
        causes: [
            "Begomovirus transmitted exclusively by the sweetpotato / silverleaf whitefly (Bemisia tabaci)",
            "Not transmitted mechanically by hands/tools, and not seed-borne"
        ],
        prevention: [
            "Plant certified TYLCV-resistant tomato cultivars (e.g., Tygress, Charger, Invictus)",
            "Use 50-mesh whitefly-exclusion netting on nursery and greenhouse structures",
            "Deploy yellow sticky cards to monitor whitefly populations and rogue early-season infections"
        ],
        management: [
            "Immediately rogue (uproot) and destroy infected plants in sealed bags early in the season",
            "Manage whitefly vectors with insecticidal soaps, oils, or approved regional IPM methods"
        ],
        sourceName: "University of Florida IFAS Extension / Texas A&M AgriLife Extension",
        sourceUrl: "https://edis.ifas.ufl.edu/publication/IN682",
        limitations: "Incurable viral infection; once systemic, infected plants cannot be treated and must be culled."
    },
    {
        diseaseCode: "Tomato___Tomato_mosaic_virus",
        crop: "Tomato",
        name: "Tomato Mosaic Virus (ToMV)",
        symptoms: [
            "Mottled light and dark green mosaic patterns on foliage",
            "Leaves may be distorted, puckered, blistered, or narrow ('shoestring' / 'fern-leaf')",
            "Stunted plant growth, uneven fruit ripening, and brown internal necrosis within fruit walls"
        ],
        causes: [
            "Extremely durable Tobamovirus transmitted mechanically via hands, tools, grafting, and plant contact",
            "Can persist for years in dry plant debris, root residue in soil, and on contaminated seed coats"
        ],
        prevention: [
            "Plant certified virus-free seed or resistant varieties labeled with 'ToMV' or 'T'",
            "Wash hands thoroughly with soap and water before handling plants; sanitize pruning tools with 20% nonfat milk solution",
            "Prohibit tobacco use near tomatoes, as tobacco products can harbor mosaic viruses"
        ],
        management: [
            "Immediately rogue and dispose of infected plants; do not compost infected material",
            "Avoid handling healthy tomato plants immediately after touching suspected virus-infected plants"
        ],
        sourceName: "University of Massachusetts Amherst Extension / Cornell Vegetable MD Online",
        sourceUrl: "https://nevegetable.org/crops/diseases/tomato-mosaic-virus-tomv",
        limitations: "Extremely resilient mechanical virus with no chemical cure; strict sanitation and resistant cultivars are essential."
    }
];

export const seedDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crop_db');
        console.log('Connected to database.');

        console.log(`Executing idempotent seed for ${diseaseSeeds.length} verified disease profiles...`);

        let insertedCount = 0;
        let updatedCount = 0;

        for (const data of diseaseSeeds) {
            const result = await DiseaseInformation.findOneAndUpdate(
                { diseaseCode: data.diseaseCode },
                { $set: data },
                { upsert: true, new: true, runValidators: true }
            );

            if (result) {
                console.log(`  ✓ Synced: [${data.diseaseCode}] - ${data.name} (${data.crop})`);
                updatedCount++;
            }
        }

        console.log(`\nIdempotent seed completed: ${updatedCount} records synchronized.`);
        console.log('Unrelated collections and unverified classes were strictly untouched.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed disease info:', err);
        process.exit(1);
    }
};

// If executed directly from command line, run seed
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    seedDB();
}
