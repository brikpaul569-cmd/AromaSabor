'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface ClientIdentityDialogProps {
  proposalClientName: string;
  proposalToken: string;
  onClaim: (name: string) => void;
  isClaimed: boolean;
}

export default function ClientIdentityDialog({
  proposalClientName,
  proposalToken,
  onClaim,
  isClaimed,
}: ClientIdentityDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const storageKey = 'claimed_' + proposalToken;

  useEffect(() => {
    if (isClaimed) return;
    const claimed = localStorage.getItem(storageKey);
    if (!claimed) {
      setShowDialog(true);
    }
    setCheckedStorage(true);
  }, [storageKey, isClaimed]);

  // Render nothing while checking localStorage, to avoid flash
  if (!checkedStorage || isClaimed) return null;

  const handleConfirm = () => {
    const name = proposalClientName;
    localStorage.setItem(storageKey, name);
    setShowDialog(false);
    onClaim(name);
  };

  const handleGuest = () => {
    const guestName = name.trim() || 'Invitado';
    localStorage.setItem(storageKey, guestName);
    setShowDialog(false);
    onClaim(guestName);
  };

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-gray-900/95 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white">
          {t('claim.title', { name: proposalClientName })}
        </h2>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleConfirm}
            data-testid="claim-confirm"
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
          >
            {t('claim.confirm')}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-gray-500">{t('common.or')}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('claim.namePlaceholder')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
          <button
            onClick={handleGuest}
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/15"
          >
            {t('claim.guest')}
          </button>
        </div>
      </div>
    </div>
  );
}
