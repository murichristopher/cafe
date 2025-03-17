"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked)
    }
  }

  return (
    <div className="relative flex items-center">
      <input
        type="checkbox"
        className="absolute h-4 w-4 opacity-0"
        checked={checked}
        onChange={handleChange}
        {...props}
      />
      <div
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-sm border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
          className,
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </div>
    </div>
  )
}

