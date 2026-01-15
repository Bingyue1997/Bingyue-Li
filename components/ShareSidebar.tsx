
import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    LinearProgress,
    Stack,
    IconButton,
    Tooltip,
    Link,
    Paper,
    alpha,
    useTheme
} from '@mui/material'
import { 
    AutoAwesome as AutoAwesomeIcon, 
    MovieFilter as MovieIcon,
    VpnKey as KeyIcon,
    FileDownload as DownloadIcon,
    InfoOutlined as InfoIcon,
    PlayCircleOutline as PlayIcon,
    Schedule as TimeIcon,
    AutoFixHigh as MagicIcon,
    MenuBook as DiaryIcon,
    ContentPaste as PasteIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material'
import type { DayAlbum } from '../types'
import { 
    generateShareContent, 
    generateVideoForDay, 
    generateDetailedDiary, 
    type ShareConcept 
} from '../services/gemini'

type ShareSidebarProps = {
    day: DayAlbum | null
}

const statusMessages = [
    "Analyzing your path through the world...",
    "Scanning memories for peak aesthetics...",
    "Synthesizing atmospheric pixels...",
    "Applying cinematic color grading...",
    "Polishing the digital narrative...",
    "Finalizing your travel masterpiece..."
];

export default function ShareSidebar({ day }: ShareSidebarProps) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false)
    const [diaryLoading, setDiaryLoading] = useState(false)
    const [videoLoading, setVideoLoading] = useState(false)
    const [concept, setConcept] = useState<ShareConcept | null>(null)
    const [diaryText, setDiaryText] = useState<string | null>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [statusIndex, setStatusIndex] = useState(0)
    const [hasApiKey, setHasApiKey] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const checkKey = async () => {
            // @ts-ignore
            if (window.aistudio?.hasSelectedApiKey) {
                // @ts-ignore
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(selected);
            } else {
                setHasApiKey(true);
            }
        };
        checkKey();
    }, [day]);

    useEffect(() => {
        let interval: number;
        if (videoLoading) {
            interval = window.setInterval(() => {
                setStatusIndex((prev) => (prev + 1) % statusMessages.length);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [videoLoading]);

    const handleGenerateConcept = async () => {
        if (!day) return
        setLoading(true)
        setConcept(null)
        try {
            const result = await generateShareContent(day, 'Instagram', 'Cinematic')
            setConcept(result)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateDiary = async () => {
        if (!day) return
        setDiaryLoading(true)
        setDiaryText(null)
        try {
            const result = await generateDetailedDiary(day)
            setDiaryText(result)
        } catch (err) {
            console.error(err)
        } finally {
            setDiaryLoading(false)
        }
    }

    const handleCopyDiary = () => {
        if (diaryText) {
            navigator.clipboard.writeText(diaryText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSelectKey = async () => {
        // @ts-ignore
        if (window.aistudio?.openSelectKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
            setHasApiKey(true); 
        }
    };

    const handleGenerateVideo = async () => {
        if (!day) return
        setVideoLoading(true)
        setVideoUrl(null)
        setStatusIndex(0)
        
        try {
            let startImage = "";
            if (day.photos.length > 0) {
                const blob = await fetch(URL.createObjectURL(day.photos[0].file)).then(r => r.blob());
                startImage = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            const url = await generateVideoForDay(day, startImage);
            setVideoUrl(url);
        } catch (err: any) {
            console.error("Video error:", err);
            if (err.message?.includes("Requested entity was not found")) {
                setHasApiKey(false);
            }
        } finally {
            setVideoLoading(false)
        }
    }

    const sectionHeaderStyle = (color1: string, color2: string) => ({
        fontWeight: 800,
        fontSize: '0.75rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        background: `linear-gradient(to right, ${color1}, ${color2})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 2,
        display: 'block'
    });

    return (
        <Box sx={{ 
            height: '100%', 
            overflowY: 'auto', 
            borderLeft: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            bgcolor: '#0a0e17', 
            p: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{ 
                p: 3, 
                pb: 2, 
                backdropFilter: 'blur(20px)', 
                position: 'sticky', 
                top: 0, 
                zIndex: 10,
                bgcolor: alpha('#0a0e17', 0.8),
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.05),
            }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ 
                        fontWeight: 900, 
                        letterSpacing: -0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <MagicIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                        Memories AI
                    </Typography>
                    <Tooltip title="AI Creative Suite">
                        <IconButton size="small" sx={{ opacity: 0.5 }}><InfoIcon sx={{ fontSize: 18 }} /></IconButton>
                    </Tooltip>
                </Stack>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {day ? day.title : 'Waiting for a selection...'}
                </Typography>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1 }}>
                {!day ? (
                    <Box sx={{ 
                        py: 12, 
                        textAlign: 'center', 
                        opacity: 0.3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <AutoAwesomeIcon sx={{ fontSize: 48 }} />
                        <Typography variant="body2" sx={{ maxWidth: '200px' }}>
                            Choose a trip from the timeline to start generating cinematic magic.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={5}>
                        {/* NEW: Detailed Diary Section */}
                        <Box>
                            <Typography sx={sectionHeaderStyle('#f59e0b', '#ef4444')}>
                                Detailed Travel Diary
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleGenerateDiary}
                                disabled={diaryLoading}
                                fullWidth
                                sx={{ 
                                    borderRadius: 3, 
                                    py: 1.5, 
                                    background: 'linear-gradient(45deg, #f59e0b, #ef4444)',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #fbbf24, #f87171)',
                                    }
                                }}
                                startIcon={diaryLoading ? <CircularProgress size={20} color="inherit" /> : <DiaryIcon />}
                            >
                                {diaryLoading ? 'Reconstructing Memories...' : 'Generate Daily Log'}
                            </Button>

                            {diaryText && (
                                <Box sx={{ mt: 3, position: 'relative' }}>
                                    <Paper sx={{ 
                                        p: 3, 
                                        bgcolor: alpha('#fff', 0.03), 
                                        borderRadius: 4, 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}>
                                        <Typography variant="body2" sx={{ 
                                            whiteSpace: 'pre-wrap', 
                                            color: 'rgba(255,255,255,0.9)',
                                            lineHeight: 1.7,
                                            fontFamily: 'Georgia, serif',
                                            fontSize: '0.875rem'
                                        }}>
                                            {diaryText}
                                        </Typography>
                                    </Paper>
                                    <Button
                                        size="small"
                                        startIcon={copied ? <CheckIcon /> : <PasteIcon />}
                                        onClick={handleCopyDiary}
                                        sx={{ 
                                            mt: 1, 
                                            color: copied ? 'success.main' : 'rgba(255,255,255,0.4)',
                                            textTransform: 'none',
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        {copied ? 'Copied to Clipboard' : 'Copy Text'}
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.05) }} />

                        {/* Cinematic Reel Section */}
                        <Box>
                            <Typography sx={sectionHeaderStyle('#a855f7', '#ec4899')}>
                                Cinematic Reel
                            </Typography>
                            
                            {!hasApiKey ? (
                                <Paper variant="outlined" sx={{ 
                                    p: 2, 
                                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                                    borderColor: alpha(theme.palette.warning.main, 0.2),
                                    borderRadius: 3
                                }}>
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        startIcon={<KeyIcon />}
                                        onClick={handleSelectKey}
                                        fullWidth
                                        sx={{ 
                                            mb: 1, 
                                            borderRadius: 2,
                                            fontWeight: 'bold',
                                            textTransform: 'none'
                                        }}
                                    >
                                        Configure API Key
                                    </Button>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', display: 'block' }}>
                                        Veo requires a paid GCP project key. <Link href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" color="warning.main">Docs</Link>
                                    </Typography>
                                </Paper>
                            ) : (
                                <Box>
                                    <Button
                                        variant="contained"
                                        onClick={handleGenerateVideo}
                                        disabled={videoLoading}
                                        fullWidth
                                        sx={{ 
                                            borderRadius: 3,
                                            py: 1.5,
                                            background: 'linear-gradient(45deg, #7c3aed, #db2777)',
                                            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 24px rgba(124, 58, 237, 0.4)',
                                                background: 'linear-gradient(45deg, #8b5cf6, #f472b6)',
                                            }
                                        }}
                                    >
                                        {videoLoading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            <>
                                                <MovieIcon sx={{ mr: 1 }} />
                                                Generate Movie
                                            </>
                                        )}
                                    </Button>

                                    {videoLoading && (
                                        <Box sx={{ mt: 3 }}>
                                            <LinearProgress sx={{ height: 4, borderRadius: 2, bgcolor: alpha('#7c3aed', 0.1), '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #7c3aed, #db2777)' } }} />
                                            <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textAlign: 'center', fontSize: '0.8rem' }}>
                                                {statusMessages[statusIndex]}
                                            </Typography>
                                        </Box>
                                    )}

                                    {videoUrl && (
                                        <Box sx={{ mt: 3 }}>
                                            <Box sx={{ 
                                                position: 'relative',
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                <video src={videoUrl} controls style={{ width: '100%', display: 'block' }} autoPlay loop />
                                            </Box>
                                            <Button 
                                                href={videoUrl} 
                                                download={`journey-${day.dayKey}.mp4`}
                                                startIcon={<DownloadIcon />}
                                                size="small"
                                                fullWidth
                                                sx={{ mt: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'none' }}
                                            >
                                                Export as MP4
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.05) }} />

                        {/* Social Story Section */}
                        <Box>
                            <Typography sx={sectionHeaderStyle('#0ea5e9', '#2dd4bf')}>
                                Social Narrative
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleGenerateConcept}
                                disabled={loading}
                                fullWidth
                                sx={{ 
                                    borderRadius: 3, 
                                    py: 1.5, 
                                    borderColor: alpha('#0ea5e9', 0.5),
                                    color: '#0ea5e9',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderWidth: 2,
                                    '&:hover': {
                                        borderWidth: 2,
                                        bgcolor: alpha('#0ea5e9', 0.05),
                                        borderColor: '#0ea5e9'
                                    }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Dream Story Ideas'}
                            </Button>

                            {concept && (
                                <Stack spacing={2} sx={{ mt: 3 }}>
                                    <Card sx={{ 
                                        bgcolor: alpha('#ffffff', 0.02), 
                                        borderRadius: 4, 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: 'none'
                                    }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="body2" sx={{ 
                                                lineHeight: 1.6, 
                                                color: 'rgba(255,255,255,0.9)',
                                                mb: 2,
                                                fontWeight: 500
                                            }}>
                                                "{concept.caption}"
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {concept.hashtags.map(tag => (
                                                    <Chip 
                                                        key={tag} 
                                                        label={tag} 
                                                        size="small" 
                                                        sx={{ 
                                                            bgcolor: alpha('#0ea5e9', 0.1), 
                                                            color: '#0ea5e9',
                                                            borderRadius: 1,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600
                                                        }} 
                                                    />
                                                ))}
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    <Box sx={{ pl: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}>
                                            SCENE STORYBOARD
                                        </Typography>
                                        <Stack spacing={1} sx={{ position: 'relative' }}>
                                            {/* Vertical Timeline Line */}
                                            <Box sx={{ 
                                                position: 'absolute', 
                                                left: 11, 
                                                top: 10, 
                                                bottom: 10, 
                                                width: 2, 
                                                bgcolor: alpha('#ffffff', 0.05),
                                                zIndex: 0
                                            }} />
                                            
                                            {concept.storyboard.scenes.map((scene, i) => (
                                                <Stack key={i} direction="row" spacing={2} alignItems="flex-start" sx={{ position: 'relative', zIndex: 1 }}>
                                                    <Box sx={{ 
                                                        width: 24, 
                                                        height: 24, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#121826', 
                                                        border: '2px solid',
                                                        borderColor: i === 0 ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        fontSize: '0.6rem',
                                                        fontWeight: 800
                                                    }}>
                                                        {i + 1}
                                                    </Box>
                                                    <Box sx={{ flexGrow: 1, pt: 0.2 }}>
                                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.2 }}>
                                                            {scene.subtitle}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.5 }}>
                                                                <TimeIcon sx={{ fontSize: 12 }} />
                                                                <Typography sx={{ fontSize: '0.65rem' }}>{scene.duration}s</Typography>
                                                            </Stack>
                                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.5 }}>
                                                                <PlayIcon sx={{ fontSize: 12 }} />
                                                                <Typography sx={{ fontSize: '0.65rem' }}>{scene.transition}</Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                )}
            </Box>

            <Box sx={{ p: 3, opacity: 0.2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', letterSpacing: 1 }}>
                    AI-POWERED TRAVEL CREATIVE ENGINE
                </Typography>
            </Box>
        </Box>
    )
}
