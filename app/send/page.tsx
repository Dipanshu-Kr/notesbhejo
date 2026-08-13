import { SendNoteForm } from "@/components/send-note-form"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function SendPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            NotesBhejo
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <SendNoteForm />
      </section>
    </main>
  )
}
