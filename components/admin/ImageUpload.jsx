'use client'

import { useState, useRef } from 'react'

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  
  const handleUpload = async (file) => {
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    
    setError('')
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      onChange(data.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    handleUpload(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files?.[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Product Image
      </label>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Drop Zone / Preview */}
      <div
        onClick={() => !value && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative w-full aspect-square rounded-2xl border-2 border-dashed transition-all overflow-hidden
          ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}
          ${!value ? 'cursor-pointer hover:border-emerald-400 hover:bg-gray-50' : ''}
          ${uploading ? 'opacity-50' : ''}
        `}
      >
        {value ? (
          <>
            <img 
              src={value} 
              alt="Product" 
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange('') }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <span className="text-4xl mb-2">📷</span>
                <span className="text-sm font-medium text-gray-600">Drop image here</span>
                <span className="text-xs text-gray-400 mt-1">or click to browse</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
      
      <p className="text-xs text-gray-400 mt-2 text-center">PNG, JPG up to 5MB</p>
    </div>
  )
}
