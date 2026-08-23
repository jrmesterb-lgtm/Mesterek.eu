type HeroTaglineProps = {
  text: string
  className?: string
}

export function HeroTagline({ text, className }: HeroTaglineProps) {
  const words = text.split(' ')
  return (
    <p className={className} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true" className="hero-word" style={{ '--word-index': index } as React.CSSProperties}>
          {word}
          {index < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </p>
  )
}
