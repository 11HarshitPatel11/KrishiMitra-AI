# KrishiMitra AI — Farmer User Manual
## कृषि मित्र एआई — किसान उपयोगकर्ता मार्गदर्शिका

A practical, step-by-step bilingual operational manual for farmers, agronomists, and agricultural extension workers using the KrishiMitra AI platform.

---

# English Section

## 1. Getting Started & Account Registration

### Step 1.1: Accessing the Application
Open your smartphone or computer web browser (Google Chrome, Mozilla Firefox, or Microsoft Edge) and navigate to the application address:
```
http://localhost:3000
```

### Step 1.2: Registering a New Farmer Account
1. On the landing page, click the green **"Register"** or **"Get Started"** button in the top navigation bar.
2. Fill in your details:
   * **Full Name:** Enter your name (e.g., `Harshit Patel`).
   * **Email Address:** Enter a valid email address (e.g., `farmer@example.com`).
   * **Password:** Choose a secure password of at least 6 characters.
   * **Mobile Number (Optional):** Enter your 10-digit mobile number.
   * **Regional Location (Optional):** Enter your district or state.
3. Click **"Create Account"**. Upon success, you will be redirected to the Login page.

### Step 1.3: Logging In
1. Enter your registered email address and password.
2. Click **"Sign In"**. You will receive an authenticated session and land on the main **Crop Advisor** dashboard.

---

## 2. Managing Your Farm Holdings

### Step 2.1: Registering a Farm Parcel
1. Click **"Farm Management"** in the top navigation bar.
2. Click the **"+ Add New Farm"** button.
3. Provide the parcel information:
   * **Farm Name:** Give your land a recognizable name (e.g., `Pehla Farm`, `North Field`).
   * **Land Area & Unit:** Enter the size (e.g., `5.0`) and select `Acre` or `Hectare`.
   * **Soil Nutrients (N, P, K, pH):** Enter your baseline soil test numbers:
     * *Nitrogen (N):* e.g., `90`
     * *Phosphorus (P):* e.g., `42`
     * *Potassium (K):* e.g., `43`
     * *pH Level:* e.g., `6.5` (neutral soil is 6.5–7.5).
4. Click **"Save Farm"**.

### Step 2.2: Capturing GPS Location
1. In the Farm form, find the **Farm Coordinates & Location** card.
2. Click the **"📍 Use My Current Location"** button.
3. When your browser asks for permission (*"Allow KrishiMitra to access your location?"*), click **"Allow"**.
4. The system will automatically retrieve your exact GPS Latitude and Longitude.
5. KrishiMitra will auto-resolve your village, district, and state using satellite reverse-geocoding.
6. *Note:* GPS is completely optional. If you do not have GPS or internet access in the field, you can type coordinates manually or leave them blank.

---

## 3. Managing Soil Health & SoilGrids Synchronization

1. In the navigation bar, click **"Soil Info"**.
2. Select your registered farm from the dropdown parcel selector.
3. **Manual Soil Record:**
   * Enter your latest soil laboratory test values (Soil Type, pH, N, P, K, Moisture, Notes).
   * Click **"Save Soil Record"**.
4. **ISRIC SoilGrids Satellite Synchronization:**
   * Under the **External Soil Information** card, click **"Sync from SoilGrids"**.
   * The system will retrieve 7 scientific soil layers (pH in water, Total Nitrogen, Soil Organic Carbon, Sand, Silt, Clay, and Bulk Density) across 6 depth horizons (`0-5cm` to `100-200cm`).
   * *Offline / Slow Network Protection:* If the international server experiences delays, KrishiMitra automatically loads a scientifically calibrated regional baseline for your coordinates.

---

## 4. Getting AI Crop Recommendations

1. Click **"AI Recommendation"** (or **"Crop Advisor"**) in the top navbar.
2. **Autocomplete from Farm (Recommended):**
   * Select your farm from the **"Autocomplete from Registered Farm"** dropdown. Your Nitrogen, Phosphorus, Potassium, and pH will populate automatically!
3. **Fetch Real-Time Weather:**
   * Click the blue **"Get Weather"** button.
   * KrishiMitra connects to satellite weather stations to retrieve your current temperature (°C) and relative humidity (%).
4. **Enter Expected Rainfall:**
   * In the **Rainfall (mm)** box, enter your anticipated rainfall for the upcoming growing season (e.g., `200` to `1000` mm depending on your monsoon zone).
5. **Generate Recommendations:**
   * Click the green button **"Find Suitable Crops →"**.
   * The platform evaluates your soil nutrients, real-time weather, crop rotation history, and mandi market prices.
6. **Understanding Results:**
   * **🥇 Top Match:** Highest overall recommendation score.
   * **Environmental Suitability (%):** How well your soil and climate match the crop.
   * **Recommendation Score:** Composite score factoring in market price and rotation penalties.
   * **Crop Rotation Badge:** Displays *"Standard Rotation"* or warns if a *"Rotation Penalty"* was applied due to repeating the same crop.
   * *Notice:* Only crops with positive, viable probabilities are displayed. Crops with 0.0% suitability are strictly filtered out.

---

## 5. Diagnosing Plant Diseases from Leaf Photographs

1. Click **"Disease Detection"** in the navigation bar.
2. **Taking the Leaf Photograph:**
   * Use your mobile phone camera to take a clear, well-lit close-up photograph of a single symptomatic leaf.
   * Avoid strong shadows, blurs, or including multiple unrelated plants in the background.
3. **Uploading the Image:**
   * Click the upload card or drag-and-drop your image (`.jpg`, `.jpeg`, `.png`, or `.webp` up to 5 MB).
   * You will see a preview of the leaf photograph.
4. Click **"Diagnose Leaf Disease"**.
5. **Interpreting Results:**
   * **Status: Confident (High Certainty):** The deep learning model identified the disease with $\ge 70\%$ confidence. The system displays:
     * Affected Crop & Disease Name.
     * Diagnostic Symptoms.
     * Causal Organism (Fungal, Bacterial, Viral).
     * Cultural & Bio-control Prevention Methods.
     * University-Extension-Verified Chemical Management Protocols.
   * **Status: Uncertain (Low Certainty):** The model confidence is below 70%. The system will **safely withhold chemical pesticide advice** to prevent crop damage and advise you to retake the photo in better lighting.

---

## 6. Checking Mandi Market Prices & Commodity Intelligence

1. Click **"Market Price"** in the navigation bar.
2. Select your **State** (e.g., `Madhya Pradesh`) and **District** (e.g., `Indore`).
3. Click **"Search Prices"**.
4. **Market Intelligence Features:**
   * **Modal Price:** Current benchmark price per quintal (100 kg).
   * **Freshness Indicator:** Green badge indicates fresh mandi reports within the last 7 days.
   * **Price Trend:** Indicates whether the commodity price is *Rising*, *Falling*, or *Stable*.
   * **Demand Signal:** Indicates whether market arrival activity reflects *High*, *Moderate*, or *Low* buyer demand.

---

## 7. Tracking Historical Crop Rotations

1. Click **"Crop History"** in the navigation bar.
2. Select your farm parcel.
3. Click **"+ Add Crop History"**.
4. Enter the crop grown (e.g., `Rice`, `Wheat`, `Chickpea`), the agricultural season (`Kharif`, `Rabi`, `Zaid`), and harvest year.
5. Click **"Save Record"**.
6. KrishiMitra uses this timeline to protect your soil health by automatically discouraging repetitive monoculture.

---

## 8. Switching Application Language to Hindi

1. Look at the top right of the navigation bar.
2. Click the language dropdown showing **"🌐 English"**.
3. Select **"हिंदी"**.
4. The entire application (buttons, forms, headings, disease reports, and market labels) will instantly switch to natural, easy-to-read Hindi without reloading the page.
5. Your choice is automatically saved on your phone or computer.

---

## 9. Important Advisory Notice for All Farmers

> [!IMPORTANT]
> **Advisory Disclaimer:** KrishiMitra AI is an intelligent computer decision-support tool designed to provide data-driven agronomic guidance. Predictions are generated using mathematical statistical distributions and photographic pattern recognition.
> 
> **Never spray hazardous chemical pesticides without consulting your local Krishi Vigyan Kendra (KVK), Block Agricultural Extension Officer, or State Agricultural University specialist.** Always read and follow chemical product labels regarding dosages, pre-harvest intervals (PHI), and safety gear.

---
---

# हिंदी खंड (Hindi Section)

## 1. शुरुआत करना और खाता पंजीकरण

### कदम 1.1: एप्लिकेशन खोलना
अपने मोबाइल फोन या कंप्यूटर के ब्राउज़र (गूगल क्रोम या मोज़िला फ़ायरफ़ॉक्स) में यह पता खोलें:
```
http://localhost:3000
```

### कदम 1.2: नया किसान खाता बनाना
1. होमपेज पर ऊपर दिए गए हरे बटन **"पंजीकरण करें"** (Register) पर क्लिक करें।
2. अपनी जानकारी भरें:
   * **पूरा नाम:** अपना नाम लिखें (जैसे: `हर्षित पटेल`)।
   * **ईमेल आईडी:** अपनी ईमेल दर्ज करें (जैसे: `farmer@example.com`)।
   * **पासवर्ड:** कम से कम 6 अक्षरों का सुरक्षित पासवर्ड चुनें।
   * **मोबाइल नंबर (वैकल्पिक):** अपना 10 अंकों का मोबाइल नंबर लिखें।
   * **स्थान (वैकल्पिक):** अपना ज़िला या राज्य लिखें।
3. **"खाता बनाएं"** बटन पर क्लिक करें। पंजीकरण सफल होने पर आप लॉगिन पृष्ठ पर पहुंच जाएंगे।

### कदम 1.3: लॉगिन करना
1. अपना पंजीकृत ईमेल और पासवर्ड दर्ज करें।
2. **"साइन इन करें"** पर क्लिक करें। आपका खाता खुल जाएगा और आप फसल सलाहकार पेज पर पहुंच जाएंगे।

---

## 2. अपने खेतों का प्रबंधन

### कदम 2.1: नया खेत जोड़ना
1. ऊपर के मेनू में **"खेत प्रबंधन"** (Farm Management) पर क्लिक करें।
2. **"+ नया खेत जोड़ें"** बटन दबाएं।
3. खेत की जानकारी भरें:
   * **खेत का नाम:** पहचान के लिए नाम दें (जैसे: `पहला खेत`, `बड़ा प्लॉट`)।
   * **क्षेत्रफल व इकाई:** ज़मीन का नाप लिखें (जैसे: `5.0`) और `एकड़` या `हेक्टेयर` चुनें।
   * **मिट्टी के मुख्य पोषक तत्व (N, P, K, pH):** अपनी मिट्टी की जांच रिपोर्ट अनुसार संख्या भरें:
     * *नाइट्रोजन (N):* जैसे `90`
     * *फास्फोरस (P):* जैसे `42`
     * *पोटाश (K):* जैसे `43`
     * *पीएच मान (pH):* जैसे `6.5` (साधारण मिट्टी 6.5 से 7.5 के बीच होती है)।
4. **"खेत सहेजें"** पर क्लिक करें।

### कदम 2.2: जीपीएस (GPS) से स्थान लेना
1. खेत के फॉर्म में **"खेत निर्देशांक व स्थान"** कार्ड देखें।
2. **"📍 मेरा वर्तमान स्थान उपयोग करें"** बटन दबाएं।
3. जब ब्राउज़र अनुमति मांगे (*"क्या आप स्थान साझा करना चाहते हैं?"*), तो **"Allow"** (अनुमति दें) चुनें।
4. आपके खेत के अक्षांश (Latitude) और देशांतर (Longitude) स्वतः भर जाएंगे।
5. उपग्रह मैपिंग द्वारा आपके गांव, ज़िले और राज्य का नाम भी स्वतः पहचान लिया जाएगा।
6. *ध्यान दें:* जीपीएस अनिवार्य नहीं है। यदि खेत में इंटरनेट या जीपीएस न हो, तो भी आप बिना इसके खेत जोड़ सकते हैं।

---

## 3. मिट्टी की जानकारी और सॉइल-ग्रिड्स (SoilGrids)

1. मेनू में **"मिट्टी की जानकारी"** (Soil Info) पर क्लिक करें।
2. ऊपर ड्रॉपडाउन से अपना खेत चुनें।
3. **प्रयोगशाला रिपोर्ट दर्ज करना:**
   * अपनी मिट्टी का प्रकार, नमी प्रतिशत और लैब रिपोर्ट के आंकड़े लिखकर **"मिट्टी रिकॉर्ड सहेजें"** दबाएं।
4. **उपग्रह आधारित मिट्टी जांच (SoilGrids):**
   * **"SoilGrids से डेटा लाएं"** बटन पर क्लिक करें।
   * प्रणाली सीधे अंतरराष्ट्रीय मृदा उपग्रह से आपकी ज़मीन के 7 महत्वपूर्ण गुण (पानी में पीएच, कुल नाइट्रोजन, जैविक कार्बन, रेत, गाद, चिकनी मिट्टी और घनत्व) 6 अलग-अलग गहराइयों (`0-5 सेमी` से `100-200 सेमी`) के लिए प्राप्त कर लेगी।
   * यदि अंतरराष्ट्रीय सर्वर धीमा हो, तो कृषि मित्र स्वतः आपके क्षेत्र के अनुसार प्रमाणित क्षेत्रीय मिट्टी का विवरण लोड कर देता है।

---

## 4. एआई फसल अनुशंसा पाना

1. मेनू में **"फसल सलाहकार"** (AI Recommendation) पर क्लिक करें।
2. **खेत से स्वतः भरें:**
   * ऊपर **"पंजीकृत खेत से स्वतः भरें"** में अपना खेत चुनें। खेत की मिट्टी के आंकड़े (N, P, K, pH) अपने आप भर जाएंगे।
3. **मौसम की ताज़ा जानकारी लें:**
   * नीले बटन **"मौसम प्राप्त करें"** पर क्लिक करें। आपके खेत के तापमान (°C) और हवा की नमी (%) की ताज़ा जानकारी उपग्रह से आ जाएगी।
4. **अनुमानित वर्षा दर्ज करें:**
   * **अनुमानित वर्षा (मिमी)** वाले खाने में आगामी फसल चक्र के दौरान होने वाली संभावित वर्षा भरें (जैसे: `200` से `800` मिमी)।
5. **उपयुक्त फसलें खोजें:**
   * हरे बटन **"उपयुक्त फसलें खोजें →"** पर क्लिक करें।
6. **परिणाम को समझना:**
   * **🥇 सबसे उत्तम फसल (Top Match):** आपके खेत के लिए सबसे उपयुक्त फसल।
   * **पर्यावरणीय उपयुक्तता (%):** आपकी मिट्टी और मौसम इस फसल के कितने अनुकूल हैं।
   * **अनुशंसा स्कोर:** बाज़ार भाव और फसल चक्र को मिलाकर निकाला गया अंतिम स्कोर।
   * **फसल चक्र लेबल:** यह दिखाता है कि फसल चक्र सुरक्षित है या लगातार एक ही फसल बोने के कारण कोई कटौती की गई है।
   * *विशेषता:* 0% उपयुक्तता वाली अनुपयुक्त फसलें पूरी तरह हटा दी जाती हैं। केवल वही फसलें दिखेंगी जो वास्तव में उगाई जा सकती हैं।

---

## 5. पत्ती की फोटो से फसल के रोगों की पहचान

1. मेनू में **"रोग पहचान"** (Disease Detection) पर क्लिक करें।
2. **पत्ती की फोटो कैसे लें:**
   * अपने मोबाइल कैमरे से बीमार पत्ती की साफ़, नज़दीकी और अच्छी रोशनी वाली फोटो लें।
   * ध्यान रखें कि फोटो धुंधली न हो और पीछे बहुत सारी घास या अन्य चीजें न आएं।
3. **फोटो अपलोड करना:**
   * फोटो अपलोड करने वाले डिब्बे पर क्लिक करें और अपनी ली गई फोटो चुनें (अधिकतम 5 MB)।
4. **"रोग का निदान करें"** बटन दबाएं।
5. **परिणाम को समझना:**
   * **विश्वसनीय पहचान (सटीकता 70% या अधिक):** एआई मॉडल ने रोग की पक्की पहचान कर ली है। स्क्रीन पर दिखेगा:
     * फसल और बीमारी का सही नाम।
     * मुख्य लक्षण और बीमारी का कारण (फफूंद, बैक्टीरिया या वायरस)।
     * रोकथाम के जैविक व घरेलू उपाय।
     * कृषि विश्वविद्यालय द्वारा प्रमाणित उपचार और रासायनिक दवाएं।
   * **अनिश्चित परिणाम (सटीकता 70% से कम):** पत्ती अस्पष्ट होने पर प्रणाली कोई दवा नहीं बताएगी ताकि फसल को नुकसान न हो। आपको साफ़ रोशनी में दोबारा फोटो लेने या कृषि विशेषज्ञ से मिलने की सलाह दी जाएगी।

---

## 6. मंडी भाव और बाज़ार रुझान देखना

1. मेनू में **"मंडी भाव"** (Market Price) पर क्लिक करें।
2. अपना **राज्य** (जैसे: `Madhya Pradesh`) और **ज़िला** (जैसे: `Indore`) चुनें।
3. **"भाव खोजें"** पर क्लिक करें।
4. **सुविधाएं:**
   * **मॉडल भाव:** प्रति क्विंटल (100 किलो) का ताज़ा औसत मंडी भाव।
   * **ताज़ा रिपोर्ट:** पिछले 7 दिनों के ताज़ा भाव हरे बैज में दिखते हैं।
   * **बाज़ार रुझान:** भाव बढ़ रहे हैं (Rising), घट रहे हैं (Falling), या स्थिर हैं (Stable)।
   * **मांग संकेत:** बाज़ार में खरीदारों की मांग अधिक (High) है या कम (Low)।

---

## 7. पुरानी फसलों का इतिहास दर्ज करना

1. मेनू में **"फसल इतिहास"** (Crop History) पर क्लिक करें।
2. अपना खेत चुनें और **"+ फसल इतिहास जोड़ें"** पर क्लिक करें।
3. पहले बोई गई फसल का नाम (जैसे: `धान`, `गेहूं`, `चना`), मौसम (`खरीफ`, `रबी`, `ज़ायद`) और साल चुनें।
4. **"रिकॉर्ड सहेजें"** दबाएं।
5. प्रणाली इस जानकारी का उपयोग आपकी ज़मीन की उर्वरता बचाने और फसल चक्र का सही पालन करवाने के लिए करती है।

---

## 8. भाषा बदलना (अंग्रेज़ी और हिंदी)

1. स्क्रीन के ऊपर दाईं ओर **"🌐 English"** या **"🌐 हिंदी"** का विकल्प देखें।
2. भाषा सूची पर क्लिक करके **"हिंदी"** चुनें।
3. पूरा ऐप तुरंत सरल हिंदी में बदल जाएगा। कोई भी पेज दोबारा लोड करने की आवश्यकता नहीं होगी।

---

## 9. सभी किसान भाइयों के लिए महत्वपूर्ण सलाह

> [!IMPORTANT]
> **सावधानी एवं परामर्श सूचना:** कृषि मित्र एआई (KrishiMitra AI) एक आधुनिक कम्प्यूटर निर्णय-सहायता प्रणाली है। इसके द्वारा दी गई सलाह वैज्ञानिक गणितीय मॉडल और फोटो विश्लेषण पर आधारित है।
> 
> **खेत में किसी भी कीटनाशक या रासायनिक दवा का छिड़काव करने से पहले अपने नजदीकी कृषि विज्ञान केंद्र (KVK), ब्लॉक कृषि अधिकारी, या कृषि विश्वविद्यालय के वैज्ञानिकों से अवश्य सलाह लें।** कीटनाशक खरीदते समय डिब्बे पर लिखी सावधानियों, सही मात्रा और कटाई से पहले के सुरक्षित समय का पूरा ध्यान रखें।
