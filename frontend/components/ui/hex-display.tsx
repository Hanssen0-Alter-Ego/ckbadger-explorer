'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HexDisplayProps {
  value: string;
  truncate?: boolean;
  startChars?: number;
  endChars?: number;
  groupSize?: number;
  showGroupHighlight?: boolean;
  copyable?: boolean;
  color?: 'aqua' | 'lavender' | 'gold' | 'rouge';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  mono?: boolean;
}

export function HexDisplay({
  value,
  truncate = true,
  startChars = 10,
  endChars = 8,
  copyable = true,
  color = 'aqua',
  size = 'md',
  className,
  mono = true,
}: HexDisplayProps) {
  const [copied, setCopied] = useState(false);

  const cleanValue = value.startsWith('0x') ? value.slice(2) : value;
  const prefix = value.startsWith('0x') ? '0x' : '';

  const displayValue = useMemo(() => {
    if (!truncate || cleanValue.length <= startChars + endChars) {
      return cleanValue;
    }
    return `${cleanValue.slice(0, startChars)}...${cleanValue.slice(-endChars)}`;
  }, [cleanValue, truncate, startChars, endChars]);

  const handleCopy = async () => {
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const prefixColorClasses = {
    aqua: 'text-aqua-dim',
    lavender: 'text-lavender-dim',
    gold: 'text-gold-dim',
    rouge: 'text-rouge-dim',
  };

  const allowWrap = !truncate;

  if (copied) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1',
          allowWrap && 'max-w-full flex-wrap break-all',
          mono && 'font-mono',
          sizeClasses[size],
          className
        )}
      >
        <span className="text-jade animate-confirm-fade">Copied</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center transition-colors duration-150',
        prefixColorClasses[color],
        allowWrap && 'max-w-full flex-wrap break-all',
        mono && 'font-mono',
        sizeClasses[size],
        copyable && 'cursor-pointer hover:opacity-90',
        className
      )}
      data-identity-hex
      onClick={handleCopy}
      title={copyable ? `Click to copy: ${value}` : value}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}

      {displayValue}
    </span>
  );
}

interface ByteGroupDisplayProps {
  value: string;
  bytesPerGroup?: number;
  separator?: string;
  color?: 'aqua' | 'lavender' | 'gold' | 'rouge';
  className?: string;
}

export function ByteGroupDisplay({
  value,
  bytesPerGroup = 4,
  separator = ' ',
  color = 'aqua',
  className,
}: ByteGroupDisplayProps) {
  const cleanValue = value.startsWith('0x') ? value.slice(2) : value;
  const prefix = value.startsWith('0x') ? '0x' : '';

  const groups = useMemo(() => {
    const charsPerGroup = bytesPerGroup * 2;
    const result: string[] = [];

    for (let i = 0; i < cleanValue.length; i += charsPerGroup) {
      result.push(cleanValue.slice(i, i + charsPerGroup));
    }

    return result;
  }, [cleanValue, bytesPerGroup]);

  const colorClasses = {
    aqua: ['text-aqua', 'text-aqua-dim'],
    lavender: ['text-lavender', 'text-lavender-dim'],
    gold: ['text-gold', 'text-gold-dim'],
    rouge: ['text-rouge', 'text-rouge-dim'],
  };

  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {prefix && <span className="text-text-dim">{prefix}</span>}
      {groups.map((group, index) => (
        <span key={index}>
          <span className={colorClasses[color][index % 2]}>{group}</span>
          {index < groups.length - 1 && <span className="text-text-dim">{separator}</span>}
        </span>
      ))}
    </span>
  );
}
