"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

interface SoundOptions {
  volume?: number
  loop?: boolean
}

export function useSound(src: string, options: SoundOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(src)
      
      // Handle successful load
      const handleCanPlay = () => {
        setIsLoaded(true)
        audioRef.current = audio
        audio.volume = options.volume || 0.5
        audio.loop = options.loop || false
      }
      
      // Handle load error (file not found)
      const handleError = () => {
        console.warn(`Sound file not found: ${src}`)
        setIsLoaded(false)
        audioRef.current = null
      }
      
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('error', handleError)
      
      // Try to load the audio
      audio.load()

      return () => {
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
      }
    }
  }, [src, options.volume, options.loop])

  const play = useCallback(() => {
    if (audioRef.current && isLoaded) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }, [isLoaded])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  return { play, pause, stop, isLoaded }
}

// Generate simple notification sounds using Web Audio API
function generateNotificationSound(type: 'notification' | 'success' | 'error') {
  if (typeof window === 'undefined') return null
  
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // Different frequencies for different notification types
  switch (type) {
    case 'notification':
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      break
    case 'success':
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
      break
    case 'error':
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1)
      break
  }
  
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
  
  return audioContext
}

// Predefined sound hooks using generated sounds
export function useNotificationSound() {
  const play = useCallback(() => {
    generateNotificationSound('notification')
  }, [])
  
  return { play, pause: () => {}, stop: () => {}, isLoaded: true }
}

export function useSuccessSound() {
  const play = useCallback(() => {
    generateNotificationSound('success')
  }, [])
  
  return { play, pause: () => {}, stop: () => {}, isLoaded: true }
}

export function useErrorSound() {
  const play = useCallback(() => {
    generateNotificationSound('error')
  }, [])
  
  return { play, pause: () => {}, stop: () => {}, isLoaded: true }
}
