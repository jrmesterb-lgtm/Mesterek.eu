import type { Metadata } from 'next'
import { ChevronDown, CircleHelp, UserRound, Wrench } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'GYIK / Segítség',
  description: 'Válaszok a Mesterek alkalmazás használatával, az SOS gyorsszolgálattal és a szakember-regisztrációval kapcsolatos gyakori kérdésekre.',
}

const customerQuestions = [
  {
    question: 'Mennyibe kerül az applikáció használata?',
    answer: 'Az applikáció használata a felhasználók számára teljesen díjmentes. Nem számítunk fel közvetítői díjat a keresésért vagy a kapcsolatfelvételért.',
  },
  {
    question: 'Hogyan biztosítják a szakemberek megbízhatóságát?',
    answer: 'Minden regisztrált szakembert ellenőrzünk a megjelenés előtt. Az értékelések és visszajelzések szintén segítenek a magas minőség fenntartásában.',
  },
  {
    question: 'Mit tegyek, ha sürgős segítségre van szükségem (pl. csőtörés)?',
    answer: 'Használja a főoldalon található „SOS Gyorsszolgálat 0–24” gombot, amellyel azonnal elérheti a környékbeli ügyeletes szakembereket.',
  },
  {
    question: 'Lehet-e közvetlenül az appon keresztül fizetni?',
    answer: 'A Mesterek app egy közvetítő platform: a szakemberrel való elszámolás minden esetben közvetlenül a mester és a megrendelő között történik.',
  },
]

const contractorQuestions = [
  {
    question: 'Hogyan regisztrálhatok szakemberként az oldalra?',
    answer: 'A „Szakember-regisztráció” menüpont alatt töltheti ki adatlapját. Ellenőrzés után rövid időn belül aktiváljuk a profilját.',
  },
  {
    question: 'Hogyan kerülhetek be az SOS 0–24-es listába?',
    answer: 'A profilbeállításokban bejelölheti az „Éjjel-nappali ügyelet” opciót, így a rendszer automatikusan megjeleníti az SOS listában is az eredeti szakmája mellett.',
  },
  {
    question: 'Módosíthatom később a profilomat és az adataimat?',
    answer: 'Igen, az „Adminisztráció” menüpont alatt bármikor frissítheti elérhetőségeit vagy tevékenységi köreit.',
  },
]

type FaqSectionProps = {
  title: string
  description: string
  questions: typeof customerQuestions
  icon: typeof UserRound
}

function FaqSection({ title, description, questions, icon: Icon }: FaqSectionProps) {
  return (
    <section aria-labelledby={`${title}-title`} className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 id={`${title}-title`} className="text-2xl font-black text-foreground md:text-3xl">{title}</h2>
          <p className="mt-1 text-pretty leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {questions.map(({ question, answer }) => (
          <details key={question} className="group rounded-2xl border-2 border-border bg-card text-card-foreground shadow-sm open:border-accent">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold marker:hidden focus-visible:outline-4 focus-visible:outline-offset-2 md:text-lg">
              <span>{question}</span>
              <ChevronDown className="size-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="border-t border-border px-5 py-4 leading-relaxed text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default function HelpPage() {
  return (
    <AppShell>
      <main className="page-wrap max-w-5xl">
        <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CircleHelp className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="page-title text-balance">GYIK / Segítség</h1>
            <p className="page-lead text-pretty">Gyors válaszok a Mesterek használatával és a szakemberként történő csatlakozással kapcsolatos legfontosabb kérdésekre.</p>
          </div>
        </header>
        <div className="mt-10 flex flex-col gap-12">
          <FaqSection title="Ügyfeleknek" description="Minden, amit a keresésről, a kapcsolatfelvételről és az SOS szolgáltatásról tudni érdemes." questions={customerQuestions} icon={UserRound} />
          <FaqSection title="Szakembereknek" description="Hasznos tudnivalók a regisztrációról, profilkezelésről és az SOS listáról." questions={contractorQuestions} icon={Wrench} />
        </div>
      </main>
    </AppShell>
  )
}
