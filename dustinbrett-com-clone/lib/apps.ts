import type { AppDefinition, DesktopIconData } from "@/types/os"

export const apps: Record<string, AppDefinition> = {
  "file-explorer": {
    id: "file-explorer",
    title: "Files",
    icon: "/fileexplorer.png",
    defaultWidth: 900,
    defaultHeight: 600,
    minWidth: 500,
    minHeight: 400,
  },
  "my-computer": {
    id: "my-computer",
    title: "This PC",
    icon: "/this pc.ico",
    defaultWidth: 900,
    defaultHeight: 600,
  },
  notepad: {
    id: "notepad",
    title: "Notepad",
    icon: "/notepad.png",
    defaultWidth: 700,
    defaultHeight: 500,
    allowMultiple: true,
  },
  terminal: {
    id: "terminal",
    title: "Terminal",
    icon: "/terminal.png",
    defaultWidth: 800,
    defaultHeight: 500,
  },
  browser: {
    id: "browser",
    title: "Browser",
    icon: "/chrome.png",
    defaultWidth: 1100,
    defaultHeight: 700,
    minWidth: 600,
    minHeight: 400,
  },
  settings: {
    id: "settings",
    title: "Settings",
    icon: "/Settings.ico",
    defaultWidth: 900,
    defaultHeight: 650,
  },
  "recycle-bin": {
    id: "recycle-bin",
    title: "Recycle Bin",
    icon: "/Trash Full.ico",
    defaultWidth: 800,
    defaultHeight: 500,
  },
  about: {
    id: "about",
    title: "About Me",
    icon: "/Info.ico",
    defaultWidth: 600,
    defaultHeight: 500,
  },
  devtools: {
    id: "devtools",
    title: "DevTools",
    icon: "/icon-dark-32x32.png",
    defaultWidth: 900,
    defaultHeight: 600,
  },
  irc: {
    id: "irc",
    title: "IRC",
    icon: "/icon-dark-32x32.png",
    defaultWidth: 800,
    defaultHeight: 550,
  },
  marked: {
    id: "marked",
    title: "Marked",
    icon: "/icon-dark-32x32.png",
    defaultWidth: 800,
    defaultHeight: 600,
  },
  messenger: {
    id: "messenger",
    title: "Messenger",
    icon: "/messenger.png",
    defaultWidth: 400,
    defaultHeight: 600,
  },
  monaco: {
    id: "monaco",
    title: "Monaco Editor",
    icon: "/monaco.png",
    defaultWidth: 1000,
    defaultHeight: 700,
  },
  paint: {
    id: "paint",
    title: "Paint",
    icon: "/paint.png",
    defaultWidth: 900,
    defaultHeight: 650,
  },
  pdf: {
    id: "pdf",
    title: "PDF Viewer",
    icon: "/pdf.png",
    defaultWidth: 800,
    defaultHeight: 700,
  },
  photos: {
    id: "photos",
    title: "Photo Viewer",
    icon: "/photos.png",
    defaultWidth: 900,
    defaultHeight: 650,
  },
  projects: {
    id: "projects",
    title: "Projects",
    icon: "/folder.png",
    defaultWidth: 900,
    defaultHeight: 600,
    minWidth: 500,
    minHeight: 400,
  },
}

export const desktopIcons: DesktopIconData[] = [
  { id: "icon-1", title: "This PC", icon: "/this pc.ico", appId: "my-computer", gridPosition: { row: 0, col: 0 } },
  { id: "icon-2", title: "File Explorer", icon: "/fileexplorer.png", appId: "file-explorer", gridPosition: { row: 1, col: 0 } },
  { id: "icon-3", title: "Pictures", icon: "/photos.png", appId: "file-explorer", gridPosition: { row: 2, col: 0 } },
  { id: "icon-4", title: "Music", icon: "/Library Music.ico", appId: "file-explorer", gridPosition: { row: 3, col: 0 } },
  { id: "icon-5", title: "Recycle Bin", icon: "/Trash Full.ico", appId: "recycle-bin", gridPosition: { row: 4, col: 0 } },
  { id: "icon-6", title: "Notepad", icon: "/notepad.png", appId: "notepad", gridPosition: { row: 0, col: 1 } },
  { id: "icon-7", title: "Terminal", icon: "/terminal.png", appId: "terminal", gridPosition: { row: 1, col: 1 } },
  { id: "icon-8", title: "Browser", icon: "/chrome.png", appId: "browser", gridPosition: { row: 2, col: 1 } },
  { id: "icon-9", title: "Settings", icon: "/Settings.ico", appId: "settings", gridPosition: { row: 3, col: 1 } },
  { id: "icon-10", title: "About Me", icon: "/Info.ico", appId: "about", gridPosition: { row: 0, col: 2 } },
  { id: "icon-11", title: "Projects", icon: "/folder.png", appId: "projects", gridPosition: { row: 1, col: 2 } },
]

export const pinnedApps = [apps["file-explorer"], apps["browser"], apps["notepad"], apps["terminal"], apps["settings"]]

export const startMenuApps = [
  apps["browser"],
  apps["file-explorer"],
  apps["messenger"],
  apps["monaco"],
  apps["notepad"],
  apps["paint"],
  apps["pdf"],
  apps["photos"],
  apps["terminal"],
  apps["settings"],
]

export interface AppCategory {
  id: string
  label: string
  apps: AppDefinition[]
}

export const appCategories: AppCategory[] = [
  {
    id: "development",
    label: "Development",
    apps: [apps["terminal"], apps["monaco"]],
  },
  {
    id: "internet",
    label: "Internet",
    apps: [apps["browser"], apps["messenger"]],
  },
  {
    id: "graphics",
    label: "Graphics",
    apps: [apps["paint"], apps["photos"]],
  },
  {
    id: "office",
    label: "Office",
    apps: [apps["notepad"], apps["pdf"]],
  },
  {
    id: "system",
    label: "System",
    apps: [apps["file-explorer"], apps["my-computer"], apps["settings"], apps["recycle-bin"]],
  },
]
