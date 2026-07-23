import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Download, Shield, Clock, FileUp, Flame } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            NotesBhejo
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/send">Send</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/receive">Receive</Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
            Share Notes & Files Securely with a PIN
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto text-pretty">
            Send private notes and files to anyone. They just need the PIN to access it. No accounts required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/send">
                <Send className="mr-2 h-4 w-4" />
                Send a Note
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/receive">
                <Download className="mr-2 h-4 w-4" />
                Receive a Note
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">1. Write Your Note</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Type your message and/or attach a file. Set an expiration time for added security.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">2. Get Your PIN</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receive a unique 6-digit PIN that you can share with the intended recipient.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">3. Share the PIN</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  The recipient enters the PIN to instantly access and download your note or file.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-8">Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">No Account Required</h3>
                <p className="text-sm text-muted-foreground">
                  Start sharing immediately without signing up. Just write and share.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Auto-Expiring Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Set notes to expire from 1 hour to 7 days for extra privacy.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">File Attachments</h3>
                <p className="text-sm text-muted-foreground">
                  Share files up to 50MB along with your notes securely.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Burn After Reading</h3>
                <p className="text-sm text-muted-foreground">
                  Enable one-time viewing - notes are deleted after being read.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          NotesBhejo - Simple and secure note sharing
        </div>
      </footer>
    </main>
  )
}
