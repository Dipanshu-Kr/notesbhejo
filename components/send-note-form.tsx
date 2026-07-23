"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Copy, Check, Send, ArrowLeft, Upload, X, FileText, Image, File, Film, Music } from "lucide-react"
import Link from "next/link"

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

export function SendNoteForm() {
  const [content, setContent] = useState("")
  const [expiration, setExpiration] = useState("24")
  const [burnAfterReading, setBurnAfterReading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pin, setPin] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copiedPin, setCopiedPin] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      if (content.trim()) {
        formData.append("content", content.trim())
      }
      formData.append("expirationHours", expiration)
      formData.append("burnAfterReading", burnAfterReading.toString())
      if (file) {
        formData.append("file", file)
      }

      const response = await fetch("/api/notes", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create note")
      }

      setPin(data.pin)
      setQrCode(data.qrCode)
      setShareUrl(data.shareUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  function removeFile() {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function copyPin() {
  if (!pin) return

  await navigator.clipboard.writeText(pin)
  setCopiedPin(true)

  setTimeout(() => {
    setCopiedPin(false)
  }, 2000)
}

  function resetForm() {
    setContent("")
    setExpiration("24")
    setBurnAfterReading(false)
    setFile(null)
    setPin(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (pin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Note Created!</CardTitle>
          <CardDescription>
            Share this PIN with the recipient to access the note
            {burnAfterReading && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                This note will be deleted after viewing
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-4xl font-mono font-bold tracking-[0.3em] bg-muted px-6 py-4 rounded-lg">
              {pin}
            </div>
          </div>
          {qrCode && (
  <div className="flex justify-center mt-6">
    <img
      src={qrCode}
      alt="QR Code"
      className="w-52 h-52 border rounded-xl"
    />
  </div>
)}
          <Button onClick={copyPin} variant="outline" className="w-full">
            {copiedPin ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy PIN
              </>

            )}
          </Button>
          {shareUrl && (
  <Button
  variant="outline"
  className="w-full"
  onClick={async () => {
    if (!shareUrl) return

    await navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)

    setTimeout(() => {
      setCopiedLink(false)
    }, 2000)
  }}
>
  {copiedLink ? (
    <>
      <Check className="mr-2 h-4 w-4" />
      Copied!
    </>
  ) : (
    <>
      <Copy className="mr-2 h-4 w-4" />
      Copy Link
    </>
  )}
</Button>
)}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={resetForm}>
              Send Another
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
        <CardTitle>Send a Note</CardTitle>
        <CardDescription>
          Write your message and/or attach a file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Your Note (optional if file attached)
            </label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/10000 characters
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Attach File (optional, max 50MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="expiration" className="text-sm font-medium">
              Expires After
            </label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Burn After Reading Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <label htmlFor="burn" className="text-sm font-medium cursor-pointer">
                Burn After Reading
              </label>
              <p className="text-xs text-muted-foreground">
                Delete note immediately after viewing
              </p>
            </div>
            <Switch
              id="burn"
              checked={burnAfterReading}
              onCheckedChange={setBurnAfterReading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
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
              disabled={isLoading || (!content.trim() && !file)}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Note
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
