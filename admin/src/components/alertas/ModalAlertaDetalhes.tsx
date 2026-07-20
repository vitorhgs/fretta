import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  User,
  Clock,
  MapPin,
  Gauge,
  Route as RouteIcon,
  CheckCircle2,
  XCircle,
  PlayCircle,
  MessageSquare,
} from "lucide-react";
import type { AlertaSOS } from "../../contexts/AlertasSOSContext";

interface ModalAlertaDetalhesProps {
  alerta: AlertaSOS;
  onAtender: (id: string) => void;
  onResolver: (id: string, observacao?: string) => void;
  onFalsoAlarme: (id: string, observacao?: string) => void;
}

// Ícone customizado do motorista em alerta
const motoristaIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="position:relative;">
      <div style="position:absolute;width:60px;height:60px;background:rgba(220,38,38,0.3);border-radius:50%;top:-16px;left:-16px;animation:ping 1.5s infinite;"></div>
      <div style="position:relative;width:32px;height:32px;background:#DC2626;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      </div>
    </div>
    <style>
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function ModalAlertaDetalhes({
  alerta,
  onAtender,
  onResolver,
  onFalsoAlarme,
}: ModalAlertaDetalhesProps) {
  const [observacao, setObservacao] = useState("");
  const [modoFinalizacao, setModoFinalizacao] = useState<
    null | "resolver" | "falso"
  >(null);

  const podeAtender = alerta.status === "aberto";
  const podeFinalizar =
    alerta.status === "aberto" || alerta.status === "em_atendimento";
  const jaFinalizado =
    alerta.status === "resolvido" || alerta.status === "falso_alarme";

  const confirmarFinalizacao = () => {
    if (modoFinalizacao === "resolver") {
      onResolver(alerta.id, observacao);
    } else if (modoFinalizacao === "falso") {
      onFalsoAlarme(alerta.id, observacao);
    }
    setModoFinalizacao(null);
    setObservacao("");
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      {/* Status Header */}
      <div
        className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${
          alerta.status === "aberto"
            ? "bg-red-50 border-2 border-red-300"
            : alerta.status === "em_atendimento"
            ? "bg-amber-50 border-2 border-amber-300"
            : alerta.status === "resolvido"
            ? "bg-green-50 border-2 border-green-300"
            : "bg-slate-50 border-2 border-slate-300"
        }`}
      >
        <AlertTriangle
          size={28}
          className={
            alerta.status === "aberto"
              ? "text-red-600"
              : alerta.status === "em_atendimento"
              ? "text-amber-600"
              : alerta.status === "resolvido"
              ? "text-green-600"
              : "text-slate-500"
          }
          strokeWidth={2.5}
        />
        <div>
          <p className="font-bold text-slate-800">
            {alerta.status === "aberto" && "🚨 Alerta ativo — Aguardando atendimento"}
            {alerta.status === "em_atendimento" && "⏳ Alerta em atendimento"}
            {alerta.status === "resolvido" && "✓ Alerta resolvido"}
            {alerta.status === "falso_alarme" && "○ Marcado como falso alarme"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Criado em{" "}
            {new Date(alerta.criado_em).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Info do motorista */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoBox
          icon={User}
          label="Motorista"
          value={alerta.motorista_nome}
        />
        <InfoBox
          icon={RouteIcon}
          label="Rota"
          value={alerta.rota_nome || "Sem rota"}
        />
        <InfoBox
          icon={Gauge}
          label="Velocidade no alerta"
          value={`${Math.round(alerta.velocidade_kmh)} km/h`}
        />
        <InfoBox
          icon={Clock}
          label="Há quanto tempo"
          value={formatarTempo(alerta.criado_em)}
        />
      </div>

      {/* Mapa */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-slate-500" />
          <p className="text-sm font-bold text-slate-700">Localização exata</p>
        </div>
        <div className="rounded-xl overflow-hidden border-2 border-slate-200 h-[300px]">
          <MapContainer
            center={[alerta.latitude, alerta.longitude]}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker
              position={[alerta.latitude, alerta.longitude]}
              icon={motoristaIcon}
            >
              <Popup>
                <strong>{alerta.motorista_nome}</strong>
                <br />
                {alerta.rota_nome || "Sem rota"}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          {alerta.latitude.toFixed(6)}, {alerta.longitude.toFixed(6)}
        </p>
      </div>

      {/* Observações */}
      {alerta.observacao_motorista && (
        <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-blue-600" />
            <p className="text-xs font-bold text-blue-700 uppercase">
              Observação do motorista
            </p>
          </div>
          <p className="text-sm text-blue-900">{alerta.observacao_motorista}</p>
        </div>
      )}

      {alerta.observacao_admin && (
        <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-slate-600" />
            <p className="text-xs font-bold text-slate-700 uppercase">
              Observação do admin
            </p>
          </div>
          <p className="text-sm text-slate-700">{alerta.observacao_admin}</p>
        </div>
      )}

      {/* Ações */}
      {!jaFinalizado && !modoFinalizacao && (
        <div className="space-y-2 border-t border-slate-200 pt-4">
          {podeAtender && (
            <button
              onClick={() => onAtender(alerta.id)}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition"
            >
              <PlayCircle size={18} />
              Estou atendendo agora
            </button>
          )}
          {podeFinalizar && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setModoFinalizacao("resolver")}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
              >
                <CheckCircle2 size={18} />
                Resolver
              </button>
              <button
                onClick={() => setModoFinalizacao("falso")}
                className="flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
              >
                <XCircle size={18} />
                Falso alarme
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modo finalização (adicionar observação) */}
      {modoFinalizacao && (
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <p className="text-sm font-bold text-slate-700">
            {modoFinalizacao === "resolver"
              ? "Como foi resolvido?"
              : "Por que foi falso alarme?"}
          </p>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            placeholder="Descreva o que aconteceu... (opcional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModoFinalizacao(null);
                setObservacao("");
              }}
              className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarFinalizacao}
              className={`flex-1 text-white font-bold py-2.5 rounded-xl ${
                modoFinalizacao === "resolver"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-600 hover:bg-slate-700"
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-slate-500" />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}

function formatarTempo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "menos de 1 min";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}