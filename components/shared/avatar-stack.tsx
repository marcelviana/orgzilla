"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * AvatarStack - Display overlapping avatars (for teams/projects)
 * 
 * @example
 * <AvatarStack
 *   people={project.team}
 *   max={6}
 *   size="md"
 *   onClick={(person) => navigate(`/pessoas/${person.id}`)}
 * />
 */

interface Person {
  name: string
  avatar?: string
}

interface AvatarStackProps {
  people: Person[]
  max?: number
  size?: "sm" | "md" | "lg"
  onClick?: (person: Person) => void
}

export function AvatarStack({
  people,
  max = 5,
  size = "md",
  onClick,
}: AvatarStackProps) {
  const visiblePeople = people.slice(0, max)
  const remainingCount = people.length - max

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorFromName = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {visiblePeople.map((person, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Avatar
                className={`${sizeClasses[size]} border-2 border-white cursor-pointer hover:z-10 transition-transform hover:scale-110`}
                onClick={() => onClick?.(person)}
              >
                {person.avatar ? (
                  <AvatarImage src={person.avatar || "/placeholder.svg"} alt={person.name} />
                ) : null}
                <AvatarFallback className={getColorFromName(person.name)}>
                  <span className="text-white font-medium">
                    {getInitials(person.name)}
                  </span>
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{person.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`${sizeClasses[size]} rounded-full bg-gray-200 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors`}
              >
                <span className="text-muted-foreground font-medium text-xs">
                  +{remainingCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} mais pessoas</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
