"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Copy, Check, ArrowLeft, Download, FileText, Image, File, Film, Music, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface NoteData {
  id: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileType: string | null
  fileSize: number | null
  burnAfterReading: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="h-5 w-5" />
  if (type.startsWith("video/")) return <Film className="h-5 w-5" />
  if (type.startsWith("audio/")) return <Music className="h-5 w-5" />
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return <FileText className="h-5 w-5" />
  return <File className="h-5 w-5" />
}

export function ReceiveNoteForm() {
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [noteData, setNoteData] = useState<NoteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const searchParams = useSearchParams()

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 6) {
      setPin(pastedData.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  useEffect(() => {
  const urlPin = searchParams.get("pin")

  if (!urlPin || !/^\d{6}$/.test(urlPin)) return

  setPin(urlPin.split(""))

  async function fetchNote() {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/notes?pin=${urlPin}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to retrieve note")
      }

      setNoteData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  fetchNote()
}, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullPin = pin.join("")
    if (fullPin.length !== 6) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/notes?pin=${fullPin}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to retrieve note")
      }

      setNoteData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  async function copyNote() {
    if (!noteData?.content) return
    await navigator.clipboard.writeText(noteData.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadAsTxt() {
    if (!noteData?.content) return
    const blob = new Blob([noteData.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `note-${pin.join("")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const [isDownloading, setIsDownloading] = useState(false)

  async function downloadFile() {
    if (!noteData?.fileUrl || !noteData?.fileName) return
    
    setIsDownloading(true)
    try {
      // Fetch the file as a blob to handle cross-origin downloads
      const response = await fetch(noteData.fileUrl)
      if (!response.ok) throw new Error("Failed to fetch file")
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = noteData.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Download error:", error)
      // Fallback: open in new tab
      window.open(noteData.fileUrl, "_blank")
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
  if (!noteData?.burnAfterReading) return;

  const handleLeave = () => {
    navigator.sendBeacon(
      "/api/notes/delete",
      new Blob(
        [JSON.stringify({ id: noteData.id })],
        { type: "application/json" }
      )
    );
  };

  window.addEventListener("beforeunload", handleLeave);

  return () => {
    handleLeave(); // Back button ya page change
    window.removeEventListener("beforeunload", handleLeave);
  };
}, [noteData]);

  function resetForm() {
    setPin(["", "", "", "", "", ""])
    setNoteData(null)
    setError(null)
    inputRefs.current[0]?.focus()
  }

  const isComplete = pin.every((digit) => digit !== "")

  if (noteData) {
    const hasContent = !!noteData.content
    const hasFile = !!noteData.fileUrl

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Note</CardTitle>
              <CardDescription>Retrieved successfully</CardDescription>
            </div>
            {hasContent && (
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={downloadAsTxt} title="Save as .txt">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={copyNote} title="Copy to clipboard">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {noteData.burnAfterReading && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">This note has been deleted after viewing</p>
            </div>
          )}

          {hasContent && (
            <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm">{noteData.content}</p>
            </div>
          )}

          {hasFile && noteData.fileName && noteData.fileType && noteData.fileSize && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(noteData.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{noteData.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(noteData.fileSize)}</p>
                </div>
              </div>

              {noteData.fileType.startsWith("image/") && (
                <div className="rounded-lg overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={noteData.fileUrl} 
                    alt={noteData.fileName}
                    className="w-full h-auto max-h-48 object-contain"
                  />
                </div>
              )}

              <Button onClick={downloadFile} variant="outline" className="w-full" disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Spinner className="mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={resetForm}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Get Another
            </Button>
            <Button variant="ghost" className="flex-1" asChild>
              <Link href="/">Back Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Receive a Note</CardTitle>
        <CardDescription>
          Enter the 6-digit PIN to access the shared note
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-mono font-bold"
                aria-label={`PIN digit ${index + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !isComplete}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Retrieving...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Get Note
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
