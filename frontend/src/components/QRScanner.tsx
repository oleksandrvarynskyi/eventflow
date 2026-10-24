"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type QRScannerProps = {
  onScan: (token: string) => void | Promise<void>;
};

export default function QRScanner({ onScan }: QRScannerProps) {
  const onScanRef = useRef(onScan);
  const processingRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const lastDetectedAtRef = useRef(0);

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
            if (cancelled) return;

            const now = Date.now();

            // If the QR code was absent for at least 1.5 seconds,
            // allow the same ticket to be scanned again.
            if (now - lastDetectedAtRef.current > 1500) {
              lastScanRef.current = null;
            }

            lastDetectedAtRef.current = now;

            if (processingRef.current) return;

            // Ignore the same QR code while it remains visible.
            if (lastScanRef.current === decodedText) {
              return;
            }

            processingRef.current = true;
            lastScanRef.current = decodedText;

            void Promise.resolve()
              .then(() => onScanRef.current(decodedText))
              .catch((error) => {
                console.error("QR check-in failed:", error);
              })
              .finally(() => {
                processingRef.current = false;
              });
          },
          () => {
            if (cancelled) return;

            // Unlock the previous ticket only after the QR code
            // has not been detected for at least 1.5 seconds.
            if (
              !processingRef.current &&
              Date.now() - lastDetectedAtRef.current > 1500
            ) {
              lastScanRef.current = null;
            }
          },
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
