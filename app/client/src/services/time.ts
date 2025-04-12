
export function timeAgo(date: Date | string | number): string {
    const now = new Date()
    const past = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const diffInSeconds = Math.floor((past.getTime() - now.getTime()) / 1000) // future = positive

    const isFuture = diffInSeconds > 0
    const seconds = Math.abs(diffInSeconds)

    const intervals: [number, string][] = [
        [31536000, 'year'],
        [2592000, 'month'],
        [86400, 'day'],
        [3600, 'hour'],
        [60, 'minute'],
        [1, 'second'],
    ]

    for (const [secondsPerUnit, unit] of intervals) {
        const count = Math.floor(seconds / secondsPerUnit)
        if (count >= 1) {
            const pluralUnit = `${unit}${count !== 1 ? 's' : ''}`
            return isFuture ? `in ${count} ${pluralUnit}` : `${count} ${pluralUnit} ago`
        }
    }

    return 'just now'
}

export function toUnixTime(date: Date | string | number) {
    return Math.floor(new Date(date).getTime() / 1000)
}

export function fromUnixTime(n: number) {
    return new Date(n * 1000)
}
