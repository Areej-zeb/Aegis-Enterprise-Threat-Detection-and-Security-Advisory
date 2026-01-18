"use client"

import { useWindowStore } from "@/store/window-store"
import { useSystemSounds } from "@/hooks/use-system-sounds"
import { desktopIcons } from "@/lib/apps"
import { DesktopIcon } from "./desktop-icon"
import { Window } from "./window"
import { Taskbar } from "./taskbar"
import { useEffect, useRef } from "react"

export function Desktop() {
  const { windows, setStartMenuOpen, openWindow } = useWindowStore()
  const { playOpen } = useSystemSounds()
  const videoRef = useRef<HTMLVideoElement>(null)

  const prevWindowCountRef = useRef(windows.length)

  useEffect(() => {
    // Play sound when a new window is opened
    if (windows.length > prevWindowCountRef.current) {
      playOpen()
    }
    prevWindowCountRef.current = windows.length
  }, [windows.length, playOpen])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure video plays smoothly and loops continuously
    const handleCanPlay = () => {
      // Video is ready to play
      if (video.paused) {
        video.play().catch(() => {
          // Autoplay was prevented, but that's okay - user interaction will start it
        })
      }
    }

    const handleLoadedMetadata = () => {
      // Video metadata loaded, ensure loop is set
      video.loop = true
    }

    const handleLoadedData = () => {
      // Video data loaded, start playback
      video.loop = true
      if (video.paused) {
        video.play().catch(() => {})
      }
    }

    const handleTimeUpdate = () => {
      // Ensure video continues playing (prevent stalling)
      if (video.paused && video.readyState >= 2) {
        video.play().catch(() => {})
      }
    }

    const handleError = (e: Event) => {
      // Silently handle video load errors - fallback sources will be tried
      const video = e.target as HTMLVideoElement
      if (video.error) {
        // Only log if all sources failed
        if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
          console.warn("Video background: No video sources available")
        }
      }
    }

    // Prevent video from pausing when tab is hidden (for smooth looping)
    const handleVisibilityChange = () => {
      if (!document.hidden && video.paused) {
        video.play().catch(() => {})
      }
    }

    // Ensure video properties are set for looping
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.setAttribute("loop", "true")

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("error", handleError)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Start playback if video is already loaded
    if (video.readyState >= 2) {
      video.play().catch(() => {})
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("error", handleError)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none" onClick={() => setStartMenuOpen(false)}>
      {/* Desktop wallpaper - Video background - Plays from /public folder */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          willChange: "auto",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onError={(e) => {
          // Video error - will try fallback sources automatically
          const video = e.currentTarget
          if (video.error && video.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            console.warn("Video format not supported, trying fallback sources")
          }
        }}
        onLoadedMetadata={() => {
          // Ensure loop is set when metadata loads
          const video = videoRef.current
          if (video) {
            video.loop = true
          }
        }}
      >
        <source src="/back.mp4" type="video/mp4" />
        <source src="/back2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Desktop icons */}
      <div className="absolute inset-0 pb-12">
        {desktopIcons.map((icon) => (
          <DesktopIcon key={icon.id} icon={icon} />
        ))}
      </div>

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window} />
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  )
}
