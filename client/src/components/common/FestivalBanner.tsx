import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { paymentService, FestivalOffer } from '../../services/payment.service';

export const FestivalBanner: React.FC = () => {
  const [offer, setOffer] = useState<FestivalOffer | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    paymentService
      .getPublicPaymentConfig()
      .then((data) => {
        if (data?.festivalOffer?.isActive) {
          setOffer(data.festivalOffer);
        }
      })
      .catch(() => {
        // Silent fallback
      });
  }, []);

  if (!offer || !offer.isActive || dismissed) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 text-slate-950 px-4 py-2 text-xs font-medium z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
          <div className="p-1 rounded bg-slate-950/20 text-slate-950 font-bold shrink-0">
            <Gift className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold font-mono tracking-tight hidden md:inline">
            {offer.title}:
          </span>
          <span className="font-semibold text-slate-950">{offer.bannerText}</span>
          {offer.couponCode && (
            <span className="font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 text-[10px] select-all cursor-pointer">
              {offer.couponCode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.PRO_ONE}
            className="hidden sm:inline-flex items-center gap-1 font-bold font-mono text-[11px] underline underline-offset-2 hover:text-white transition-colors"
          >
            <span>Claim Pro One Pass</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md hover:bg-slate-950/10 transition-colors text-slate-950"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
