import { useNavigate } from "react-router-dom";
import { useAlertasSOS } from "../contexts/AlertasSOSContext";
import ToastAlertaNovo from "./alertas/ToastAlertaNovo";

export default function AlertaSOSNotificacaoGlobal() {
  const { novoAlerta, limparNovoAlerta } = useAlertasSOS();
  const navigate = useNavigate();

  if (!novoAlerta) return null;

  return (
    <ToastAlertaNovo
      alerta={novoAlerta}
      onFechar={limparNovoAlerta}
      onVer={() => {
        limparNovoAlerta();
        navigate("/alertas");
      }}
    />
  );
}