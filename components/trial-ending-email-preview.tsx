import Link from 'next/link'

type TrialEndingEmailPreviewProps = {
  contractorName?: string
  daysLeft?: number
  planLabel?: string
  planPrice?: string
  chargeDate?: string
  dashboardUrl?: string
}

export function TrialEndingEmailPreview({
  contractorName = '[Szaki Neve]',
  daysLeft = 3,
  planLabel = 'Éves előfizetés',
  planPrice = '49 990 Ft / év',
  chargeDate = '2026. szeptember 4.',
  dashboardUrl = '/dashboard',
}: TrialEndingEmailPreviewProps) {
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-[0_1px_3px_rgb(18_32_51/0.08),0_18px_45px_rgb(18_32_51/0.16)]">
      {/* Email client meta row */}
      <div className="flex flex-col gap-1 border-b border-border/60 bg-muted/50 px-5 py-4 sm:px-8">
        <p className="text-sm font-bold text-foreground">Mesterek.eu</p>
        <p className="text-xs text-muted-foreground">
          Emlékeztető: a próbaidőszakod {daysLeft} nap múlva lejár
        </p>
      </div>

      {/* Brand header */}
      <header className="border-b-4 border-accent bg-primary px-6 py-7 text-center">
        <p className="text-2xl font-black tracking-tight text-primary-foreground">
          Mesterek<span className="text-accent">.eu</span>
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
          Kiemelt Mester
        </p>
      </header>

      {/* Body */}
      <div className="flex flex-col gap-4 px-5 py-7 sm:px-8">
        <p className="text-lg font-bold text-foreground">Kedves {contractorName}!</p>

        <p className="leading-relaxed text-muted-foreground">
          Reméljük, sok új megkeresést hozott számodra az elmúlt 2 hónap! Ez egy automatikus emlékeztető, hogy a
          Kiemelt Mester 60 napos ingyenes próbaidőszakod {daysLeft} nap múlva lejár.
        </p>

        <p className="leading-relaxed text-muted-foreground">
          <strong className="font-bold text-foreground">Hogyan tovább? Semmi teendőd nincs!</strong> Hogy a profilod
          továbbra is a lista élén maradjon a hívás gombbal, az előfizetésed automatikusan élesedik a választott
          csomaggal.
        </p>

        {/* Info box */}
        <dl className="flex flex-col gap-3 rounded-xl bg-muted px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-sm font-bold text-muted-foreground">Választott csomag</dt>
            <dd className="text-base font-black text-foreground">
              {planLabel} <span className="whitespace-nowrap">({planPrice})</span>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border/60 pt-3">
            <dt className="text-sm font-bold text-muted-foreground">Első terhelés napja</dt>
            <dd className="text-base font-bold text-foreground">{chargeDate}</dd>
          </div>
        </dl>

        <p className="leading-relaxed text-muted-foreground">
          A korrektség hívei vagyunk: ha bármilyen okból szüneteltetnéd a fiókodat, kötbér nélkül lemondhatod a terhelés
          előtt.
        </p>

        <Link href={dashboardUrl} className="btn-primary mt-1 w-full text-base">
          Irány a Kiemelt Mester fiókom
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/40 px-6 py-6 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ezt az üzenetet a Stripe biztonságos fizetési rendszere generálta a Mesterek.eu megbízásából.
          <br />
          2026 &copy; Mesterek.eu
        </p>
      </footer>
    </div>
  )
}
