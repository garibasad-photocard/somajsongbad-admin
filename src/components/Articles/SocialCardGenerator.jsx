import React, { useState, useEffect, useRef } from 'react'
import { X, Download, LayoutTemplate, Quote, Settings } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'

export default function SocialCardGenerator({ isOpen, onClose, coverImage, title, blocks }) {
  const canvasRef = useRef(null)
  const [cardStyle, setCardStyle] = useState('headline') // 'headline' or 'quote'
  const [quoteText, setQuoteText] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Custom Brand Settings
  const [siteUrl, setSiteUrl] = useState('aajokal.com')
  const [showCommentsText, setShowCommentsText] = useState(true)
  
  // Ad states
  const [showAd, setShowAd] = useState(false)
  const [adImage, setAdImage] = useState(null)
  const [adPosition, setAdPosition] = useState('bottom') // 'top' or 'bottom'
  
  // Image Positioning
  const [imageOffsetX, setImageOffsetX] = useState(0)
  const [imageOffsetY, setImageOffsetY] = useState(0)

  // Find the first highlight block to use as the default quote
  useEffect(() => {
    if (isOpen) {
      const highlightBlock = blocks?.find(b => b.type === 'highlight')
      if (highlightBlock && highlightBlock.text) {
        setQuoteText(highlightBlock.text)
      } else {
        setQuoteText('এখানে আপনার কোটেশন বা উক্তিটি লিখুন...')
      }
    }
  }, [isOpen, blocks])

  useEffect(() => {
    if (isOpen) {
      drawCanvas()
    }
  }, [isOpen, cardStyle, coverImage, title, quoteText, showAd, adImage, adPosition, siteUrl, showCommentsText, imageOffsetX, imageOffsetY])

  const drawCanvas = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    setIsDrawing(true)

    // Canvas size for Social Media (e.g., 1080x1350 for 4:5 portrait)
    const width = 1080
    const height = 1350
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Fill background black just in case
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    const adHeight = 180;
    const isBottomAd = showAd && adPosition === 'bottom' && adImage;
    const isTopAd = showAd && adPosition === 'top' && adImage;
    
    const bottomMargin = isBottomAd ? adHeight + 60 : 60;
    const topMargin = isTopAd ? adHeight + 40 : 40;

    try {
      // 1. Draw Background Image
      if (coverImage) {
        const img = await loadImage(coverImage)
        const imgRatio = img.width / img.height
        const canvasRatio = width / height
        let drawWidth, drawHeight, offsetX, offsetY
        if (imgRatio > canvasRatio) {
          drawHeight = height
          drawWidth = img.width * (height / img.height)
          offsetX = (width - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = width
          drawHeight = img.height * (width / img.width)
          offsetX = 0
          offsetY = (height - drawHeight) / 2
        }
        ctx.drawImage(img, offsetX + imageOffsetX, offsetY + imageOffsetY, drawWidth, drawHeight)
      } else {
        // Draw default gradient if no cover image
        const bgGradient = ctx.createLinearGradient(0, 0, width, height)
        bgGradient.addColorStop(0, '#1e293b') // slate-800
        bgGradient.addColorStop(1, '#0f172a') // slate-900
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, width, height)
      }

      // 2. Draw Styles
      if (cardStyle === 'headline') {
        // Draw Dark Gradient at bottom
        const gradientStart = isBottomAd ? height * 0.25 : height * 0.4
        const gradient = ctx.createLinearGradient(0, gradientStart, 0, height)
        gradient.addColorStop(0, 'rgba(0,0,0,0)')
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.8)')
        gradient.addColorStop(1, 'rgba(0,0,0,1)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, gradientStart, width, height - gradientStart)

        // Draw Headline Text
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 65px "Hind Siliguri", "Noto Sans Bengali", sans-serif'
        ctx.textAlign = 'center'
        const headlineY = isBottomAd ? height * 0.75 - 60 : height * 0.75
        wrapText(ctx, title || 'শিরোনাম এখানে বসবে', width / 2, headlineY, width - 260, 90)

        // Draw Date & Website
        ctx.fillStyle = '#E5E7EB'
        ctx.font = 'bold 28px "Hind Siliguri", sans-serif'
        ctx.textAlign = 'left'
        const today = new Date().toISOString().split('T')[0]
        ctx.fillText(today, 60, height - bottomMargin)
        
        ctx.textAlign = 'right'
        ctx.fillText(siteUrl, width - 60, height - bottomMargin)

      } else if (cardStyle === 'quote') {
        // Draw Quote Style (Rounded box with transparent black)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
        roundRect(ctx, 60, height - 450, width - 120, 320, 30)

        // Draw Quote Mark (Yellow/Orange)
        ctx.fillStyle = '#F59E0B' // Amber-500
        ctx.font = 'bold 200px serif'
        ctx.textAlign = 'left'
        ctx.fillText('“', 80, height - 340)

        // Draw Quote Text
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 45px "Hind Siliguri", "Noto Sans Bengali", sans-serif'
        ctx.textAlign = 'center'
        wrapText(ctx, quoteText, width / 2, height - (bottomMargin + 280), width - 200, 65)

        // Draw Website
        ctx.fillStyle = '#E5E7EB'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(siteUrl, width - 80, height - (bottomMargin + 100))
      }

      // 3. Draw Logo Image (Top Right)
      try {
        // Try loading white-logo.png for better visibility on dark backgrounds, or fallback to logo.png
        const logoImg = await loadImage('/logo.png').catch(() => null)
        if (logoImg) {
          // Calculate aspect ratio (reduce size by 25%)
          const targetHeight = 45
          const targetWidth = (logoImg.width / logoImg.height) * targetHeight
          ctx.drawImage(logoImg, width - 60 - targetWidth, topMargin + 20, targetWidth, targetHeight)
        }
      } catch (err) {
        console.warn('Logo could not be loaded', err)
      }
      
      // 4. Draw Comments Text
      if (showCommentsText) {
        ctx.fillStyle = '#FBBF24' // Yellow-400
        ctx.font = 'bold 28px "Hind Siliguri", "Noto Sans Bengali", sans-serif'
        ctx.textAlign = 'center'
        // Draw exactly on the same Y line as Date and Website, but centered
        ctx.fillText('বিস্তারিত কমেন্টে ▾', width / 2, height - bottomMargin)
      }
      
      // 5. Draw Ad Strip
      if (showAd && adImage) {
        const adImg = await loadImage(adImage)
        if (adPosition === 'bottom') {
          ctx.drawImage(adImg, 0, height - adHeight, width, adHeight)
        } else {
          ctx.drawImage(adImg, 0, 0, width, adHeight)
        }
      }

    } catch (err) {
      console.error('Error drawing canvas', err)
    } finally {
      setIsDrawing(false)
    }
  }

  // --- Helpers ---
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Important for drawing external images
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const handleAdUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAdImage(URL.createObjectURL(file))
    }
  }

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ')
    let line = ''
    let lines = []

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' '
      let metrics = ctx.measureText(testLine)
      let testWidth = metrics.width
      if (testWidth > maxWidth && n > 0) {
        lines.push(line)
        line = words[n] + ' '
      } else {
        line = testLine
      }
    }
    lines.push(line)

    // Center vertically based on number of lines
    let currentY = y - ((lines.length - 1) * lineHeight) / 2
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, currentY)
      currentY += lineHeight
    }
  }

  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `social-card-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[80] p-4 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl flex overflow-hidden max-h-[90vh] animate-scale-up">
        
        {/* Left: Preview Canvas */}
        <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-6 flex items-center justify-center overflow-auto border-r border-gray-200 dark:border-slate-800">
          <div className="relative shadow-2xl rounded-lg overflow-hidden max-w-[450px] w-full aspect-[4/5] transform transition-transform hover:scale-[1.02]">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain bg-black"
            />
            {isDrawing && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <span className="text-sm font-medium animate-pulse">Drawing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-80 flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">কার্ড জেনারেটর</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            
            {!coverImage && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4 border border-amber-200">
                ⚠️ দয়া করে আগে একটি <strong>কভার ছবি</strong> আপলোড করুন।
              </div>
            )}
            
            {/* Image Controls */}
            {coverImage && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ছবির পজিশন ঠিক করুন</label>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400">ডানে-বামে সরান (X)</label>
                      <span className="text-[10px] text-gray-400">{imageOffsetX > 0 ? '+' : ''}{imageOffsetX}px</span>
                    </div>
                    <input type="range" min="-500" max="500" value={imageOffsetX} onChange={(e) => setImageOffsetX(Number(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-slate-400">উপর-নিচ সরান (Y)</label>
                      <span className="text-[10px] text-gray-400">{imageOffsetY > 0 ? '+' : ''}{imageOffsetY}px</span>
                    </div>
                    <input type="range" min="-500" max="500" value={imageOffsetY} onChange={(e) => setImageOffsetY(Number(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => { setImageOffsetX(0); setImageOffsetY(0); }} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                      রিসেট করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Style Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">কার্ডের স্টাইল বেছে নিন</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setCardStyle('headline')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${cardStyle === 'headline' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'}`}
                >
                  <LayoutTemplate size={24} />
                  <span className="text-xs font-semibold">রেগুলার হেডলাইন</span>
                </button>
                <button 
                  onClick={() => setCardStyle('quote')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${cardStyle === 'quote' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200'}`}
                >
                  <Quote size={24} />
                  <span className="text-xs font-semibold">কোটেশন (উক্তি)</span>
                </button>
              </div>
            </div>

            {/* Dynamic Inputs based on style */}
            {cardStyle === 'quote' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">উক্তি বা কোটেশন</label>
                <textarea 
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 bg-transparent text-gray-900 dark:text-white"
                  rows={4}
                  placeholder="এখানে আপনার কোটেশন লিখুন..."
                />
                <p className="text-[10px] text-gray-400">এডিটরে কোনো 'Highlight' ব্লক থাকলে সেটি স্বয়ংক্রিয়ভাবে এখানে চলে আসবে।</p>
              </div>
            )}

            {cardStyle === 'headline' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">কার্ডের হেডলাইন</label>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                  {title || 'কোনো হেডলাইন দেওয়া হয়নি'}
                </div>
                <p className="text-[10px] text-gray-400">হেডলাইন পরিবর্তন করতে চাইলে মূল এডিটর পেজ থেকে পরিবর্তন করুন।</p>
              </div>
            )}
            
            {/* Brand Settings */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ব্র্যান্ডের সেটিংস</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">ওয়েবসাইট লিঙ্ক</label>
                  <input type="text" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer w-max mt-2">
                  <input type="checkbox" checked={showCommentsText} onChange={e => setShowCommentsText(e.target.checked)} className="rounded text-blue-600 w-4 h-4 cursor-pointer" />
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">"বিস্তারিত কমেন্টে" লেখাটি দেখান</span>
                </label>
              </div>
            </div>
            
            {/* Ad Settings */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer w-max">
                <input type="checkbox" checked={showAd} onChange={e => setShowAd(e.target.checked)} className="rounded text-purple-600 w-4 h-4 cursor-pointer" />
                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">বিজ্ঞাপন (Ad Strip) যুক্ত করুন</span>
              </label>
              
              {showAd && (
                <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800/30">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">বিজ্ঞাপনের ছবি আপলোড</label>
                    <input type="file" accept="image/*" onChange={handleAdUpload} className="text-xs w-full bg-white dark:bg-slate-800 p-1 rounded border border-gray-200 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-slate-400 mb-2 block font-medium">বিজ্ঞাপনের পজিশন</label>
                    <div className="flex gap-4">
                      <label className="text-xs flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-slate-300">
                        <input type="radio" name="adPos" checked={adPosition === 'top'} onChange={() => setAdPosition('top')} className="text-purple-600" /> উপরে (Top)
                      </label>
                      <label className="text-xs flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-slate-300">
                        <input type="radio" name="adPos" checked={adPosition === 'bottom'} onChange={() => setAdPosition('bottom')} className="text-purple-600" /> নিচে (Bottom)
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="p-5 border-t border-gray-100 dark:border-slate-800">
            <button 
              onClick={handleDownload}
              disabled={!coverImage || isDrawing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              ডাউনলোড করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
