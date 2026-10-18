"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type QRScannerProps = {
  onScan: (token: string) => void;
};

export default function QRScanner({ onScan }: QRScannerProps) {
  const onScanRef = useRef(onScan);
  const scannedRef = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    // Последовательно выполняем запуск и остановку сканера.
    // Это предотвращает одновременную работу двух экземпляров.
    const scannerElement = document.getElementById("qr-reader");

    if (!scannerElement) return;

    let cleanupPromise = Promise.resolve();

    async function startScanner() {
      try {
        // Ждём завершения предыдущей очистки.
        await cleanupPromise;

        if (cancelled) return;

        scanner = new Html5Qrcode("qr-reader");

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.min(
                220,
                Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8),
              );

              return {
                width: size,
                height: size,
              };
            },
          },
          (decodedText) => {
            if (cancelled || scannedRef.current) return;

            scannedRef.current = true;
            onScanRef.current(decodedText);
          },
          () => {},
        );

        if (cancelled && scanner.isScanning) {
          await scanner.stop();
          scanner.clear();
        }
      } catch (err) {
        if (!cancelled) {
          console.error("QR scanner error:", err);
          setError("Unable to start camera. Check camera permissions.");
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;

      cleanupPromise = (async () => {
        if (scanner?.isScanning) {
          await scanner.stop();
        }

        scanner?.clear();
      })().catch(console.error);
    };
  }, []);

  return (
    <div className="w-full">
      <div
        id="qr-reader"
        className="w-full overflow-hidden rounded-xl border border-slate-700 bg-black"
      />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
