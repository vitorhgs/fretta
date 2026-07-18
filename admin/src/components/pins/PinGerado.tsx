import { useState } from "react";
import { formatarPin } from "../../lib/formatters";

interface PinGeradoProps {
  codigo: string;
  onFechar: () => void;
}

export default function PinGerado({ codigo, onFechar }: PinGeradoProps) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="p-8 text-center">
      <div className="mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          PIN gerado com sucesso!
        </h3>
        <p className="text-sm text-slate-500">
          Envie o código abaixo para o motorista
        </p>
      </div>

      {/* PIN grande e bonito */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-6 mb-4">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
          Código PIN
        </p>
        <p className="text-5xl font-black text-blue-900 font-mono tracking-widest">
          {formatarPin(codigo)}
        </p>
      </div>

      {/* Botão copiar */}
      <button
        onClick={copiar}
        className={`w-full py-3 rounded-xl font-semibold transition active:scale-95 flex items-center justify-center gap-2 mb-3 ${
          copiado
            ? "bg-green-600 text-white"
            : "bg-slate-800 text-white hover:bg-slate-700"
        }`}
      >
        {copiado ? (
          <>
            <span>✅</span> Copiado!
          </>
        ) : (
          <>
            <span>📋</span> Copiar código
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4 text-left">
        <p className="font-semibold mb-1">⚠️ Importante:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Este PIN só funciona para o motorista selecionado</li>
          <li>Após ser usado, expira automaticamente</li>
          <li>Envie via WhatsApp, SMS ou pessoalmente</li>
        </ul>
      </div>

      <button
        onClick={onFechar}
        className="text-sm text-slate-600 hover:text-slate-800 font-semibold"
      >
        Fechar
      </button>
    </div>
  );
}   