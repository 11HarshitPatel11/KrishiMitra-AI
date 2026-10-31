/**
 * Determines the freshness of market data based on its date string natively.
 * Categories: 
 * - fresh: 0-1 days old
 * - recent: 2-3 days old
 * - stale: >3 days old
 * - unknown: missing or invalid date format
 */
export const classifyFreshness = (dateString) => {
    if (!dateString) return 'unknown';

    // Data.gov.in standard format is typically DD/MM/YYYY, or YYYY-MM-DD
    // We will attempt to parse it cleanly
    let parsedDate;

    // Check if DD/MM/YYYY
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const year = parseInt(parts[2], 10);
        parsedDate = new Date(year, month, day);
    } else {
        // Fallback standard parse
        parsedDate = new Date(dateString);
    }

    if (isNaN(parsedDate.getTime())) {
        return 'unknown';
    }

    const today = new Date();
    // Normalize to midnight to avoid timezone/time-of-day math issues locally
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dataMidnight = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

    const diffTime = todayMidnight - dataMidnight;

    // Future dates or exact today
    if (diffTime <= 0) return 'fresh';

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'fresh';
    if (diffDays <= 3) return 'recent';
    return 'stale';
};
