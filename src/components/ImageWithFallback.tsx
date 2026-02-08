import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [triedDownload, setTriedDownload] = useState(false)

  const handleError = async () => {
    if (triedDownload) {
      setDidError(true)
      return
    }
    setTriedDownload(true)
    const bucket = (props as any)['data-sb-bucket'] as string | undefined
    const path = (props as any)['data-sb-path'] as string | undefined
    if (!bucket || !path) {
      setDidError(true)
      return
    }
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path)
      if (error || !data) {
        setDidError(true)
        return
      }
      const url = URL.createObjectURL(data)
      setBlobUrl(url)
      setDidError(false)
    } catch {
      setDidError(true)
    }
  }

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const { src, alt, style, className, ...rest } = props
  const finalSrc = blobUrl || (src as string | undefined)

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={finalSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
