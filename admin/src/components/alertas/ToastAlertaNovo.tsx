import { useEffect } from "react";
import { AlertTriangle, MapPin, User, X } from "lucide-react";
import type { AlertaSOS } from "../../contexts/AlertasSOSContext";

interface ToastAlertaNovoProps {
  alerta: AlertaSOS;
  onFechar: () => void;
  onVer: () => void;
}

export default function ToastAlertaNovo({
  alerta,
  onFechar,
  onVer,
}: ToastAlertaNovoProps) {
  // Toca som ao aparecer
  useEffect(() => {
    try {
      // Beep simples usando Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const beep = (freq: number, duracao: number, delay: number) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = freq;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + duracao
          );

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duracao);
        }, delay);
      };

      // 3 beeps ascendentes
      beep(800, 0.15, 0);
      beep(1000, 0.15, 200);
      beep(1200, 0.25, 400);
    } catch (e) {
      console.log("Áudio não disponível");
    }
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right duration-300">
      <div className="bg-red-600 rounded-2xl shadow-2xl border-2 border-red-400 overflow-hidden max-w-md">
        {/* Header pulsante */}
        <div className="bg-red-700 px-5 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping" />
            <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-lg leading-tight">
              🚨 ALERTA SOS
            </p>
            <p className="text-red-100 text-xs font-semibold">
              Motorista precisa de ajuda!
            </p>
          </div>
          <button
            onClick={onFechar}
            className="text-white/70 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <User className="w-5 h-5 text-red-600" strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {alerta.motorista_nome}
              </p>
              {alerta.rota_nome && (
                <p className="text-xs text-slate-500">
                  Rota: {alerta.rota_nome}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
            <MapPin size={14} className="text-slate-400" />
            <span>
              Lat: {alerta.latitude.toFixed(6)}, Lng:{" "}
              {alerta.longitude.toFixed(6)}
            </span>
          </div>

          <button
            onClick={onVer}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"
          >
            Ver detalhes e responder
          </button>
        </div>
      </div>
    </div>
  );
}