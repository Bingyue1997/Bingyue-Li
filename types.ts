
export type PhotoPoint = {
    file: File
    name: string
    date: Date
    coord: [number, number] // [lng, lat]
    analysis?: {
        labels?: string[]
        summary?: string
        scene?: string
        locationGuess?: string
    }
}

export type DayAlbum = {
    dayKey: string // YYYY-MM-DD
    title: string
    summary?: string
    photos: PhotoPoint[]
    location?: string
    coverPhotoIndex?: number
}

export type ParsedResult = {
    points: PhotoPoint[]
    skipped: { file: File; reason: string }[]
}
