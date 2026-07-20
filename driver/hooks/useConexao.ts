import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

interface EstadoConexao {
  online: boolean;
  tipo: string | null; // 'wifi' | 'cellular' | 'none' | etc
  qualidade: "boa" | "ruim" | "sem"; // estimativa
}

/**
 * Hook global pra detectar estado da internet.
 * - Retorna online = true quando tem conexão E consegue alcançar a internet
 * - Detecta mudanças em tempo real
 */
export function useConexao() {
  const [estado, setEstado] = useState<EstadoConexao>({
    online: true, // otimista no início
    tipo: null,
    qualidade: "boa",
  });

  useEffect(() => {
    // Estado inicial
    NetInfo.fetch().then(atualizarEstado);

    // Listener de mudanças
    const unsubscribe = NetInfo.addEventListener(atualizarEstado);

    return () => unsubscribe();
  }, []);

  const atualizarEstado = (netState: any) => {
    const online = !!(netState.isConnected && netState.isInternetReachable !== false);

    let qualidade: "boa" | "ruim" | "sem" = "boa";
    if (!online) {
      qualidade = "sem";
    } else if (netState.type === "cellular") {
      const cellularGen = netState.details?.cellularGeneration;
      if (cellularGen === "2g" || cellularGen === "3g") {
        qualidade = "ruim";
      }
    }

    setEstado({
      online,
      tipo: netState.type,
      qualidade,
    });
  };

  return estado;
}