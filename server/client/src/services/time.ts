export function timeAgo(date: Date | string | number): string {
    const now = new Date();
    const past = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const intervals: [number, string][] = [
        [31536000, 'year'],
        [2592000, 'month'],
        [86400, 'day'],
        [3600, 'hour'],
        [60, 'minute'],
        [1, 'second'],
    ];

    for (const [secondsPerUnit, unit] of intervals) {
        const count = Math.floor(seconds / secondsPerUnit);
        if (count >= 1) {
            return `${count} ${unit}${count !== 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}
