import React, { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Check, Sliders, Crop as CropIcon, RotateCcw } from 'lucide-react'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageCropperModal({ file, onCropComplete, onCancel }) {
  const [upImg, setUpImg] = useState()
  const imgRef = useRef(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [aspect, setAspect] = useState(16 / 9)
  
  // Tabs & Color Correction State
  const [activeTab, setActiveTab] = useState('crop') // 'crop' | 'color'
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [grayscale, setGrayscale] = useState(0)
  const [sepia, setSepia] = useState(0)
  const [blur, setBlur] = useState(0)

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => setUpImg(reader.result))
      reader.readAsDataURL(file)
    }
  }, [file])

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget
    imgRef.current = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }

  const handleResetColors = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setGrayscale(0)
    setSepia(0)
    setBlur(0)
  }

  const getCroppedImg = async () => {
    if (!imgRef.current) return

    const image = imgRef.current
    const effectiveCrop = (completedCrop && completedCrop.width > 0 && completedCrop.height > 0)
      ? completedCrop
      : { x: 0, y: 0, width: image.width, height: image.height }

    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const cropWidth = effectiveCrop.width * scaleX
    const cropHeight = effectiveCrop.height * scaleY
    canvas.width = cropWidth
    canvas.height = cropHeight
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Apply color correction filters to canvas for pristine high resolution output
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)`

    ctx.drawImage(
      image,
      effectiveCrop.x * scaleX,
      effectiveCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return
        const croppedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
        resolve(croppedFile)
      }, 'image/jpeg', 1)
    })
  }

  const handleSave = async () => {
    const croppedFile = await getCroppedImg()
    if (croppedFile) {
      onCropComplete(croppedFile)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">ছবি এডিটিং ও কালার কারেকশন (Photo Editor)</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">ছবি ক্রপ করুন এবং প্রফেশনাল কালার অ্যাডজাস্ট করুন</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'crop' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <CropIcon size={16} />
            <span>ছবি ক্রপ (Crop)</span>
          </button>
          <button
            onClick={() => setActiveTab('color')}
            className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'color' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <Sliders size={16} />
            <span>কালার কারেকশন (Color Correction)</span>
          </button>
        </div>
        
        {/* Main Preview / Work Area */}
        <div className="p-6 flex-1 overflow-auto bg-gray-100 dark:bg-black/40 flex items-center justify-center min-h-[350px]">
          {upImg && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
            >
              <img
                src={upImg}
                onLoad={onImageLoad}
                className="max-h-[45vh] object-contain shadow-lg rounded"
                style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)` }}
                alt="Crop preview"
              />
            </ReactCrop>
          )}
        </div>

        {/* Controls Area depending on Tab */}
        {activeTab === 'color' ? (
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">কালার অ্যাডজাস্টমেন্ট প্যানেল</span>
              <button
                onClick={handleResetColors}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
              >
                <RotateCcw size={13} />
                <span>রিসেট করুন</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <span>উজ্জ্বলতা (Brightness)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <span>কনট্রাস্ট (Contrast)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <span>স্যাচুরেশন (Saturation)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <span>সাদাকালো (Grayscale)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <span>সেপিয়া (Sepia)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sepia}
                  onChange={(e) => setSepia(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <span>ব্লার (Blur)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">অ্যাস্পেক্ট রেশিও (Aspect Ratio)</span>
            <div className="flex gap-2">
              <button 
                onClick={() => { setAspect(16 / 9); setCrop(centerAspectCrop(imgRef.current?.width, imgRef.current?.height, 16/9)) }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${aspect === 16/9 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
              >
                16:9
              </button>
              <button 
                onClick={() => { setAspect(4 / 3); setCrop(centerAspectCrop(imgRef.current?.width, imgRef.current?.height, 4/3)) }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${aspect === 4/3 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
              >
                4:3
              </button>
              <button 
                onClick={() => { setAspect(1); setCrop(centerAspectCrop(imgRef.current?.width, imgRef.current?.height, 1)) }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${aspect === 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
              >
                1:1
              </button>
              <button 
                onClick={() => { setAspect(undefined) }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${!aspect ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
              >
                Free
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl dark:text-gray-300 dark:hover:bg-slate-800 transition-colors">
            বাতিল
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
            <Check size={16} /> সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  )
}
