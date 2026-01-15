
import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl'
import '../App.css'
import { Box, Paper, Slider, Button, Typography } from '@mui/material'
import { AddAPhoto as AddAPhotoIcon } from '@mui/icons-material'
import type { ParsedResult } from '../types'

const osmStyle: any = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 19,
      // Removed attribution string to prevent potential URL parsing logic
    },
  },
  layers: [{ id: 'osm-base', type: 'raster', source: 'osm' }],
}

type MapTimelineProps = {
  parsed: ParsedResult
  activeIndex: number
  setActiveIndex: (i: number) => void
  previews: string[]
  onFilesSelected: (list: FileList | null) => void
}

export default function MapTimeline({ parsed, activeIndex, setActiveIndex, previews, onFilesSelected }: MapTimelineProps) {
  const mapRef = useRef<MapLibreMap | null>(null)
  const mapEl = useRef<HTMLDivElement | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const lineGeoJson = useMemo(() => {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: parsed.points.map((p) => p.coord),
      },
      properties: {},
    }
  }, [parsed.points])

  useEffect(() => {
    let timer: number
    
    const initMap = () => {
      if (mapRef.current || !mapEl.current) return
      
      const rect = mapEl.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        timer = window.requestAnimationFrame(initMap)
        return
      }

      try {
        // We use extremely restricted settings to avoid touching window.location.href
        // which causes cross-origin errors in restricted preview environments.
        const map = new maplibregl.Map({
          container: mapEl.current,
          style: osmStyle,
          center: [0, 0],
          zoom: 1.5,
          attributionControl: false, 
          trackResize: true,
          renderWorldCopies: true,
          // Fixed: Removed maxWorkerCount as it is not a valid MapOption in MapLibre GL JS
          // Disable any attempts to read/write to the URL bar
          hash: false,
        })
        
        map.on('load', () => {
          mapRef.current = map
          setMapReady(true)
          map.resize()
          
          map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
        })

        map.on('error', (e) => {
          // Suppress errors that don't break the core functionality
          if (e.error?.message?.includes('Location')) return
          console.error("MapLibre internal error:", e)
        })

      } catch (e: any) {
        console.error("Map initialization failed:", e)
      }
    }

    timer = window.requestAnimationFrame(initMap)

    return () => {
      window.cancelAnimationFrame(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !map.isStyleLoaded()) return

    const ensureSources = () => {
      try {
        const existingSource = map.getSource('track')
        if (!existingSource) {
          map.addSource('track', { type: 'geojson', data: lineGeoJson as any })
          map.addLayer({
            id: 'track-line',
            type: 'line',
            source: 'track',
            paint: { 'line-color': '#1976d2', 'line-width': 3 },
          })
        } else {
          ;(existingSource as maplibregl.GeoJSONSource).setData(lineGeoJson as any)
        }
      } catch (e) {
        console.warn("Failed to update track source", e)
      }
    }

    const clearPreviewMarkers = () => {
      const m = (map as any)._photoPreviewMarkers
      if (Array.isArray(m)) {
        m.forEach((marker: maplibregl.Marker) => marker.remove())
      }
      ;(map as any)._photoPreviewMarkers = []
    }

    const addPreviewMarkers = () => {
      const markers: maplibregl.Marker[] = []
      parsed.points.forEach((p, idx) => {
        const url = previews[idx]
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'photo-pin' + (idx === activeIndex ? ' active' : '')
        
        if (url) {
          const img = document.createElement('img')
          img.src = url
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'cover'
          el.appendChild(img)
        } else {
          el.innerText = String(idx + 1)
        }
        
        el.onclick = (e) => {
          e.stopPropagation()
          setActiveIndex(idx)
        }
        
        try {
            const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat(p.coord)
              .addTo(map)
            markers.push(marker)
        } catch (e) {
            console.warn("Failed to add marker", e)
        }
      })
      ;(map as any)._photoPreviewMarkers = markers
    }

    ensureSources()
    clearPreviewMarkers()
    addPreviewMarkers()

    if (parsed.points.length > 0) {
      const b = new maplibregl.LngLatBounds()
      parsed.points.forEach(p => b.extend(p.coord))
      map.fitBounds(b as unknown as LngLatBoundsLike, { padding: 80, duration: 600 })
    }
  }, [lineGeoJson, parsed.points, activeIndex, previews, setActiveIndex, mapReady])

  const hasPoints = parsed.points.length > 0

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#0b0e14' }}>
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 320,
          bgcolor: 'rgba(18, 24, 38, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        elevation={6}
      >
        <label htmlFor="upload-button">
          <input
            id="upload-button"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFilesSelected(e.target.files)}
            style={{ display: 'none' }}
          />
          <Button variant="contained" component="span" startIcon={<AddAPhotoIcon />} fullWidth>
            Upload Photos
          </Button>
        </label>

        {hasPoints && (
          <Box>
            <Typography variant="body2" color="white" gutterBottom>
              Point {activeIndex + 1} of {parsed.points.length}
            </Typography>
            <Slider
              min={0}
              max={parsed.points.length - 1}
              value={Math.max(activeIndex, 0)}
              onChange={(_, val) => setActiveIndex(val as number)}
              size="small"
              sx={{ color: 'primary.main' }}
            />
          </Box>
        )}
        {!hasPoints && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Upload photos with location data to begin.
          </Typography>
        )}
      </Paper>
      <div 
        ref={mapEl} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          visibility: 'visible',
          background: '#0b0e14'
        }} 
      />
    </Box>
  )
}
