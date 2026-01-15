import {
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Divider,
} from '@mui/material'
import type { DayAlbum } from '../types'

type DaysSidebarProps = {
    days: DayAlbum[]
    activeDayIndex: number
    onSelectDay: (index: number) => void
}

export default function DaysSidebar({ days, activeDayIndex, onSelectDay }: DaysSidebarProps) {
    return (
        <Box sx={{ height: '100%', overflowY: 'auto', borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ p: 2 }}>
                Timeline
            </Typography>
            <Divider />
            <List>
                {days.length === 0 ? (
                    <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
                        No days yet. Upload photos to begin.
                    </Typography>
                ) : (
                    days.map((day, dIdx) => (
                        <ListItemButton
                            key={day.dayKey}
                            selected={dIdx === activeDayIndex}
                            onClick={() => onSelectDay(dIdx)}
                        >
                            <ListItemText
                                primary={day.title}
                                secondary={`${day.photos.length} Photos`}
                                primaryTypographyProps={{ variant: 'subtitle2' }}
                            />
                        </ListItemButton>
                    ))
                )}
            </List>
        </Box>
    )
}
