import React, { useState, useEffect, useRef } from 'react';
import { Lock, X } from 'lucide-react';

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title: string;
  description?: string;
  error?: string;
  remainingAttempts?: number;
}

const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  error,
  remainingAttempts
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Move to next input if value is entered
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Submit if all digits are entered
    if (value && index === 3) {
      onSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-sm mx-4 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {description && (
          <p className="text-sm text-gray-400 mb-6">{description}</p>
        )}

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={e => handlePinChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className={`w-12 h-12 text-center text-xl font-semibold bg-white/5 border rounded-lg focus:ring-2 transition-all ${
                error
                  ? 'border-red-500 text-red-400 focus:ring-red-500/20'
                  : 'border-gray-700 text-white focus:ring-purple-500/20 focus:border-purple-500'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-center mb-4">
            <p className="text-sm text-red-400">{error}</p>
            {typeof remainingAttempts === 'number' && (
              <p className="text-xs text-gray-400 mt-1">
                {remainingAttempts} tentativas restantes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinDialog;