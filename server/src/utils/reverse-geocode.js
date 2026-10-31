export const reverseGeocode = async (latitude, longitude) => {
    try {
        if (!latitude || !longitude) return null;

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        let response;
        try {
            response = await fetch(url, {
                headers: { 'User-Agent': 'KrishiMitra/1.0' },
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.address) {
            const addr = data.address;
            const locality = addr.village || addr.town || addr.suburb || addr.neighbourhood || addr.city_district || addr.city || null;
            const district = addr.state_district || addr.county || addr.district || null;
            const state = addr.state || null;
            const formatted = [locality, district, state].filter(Boolean).join(', ');

            return {
                formatted: formatted || data.display_name || null,
                village: addr.village || addr.town || addr.suburb || null,
                city: addr.city || null,
                district: district,
                state: state,
            };
        }
        return null;
    } catch (e) {
        return null; // Silent catch, non-critical integration
    }
};
