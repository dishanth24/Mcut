import React, { useState } from 'react';
import { QrCode, Download, Check, Copy, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Clean UPI QR Generator & Viewer
 * Uses standard UPI URI scheme + public QR code renderer API,
 * allowing users to view, scan with GPay / PhonePe / Paytm / BHIM, or download the QR.
 */
export default function UpiQrDialog({
  upiId,
  name,
  amountMinor = 0,
  currency = 'INR',
  note = 'Mcut Trip Settle Up',
  trigger,
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  if (!upiId) return null;

  const cleanUpi = upiId.trim();
  const recipientName = name || 'Travel Mate';
  const amountParam = amountMinor > 0 ? (amountMinor / 100).toFixed(2) : '';

  // Standard UPI URI format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
  const upiUri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(
    recipientName
  )}${amountParam ? `&am=${encodeURIComponent(amountParam)}` : ''}&cu=INR&tn=${encodeURIComponent(
    note
  )}`;

  // High quality QR code rendering via quickchart / googlechart QR endpoint
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(
    upiUri
  )}`;

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(cleanUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-xl border-border/80 px-2.5 text-xs font-semibold hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/10 hover:text-[#2DD4BF]"
          >
            <QrCode className="h-3.5 w-3.5 text-[#2DD4BF]" />
            <span>Show QR</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl border-border/80 p-6 text-center">
        <DialogHeader className="space-y-1.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2DD4BF]/15 text-[#2DD4BF] ring-4 ring-[#2DD4BF]/10">
            <QrCode className="h-6 w-6" />
          </div>
          <DialogTitle className="font-heading text-xl">Scan & Pay via UPI</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Scan using Google Pay, PhonePe, Paytm, or any BHIM UPI app.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center space-y-4">
          {/* QR code box with clean scan guide */}
          <div className="relative rounded-2xl border-2 border-dashed border-[#2DD4BF]/40 bg-white p-3 shadow-md transition-transform hover:scale-[1.02]">
            <img
              src={qrImageUrl}
              alt={`UPI QR code for ${cleanUpi}`}
              className="h-52 w-52 rounded-xl object-contain"
              loading="lazy"
            />
          </div>

          {/* Payee Info & Copy Button */}
          <div className="w-full space-y-2 rounded-2xl bg-secondary/50 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paying to:</span>
              <span className="font-semibold text-foreground">{recipientName}</span>
            </div>

            {amountParam ? (
              <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
                <span className="text-muted-foreground">Amount:</span>
                <span className="num font-bold text-sm text-[#2DD4BF]">
                  ₹{amountParam}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
              <span className="font-mono text-muted-foreground truncate max-w-[170px]">
                {cleanUpi}
              </span>
              <button
                type="button"
                onClick={copyUpi}
                className="flex items-center gap-1 font-semibold text-[#2DD4BF] hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Direct UPI App link (mobile friendly) */}
          <div className="flex w-full gap-2 pt-1">
            <Button
              asChild
              className="h-10 flex-1 rounded-xl bg-[#2DD4BF] font-semibold text-slate-900 hover:bg-[#14B8A6] text-xs"
            >
              <a href={upiUri}>
                <span>Open UPI App</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-3 border-border/80"
              title="Download QR"
            >
              <a href={qrImageUrl} download={`upi-qr-${cleanUpi}.png`} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
