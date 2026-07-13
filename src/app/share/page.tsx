"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode.react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SHARE_URL = "https://nex-event-os-master-seven.vercel.app/proposals/new";
const QR_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

export default function SharePage() {
  const [isQRValid, setIsQRValid] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  // Generate QR code on component mount
  useEffect(() => {
    generateQR();
  }, []);

  // Timer to check QR expiration
  useEffect(() => {
    if (!generatedAt) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - generatedAt.getTime();
      const remaining = Math.max(0, QR_EXPIRATION_TIME - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsQRValid(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generatedAt]);

  const generateQR = () => {
    setGeneratedAt(new Date());
    setIsQRValid(true);
    setTimeRemaining(QR_EXPIRATION_TIME);
  };

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadQR = () => {
    const qrCanvas = document.querySelector("canvas");
    if (!qrCanvas) return;

    const link = document.createElement("a");
    link.href = qrCanvas.toDataURL("image/png");
    link.download = `proposals-qr-${new Date().getTime()}.png`;
    link.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SHARE_URL);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Share Proposal Form</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Generate a QR code to share the new proposal page</p>
      </div>

      {/* QR Code Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">QR Code Generator</h2>
            {!isQRValid && (
              <div className="rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Expired
              </div>
            )}
            {isQRValid && timeRemaining !== null && (
              <div className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Expires in: {formatTimeRemaining(timeRemaining)}
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="flex flex-col items-center gap-6">
          {/* QR Code Display */}
          <div
            className={`flex h-80 w-80 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-4 transition-all dark:border-slate-700 dark:bg-slate-800 ${
              !isQRValid ? "opacity-50" : ""
            }`}
          >
            {isQRValid && generatedAt ? (
              <QRCode value={SHARE_URL} size={300} level="H" includeMargin={true} />
            ) : (
              <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400">QR Code expired. Generate a new one.</p>
              </div>
            )}
          </div>

          {/* URL Display */}
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Share URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={SHARE_URL}
                readOnly
                className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              />
              <Button variant="outline" size="md" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <Button variant="primary" size="lg" onClick={downloadQR} disabled={!isQRValid} className="flex-1">
              Download QR Code
            </Button>
            <Button variant="secondary" size="lg" onClick={generateQR} className="flex-1">
              Generate New QR
            </Button>
          </div>

          {/* Info Message */}
          <div className="w-full rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <p className="font-medium">⚠️ QR codes expire after 1 hour</p>
            <p className="mt-1">For security reasons, each QR code is only valid for 1 hour from generation. Generate a new one to continue sharing.</p>
          </div>
        </CardBody>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How to Use</h2>
        </CardHeader>
        <CardBody>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 rounded-full bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center font-semibold dark:bg-brand-900/30 dark:text-brand-400">
                1
              </span>
              <span>Click "Generate New QR" to create a fresh QR code valid for 1 hour</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 rounded-full bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center font-semibold dark:bg-brand-900/30 dark:text-brand-400">
                2
              </span>
              <span>Download the QR code as an image or share the URL directly</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 rounded-full bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center font-semibold dark:bg-brand-900/30 dark:text-brand-400">
                3
              </span>
              <span>Recipients can scan the QR code or use the direct link to access the proposal page</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 rounded-full bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center font-semibold dark:bg-brand-900/30 dark:text-brand-400">
                4
              </span>
              <span>After 1 hour, the QR code expires for security. Generate a new one to continue sharing</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
