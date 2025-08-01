"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Importando os logos dos modelos
import gptLogo from "@/assets/_icons-model-ai/gpt.svg"
import claudeLogo from "@/assets/_icons-model-ai/claude.svg"
import geminiLogo from "@/assets/_icons-model-ai/gemini.svg"

const models = [
  {
    value: "gpt-4",
    label: "GPT-4",
    logo: gptLogo
  },
  {
    value: "gpt-3.5",
    label: "GPT-3.5 Turbo",
    logo: gptLogo
  },
  {
    value: "claude",
    label: "Claude 3",
    logo: claudeLogo
  },
  {
    value: "gemini",
    label: "Gemini Pro",
    logo: geminiLogo
  },
]

interface ModelComboboxProps {
  value: string
  onValueChange: (value: string) => void
}

export function ModelCombobox({ value, onValueChange }: ModelComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedModel = models.find((model) => model.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-auto px-2 hover:bg-gray-50 border-0 justify-between gap-1"
          title="Selecionar modelo de IA"
        >
          <div className="flex items-center gap-1.5">
            {selectedModel && (
              <img 
                src={selectedModel.logo} 
                alt={selectedModel.label}
                className="w-4 h-4 object-contain"
              />
            )}
            <span className="text-xs text-gray-600 font-medium">
              {selectedModel?.label || "Modelo"}
            </span>
          </div>
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar modelo..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.value}
                  value={model.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={model.logo} 
                      alt={model.label}
                      className="w-4 h-4 object-contain"
                    />
                    {model.label}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto w-4 h-4",
                      value === model.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}