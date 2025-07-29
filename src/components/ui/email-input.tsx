import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  id,
  value,
  onChange,
  error,
  placeholder = "usuario"
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
        />
        <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
          @sensoramadesign.com.br
        </span>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};