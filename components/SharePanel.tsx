
import { useState } from 'react'
import type { DayAlbum } from '../types'
import { generateShareContent } from '../services/gemini'
import type { ShareConcept } from '../services/gemini'

type Props = {
    day: DayAlbum
    onClose: () => void
}

export default function SharePanel({ day, onClose }: Props) {
    const [platform, setPlatform] = useState('Instagram')
    const [style, setStyle] = useState('Travel Vlog')
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState<ShareConcept | null>(null)

    async function handleGenerate() {
        setGenerating(true)
        try {
            const concept = await generateShareContent(day, platform, style)
            setResult(concept)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="share-panel-overlay">
            <div className="share-panel">
                <div className="share-header">
                    <h2>Share Day: {day.title}</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="share-body">
                    <div className="share-form">
                        <label>
                            Platform
                            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                                <option>Instagram</option>
                                <option>TikTok</option>
                                <option>YouTube Shorts</option>
                                <option>Xiaohongshu</option>
                            </select>
                        </label>
                        <label>
                            Style
                            <select value={style} onChange={(e) => setStyle(e.target.value)}>
                                <option>Travel Vlog</option>
                                <option>Cinematic</option>
                                <option>Minimalist</option>
                                <option>Upbeat</option>
                            </select>
                        </label>
                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? 'Dreaming up ideas...' : 'Generate Magic ✨'}
                        </button>
                    </div>

                    {result && (
                        <div className="share-result">
                            <h3><caption>{result.caption}</caption></h3>
                            <div className="hashtags">{result.hashtags.join(' ')}</div>

                            <div className="storyboard">
                                <h4>Storyboard</h4>
                                {result.storyboard.scenes.map((scene, i) => (
                                    <div key={i} className="scene-item">
                                        <span className="time">{scene.duration}s</span>
                                        <span className="desc">{scene.subtitle}</span>
                                        <span className="trans">({scene.transition})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
