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
import { isApiConfigured } from "@/lib/apiHealthCheck"

// Importando os logos dos modelos
import gptLogo from "@/assets/_icons-model-ai/gpt.svg"
import claudeLogo from "@/assets/_icons-model-ai/claude.svg"
import geminiLogo from "@/assets/_icons-model-ai/gemini.svg"

const models = [
  {
    value: "openai",
    label: "GPT-4o",
    logo: "/src/assets/_icons-model-ai/gpt.svg"
  },
  {
    value: "anthropic",
    label: "Claude 3.5 Sonnet",
    logo: "/src/assets/_icons-model-ai/claude.svg"
  },
  {
    value: "google",
    label: "Gemini 2.0 Flash",
    logo: "/src/assets/_icons-model-ai/gemini.svg"
  }
]

interface ModelComboboxProps {
  value: string
  onValueChange: (value: string) => void
}

// Componente para indicador de status
function StatusIndicator({ provider }: { provider: string }) {
  const isConfigured = isApiConfigured(provider)
  
  const getStatusColor = () => {
    return isConfigured ? 'bg-green-500' : 'bg-red-500'
  }

  const getTooltipText = () => {
    return isConfigured 
      ? `${provider.toUpperCase()}: Configurado` 
      : `${provider.toUpperCase()}: Não configurado`
  }

  return (
    <div className="relative group">
      <div 
        className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} border border-white shadow-sm`}
        title={getTooltipText()}
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {getTooltipText()}
      </div>
    </div>
  )
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
              <>
                <img 
                  src={selectedModel.logo} 
                  alt={selectedModel.label}
                  className="w-4 h-4 object-contain"
                />
                <StatusIndicator provider={selectedModel.value} />
              </>
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
                    <div className="relative">
                      <img 
                        src={model.logo} 
                        alt={model.label}
                        className="w-4 h-4 object-contain"
                      />
                      <div className="absolute -top-0.5 -right-0.5">
                        <StatusIndicator provider={model.value} />
                      </div>
                    </div>
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