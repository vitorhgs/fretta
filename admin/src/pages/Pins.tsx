import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Copy,
  Infinity as InfinityIcon,
  KeyRound,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import FormGerarPin from "../components/pins/FormGerarPin";
import PinGerado from "../components/pins/PinGerado";
import {
  formatarData,
  formatarPin,
  rotulosTipoPin,
  tempoRestante
} from "../lib/formatters";
import { supabase } from "../supabase";
import type { PinAutorizacao, StatusPin, TipoPin } from "../types/database";

import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { FilterTabs } from "../components/ui/FilterTabs";
import { PageHeader } from "../components/ui/PageHeader";
import { SearchInput } from "../components/ui/SearchInput";
import { StatCard } from "../components/ui/StatCard";
import { Toast, type ToastType } from "../components/ui/Toast";

type StatusConfig = {
  icon: LucideIcon;
  badge: "green" | "blue" | "slate" | "red";
  headerBg: string;
  headerBorder: string;
  headerText: string;
  label: string;
};

const STATUS_CONFIG: Record<StatusPin, StatusConfig> = {
  ativo: {
    icon: CircleDot,
    badge: "green",
    headerBg: "bg-green-50",
    headerBorder: "border-green-200",
    headerText: "text-green-700",
    label: "Ativo",
  },
  usado: {
    icon: CheckCircle2,
    badge: "blue",
    headerBg: "bg-blue-50",
    headerBorder: "border-blue-200",
    headerText: "text-blue-700",
    label: "Usado",
  },
  expirado: {
    icon: Clock,
    badge: "slate",
    headerBg: "bg-slate-50",
    headerBorder: "border-slate-200",
    headerText: "text-slate-600",
    label: "Expirado",
  },
  cancelado: {
    icon: XCircle,
    badge: "red",
    headerBg: "bg-red-50",
    headerBorder: "border-red-200",
    headerText: "text-red-700",
    label: "Cancelado",
  },
};

const TIPO_ICON: Record<TipoPin, LucideIcon> = {
  nova_rota: Sparkles,
  editar_rota: Pencil,
};

