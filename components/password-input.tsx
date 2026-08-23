'use client'

import { InputHTMLAttributes, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Password field with a show/hide toggle. It preserves the existing `field-input`
// styling and forwards every native input prop (name, autoComplete, required,
// minLength, pattern, aria-*, …), so form validation and submission behave
// exactly as before — only the visibility toggle is added.
export function PasswordInput({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [showPassword, setShowPassword] = useState(false)
  const labelId = useId()

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={`field-input pr-12 ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
        aria-pressed={showPassword}
        aria-describedby={labelId}
        className="absolute inset-y-0 right-0 flex items-center bg-transparent px-3 text-muted-foreground transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  )
}
