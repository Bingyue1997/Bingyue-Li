
import type { DayAlbum, PhotoPoint } from '../types'

export function formatDateKey(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export function groupPhotosByDay(points: PhotoPoint[]): DayAlbum[] {
    // Sort by date first
    const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime())

    const map = new Map<string, DayAlbum>()

    for (const p of sorted) {
        const key = formatDateKey(p.date)
        if (!map.has(key)) {
            map.set(key, {
                dayKey: key,
                title: dateToTitle(p.date),
                photos: [],
            })
        }
        map.get(key)!.photos.push(p)
    }

    return Array.from(map.values())
}

function dateToTitle(date: Date): string {
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })
}
