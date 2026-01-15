import * as exifr from 'exifr'
import type { ParsedResult, PhotoPoint } from '../types'

// Parse a list of image files, extracting GPS + timestamp via EXIF.
// Skips files that lack required metadata.
export async function parseFiles(files: FileList | File[]): Promise<ParsedResult> {
    const list = Array.from(files)
    const results: PhotoPoint[] = []
    const skipped: { file: File; reason: string }[] = []

    for (const file of list) {
        try {
            // Read common EXIF blocks. exifr returns plain object values.
            const meta = await exifr.parse(file, { tiff: true, ifd0: true, exif: true, gps: true } as any)

            const lat = meta?.latitude ?? meta?.GPSLatitude
            const lng = meta?.longitude ?? meta?.GPSLongitude
            // Try multiple plausible timestamp fields
            const ts =
                meta?.DateTimeOriginal ||
                meta?.CreateDate ||
                meta?.ModifyDate ||
                meta?.OffsetTimeOriginal ||
                meta?.DateCreated

            if (typeof lat === 'number' && typeof lng === 'number' && ts) {
                const date = ts instanceof Date ? ts : new Date(String(ts))
                if (!isNaN(date.getTime())) {
                    results.push({
                        file,
                        name: file.name,
                        date,
                        coord: [Number(lng), Number(lat)],
                    })
                } else {
                    skipped.push({ file, reason: 'Invalid timestamp' })
                }
            } else {
                skipped.push({ file, reason: 'Missing GPS or timestamp' })
            }
        } catch (e) {
            skipped.push({ file, reason: 'Failed to read EXIF' })
        }
    }

    // Ensure chronological order for the timeline
    results.sort((a, b) => a.date.getTime() - b.date.getTime())
    return { points: results, skipped }
}
