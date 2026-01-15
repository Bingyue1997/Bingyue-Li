
import { useState, useEffect } from 'react'
import './App.css'
import MapTimeline from './components/MapTimeline'
import DaysSidebar from './components/DaysSidebar'
import ShareSidebar from './components/ShareSidebar'
import { parseFiles } from './utils/fileParser'
import { groupPhotosByDay } from './utils/dayGrouping'
import type { ParsedResult, DayAlbum } from './types'
import { Box } from '@mui/material'

export default function App() {
  const [parsed, setParsed] = useState<ParsedResult>({ points: [], skipped: [] })
  const [days, setDays] = useState<DayAlbum[]>([])
  const [activeDayIndex, setActiveDayIndex] = useState<number>(-1)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    if (parsed.points.length === 0) {
      setPreviews([])
      return
    }

    const urls = parsed.points.map((p) => URL.createObjectURL(p.file))
    setPreviews(urls)
    
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [parsed.points])

  async function onFilesSelected(list: FileList | null) {
    if (!list) return
    const res = await parseFiles(list)
    setParsed(res)

    const newDays = groupPhotosByDay(res.points)
    setDays(newDays)

    if (res.points.length > 0) {
      setActiveIndex(0)
      setActiveDayIndex(0)
    } else {
      setActiveIndex(-1)
      setActiveDayIndex(-1)
    }
  }

  function handleDaySelect(dayIndex: number) {
    if (dayIndex < 0 || dayIndex >= days.length) return
    setActiveDayIndex(dayIndex)

    const day = days[dayIndex]
    if (day.photos.length > 0) {
      const firstPhoto = day.photos[0]
      const idx = parsed.points.indexOf(firstPhoto)
      if (idx !== -1) {
        setActiveIndex(idx)
      }
    }
  }

  const activeDay = activeDayIndex >= 0 ? days[activeDayIndex] : null

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#0b0e14' }}>
      <Box sx={{ width: '250px', flexShrink: 0, height: '100%' }}>
        <DaysSidebar
          days={days}
          activeDayIndex={activeDayIndex}
          onSelectDay={handleDaySelect}
        />
      </Box>

      <Box component="main" sx={{ flexGrow: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
        <MapTimeline
          parsed={parsed}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          previews={previews}
          onFilesSelected={onFilesSelected}
        />
      </Box>

      <Box sx={{ width: '320px', flexShrink: 0, height: '100%' }}>
        <ShareSidebar day={activeDay} />
      </Box>
    </Box>
  )
}