export default function Pins() {
  const [pins, setPins] = useState<PinAutorizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusPin>("todos");
  const [busca, setBusca] = useState("");
  const [modalGerar, setModalGerar] = useState(false);
  const [pinRecemGerado, setPinRecemGerado] = useState<string | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] =
    useState<PinAutorizacao | null>(null);
  const [mensagem, setMensagem] = useState<{
    tipo: ToastType;
    texto: string;
  } | null>(null);

  useEffect(() => {
    carregarPins();
    const interval = setInterval(carregarPins, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarPins = async () => {
    await supabase.rpc("expirar_pins_vencidos");

    const { data, error } = await supabase
      .from("pins_autorizacao")
      .select(
        `
        *,
        motorista:motoristas(id, nome, telefone),
        rota:rotas(id, nome, cor),
        criador:usuarios!criado_por(nome)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMensagem({ tipo: "erro", texto: "Erro ao carregar PINs" });
    } else if (data) {
      setPins(data as any);
    }
    setLoading(false);
  };

  const cancelarPin = async () => {
    if (!confirmarCancelar) return;
    const { error } = await supabase
      .from("pins_autorizacao")
      .update({ status: "cancelado" })
      .eq("id", confirmarCancelar.id);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao cancelar" });
      return;
    }
    setMensagem({ tipo: "sucesso", texto: "PIN cancelado" });
    setConfirmarCancelar(null);
    carregarPins();
  };

  const pinsFiltrados = useMemo(() => {
    let lista = pins;
    if (filtroStatus !== "todos")
      lista = lista.filter((p) => p.status === filtroStatus);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.codigo.includes(t) ||
          p.motorista?.nome?.toLowerCase().includes(t) ||
          p.observacao?.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [pins, busca, filtroStatus]);

  const stats = useMemo(
    () => ({
      total: pins.length,
      ativos: pins.filter((p) => p.status === "ativo").length,
      usados: pins.filter((p) => p.status === "usado").length,
      expirados: pins.filter(
        (p) => p.status === "expirado" || p.status === "cancelado"
      ).length,
    }),
    [pins]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="PINs de Autorização"
        subtitle="Libere motoristas para gravar ou editar rotas via app"
        action={{
          label: "Gerar PIN",
          icon: Plus,
          onClick: () => setModalGerar(true),
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={KeyRound} color="blue" />
        <StatCard
          label="Ativos"
          value={stats.ativos}
          icon={CircleDot}
          color="emerald"
        />
        <StatCard
          label="Usados"
          value={stats.usados}
          icon={CheckCircle2}
          color="indigo"
        />
        <StatCard
          label="Expirados"
          value={stats.expirados}
          icon={Clock}
          color="slate"
        />
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <SearchInput
              value={busca}
              onChange={setBusca}
              placeholder="Buscar por PIN, motorista ou observação..."
            />
          </div>

          <FilterTabs
            options={[
              { value: "todos", label: "Todos" },
              { value: "ativo", label: "Ativos" },
              { value: "usado", label: "Usados" },
              { value: "expirado", label: "Expirados" },
              { value: "cancelado", label: "Cancelados" },
            ]}
            value={filtroStatus}
            onChange={setFiltroStatus}
          />
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-3">Carregando PINs...</p>
        </div>
      )}

      {/* Vazio */}
      {!loading && pinsFiltrados.length === 0 && (
        <Card>
          <EmptyState
            icon={KeyRound}
            title={
              pins.length === 0
                ? "Nenhum PIN gerado ainda"
                : "Nenhum PIN encontrado"
            }
            description={
              pins.length === 0
                ? "Gere PINs para autorizar motoristas a gravarem ou editarem rotas pelo aplicativo."
                : "Tente ajustar os filtros de busca."
            }
            action={
              pins.length === 0
                ? {
                    label: "Gerar primeiro PIN",
                    onClick: () => setModalGerar(true),
                  }
                : undefined
            }
          />
        </Card>
      )}

      {/* Lista de PINs */}
      {!loading && pinsFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pinsFiltrados.map((pin) => {
            const config = STATUS_CONFIG[pin.status];
            const StatusIcon = config.icon;
            const TipoIcon = TIPO_ICON[pin.tipo];
            const tempo = tempoRestante(pin.expira_em);
            const ehAtivo = pin.status === "ativo";

            return (
              <div
                key={pin.id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition hover:shadow-lg hover:border-slate-300 ${
                  !ehAtivo ? "opacity-75" : ""
                }`}
              >
                {/* Header colorido */}
                <div
                  className={`px-5 py-3 border-b ${config.headerBg} ${config.headerBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className={`w-4 h-4 ${config.headerText}`}
                        strokeWidth={2.2}
                      />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${config.headerText}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <TipoIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      {rotulosTipoPin[pin.tipo]}
                    </div>
                  </div>
                </div>

                {/* Código PIN */}
                <div className="p-5 text-center border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Código
                  </p>
                  <p className="text-3xl font-black text-slate-800 font-mono tracking-widest">
                    {formatarPin(pin.codigo)}
                  </p>
                  {ehAtivo && pin.expira_em && (
                    <div
                      className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        tempo.urgente
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5" strokeWidth={2.2} />
                      Expira em {tempo.texto}
                    </div>
                  )}
                  {ehAtivo && !pin.expira_em && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600">
                      <InfinityIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      Sem expiração
                    </div>
                  )}
                </div>

                {/* Info motorista */}
                <div className="p-4 space-y-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={pin.motorista?.nome || "?"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {pin.motorista?.nome || "Motorista removido"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {pin.motorista?.telefone || "-"}
                      </p>
                    </div>
                  </div>

                  {pin.rota && (
                    <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: pin.rota.cor || "#3B82F6" }}
                      />
                      <MapPin
                        className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                        strokeWidth={2}
                      />
                      <span className="text-slate-600 truncate">
                        {pin.rota.nome}
                      </span>
                    </div>
                  )}

                  {pin.observacao && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 italic bg-slate-50 rounded-lg px-3 py-2">
                      <MessageSquare
                        className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5"
                        strokeWidth={2}
                      />
                      <span>{pin.observacao}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-0.5">
                    <p>Gerado em {formatarData(pin.created_at)}</p>
                    {pin.criador && <p>por {pin.criador.nome}</p>}
                    {pin.usado_em && (
                      <p className="text-blue-600 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                        Usado em {formatarData(pin.usado_em)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {ehAtivo && (
                  <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      fullWidth
                      onClick={() => {
                        navigator.clipboard.writeText(pin.codigo);
                        setMensagem({
                          tipo: "sucesso",
                          texto: "PIN copiado!",
                        });
                      }}
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      fullWidth
                      onClick={() => setConfirmarCancelar(pin)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal gerar PIN */}
      <Modal
        aberto={modalGerar}
        onFechar={() => setModalGerar(false)}
        titulo="Gerar novo PIN"
        tamanho="md"
      >
        <FormGerarPin
          onSucesso={(codigo) => {
            setModalGerar(false);
            setPinRecemGerado(codigo);
            carregarPins();
          }}
          onCancelar={() => setModalGerar(false)}
        />
      </Modal>

      {/* Modal PIN gerado */}
      <Modal
        aberto={!!pinRecemGerado}
        onFechar={() => setPinRecemGerado(null)}
        titulo=""
        tamanho="sm"
      >
        {pinRecemGerado && (
          <PinGerado
            codigo={pinRecemGerado}
            onFechar={() => setPinRecemGerado(null)}
          />
        )}
      </Modal>

      {/* Confirmação cancelar */}
      <Modal
        aberto={!!confirmarCancelar}
        onFechar={() => setConfirmarCancelar(null)}
        titulo="Cancelar PIN?"
        tamanho="sm"
      >
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2.2} />
            </div>
            <p className="text-slate-700">
              Tem certeza que deseja cancelar o PIN{" "}
              <span className="font-mono font-bold">
                {confirmarCancelar && formatarPin(confirmarCancelar.codigo)}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              O motorista não conseguirá mais usá-lo.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setConfirmarCancelar(null)}
            >
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={XCircle}
              onClick={cancelarPin}
              className="!bg-red-600 hover:!bg-red-500 !shadow-red-500/30"
            >
              Sim, cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {mensagem && (
        <Toast
          tipo={mensagem.tipo}
          texto={mensagem.texto}
          onFechar={() => setMensagem(null)}
        />
      )}
    </div>
  );
}