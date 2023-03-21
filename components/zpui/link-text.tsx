import { PropsWithChildren } from "react"
import { Link2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface LinkTextProps {
  className?: string
  label?: string
  content?: string
  href?: string
  keepLeft?: number
  keepRight?: number
}

export function LinkText(props: PropsWithChildren & LinkTextProps) {
  const keepLeft = props.keepLeft || 4
  const keepRight = props.keepRight || 4

  const regex = new RegExp(`^(.{${keepLeft}}).*(.{${keepRight}})$`)
  const content = props.content?.replace(regex, "$1...$2")

  return (
    <p className={cn(props.className, "flex items-center")}>
      {props.label}:&nbsp;{content}
      <a target="_blank" href={props.href} title="Open in new tab">
        <Link2 className="ml-1 h-5 w-5 cursor-pointer text-sky-500" />
      </a>
    </p>
  )
}
