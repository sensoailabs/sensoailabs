import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  id,
  value,
  onChange,
  error,
  placeholder = "usuario",
  disabled = false
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-2">
      <div className="flex">
        <Input
          id={inputId}
          className={cn(
            "rounded-r-none border-r-0 focus:z-10",
            error ? 'border-destructive focus-visible:ring-destructive' : ''
          )}
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <span className={cn(
          "inline-flex items-center rounded-r-md border border-l-0 border-input px-3 text-sm",
          disabled ? "bg-muted text-muted-foreground/50" : "bg-muted text-muted-foreground"
        )}>
          @sensoramadesign.com.br
        </span>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};