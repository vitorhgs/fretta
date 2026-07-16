import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { supabase } from "../supabase";

export default function Navegacao() {
  const { rotaId } = useLocalSearchParams();
  const router = useRouter();

  const [rota, setRota] = useState<any>(null);
  const [posicaoAtual, setPosicaoAtual] = useState<any>(null);
  const [indice, setIndice] = useState(0);
  const [emViagem, setEmViagem] = useState(false);
  const [velocidade, setVelocidade] = useState(0);
  const [ruaAtual, setRuaAtual] = useState("");
  const [numeroRua, setNumeroRua] = useState("");

  const limiteVia = 40;
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    carregarRota();
  }, []);

  const carregarRota = async () => {
    const { data } = await supabase
      .from("rotas")
      .select("*")
      .eq("id", rotaId)
      .single();

    if (data) {
      setRota(data);

      const coords = data.pontos_snap.map((p: any) => ({
        latitude: p[0],
        longitude: p[1],
      }));

      setPosicaoAtual(coords[0]);
      buscarNomeRua(coords[0].latitude, coords[0].longitude);
    }
  };

  const buscarNomeRua = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );

      const data = await response.json();

      if (data?.address) {
        const rua = data.address.road || "Rua desconhecida";
        const numero = data.address.house_number || "";

        setRuaAtual(rua);
        setNumeroRua(numero);
      }
    } catch (error) {
      console.log("Erro ao buscar rua:", error);
    }
  };

  const iniciarViagem = () => {
    if (!rota) return;

    const coords = rota.pontos_snap.map((p: any) => ({
      latitude: p[0],
      longitude: p[1],
    }));

    setEmViagem(true);
    setIndice(0);

    intervalRef.current = setInterval(() => {
      setIndice((prev) => {
        if (prev >= coords.length - 1) {
          clearInterval(intervalRef.current);
          return prev;
        }

        const novaVelocidade = 30 + Math.random() * 20;
        setVelocidade(Math.floor(novaVelocidade));

        const proximoPonto = coords[prev + 1];
        setPosicaoAtual(proximoPonto);
        buscarNomeRua(proximoPonto.latitude, proximoPonto.longitude);

        return prev + 1;
      });
    }, 1500);
  };

  const encerrarViagem = () => {
    clearInterval(intervalRef.current);
    setEmViagem(false);
    setVelocidade(0);
  };

  if (!rota || !posicaoAtual) {
    return (
      <View style={styles.loading}>
        <Text>Carregando rota...</Text>
      </View>
    );
  }

  const coordenadas = rota.pontos_snap.map((p: any) => ({
    latitude: p[0],
    longitude: p[1],
  }));

  const nomeProximaParada =
    indice < rota.pontos_originais.length - 1
      ? rota.pontos_originais[indice + 1]?.nome ||
        `Parada ${indice + 2}`
      : "Última parada";

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.linha}>{rota.nome}</Text>
          <Text style={styles.subtitulo}>Centro / Empresa</Text>
        </View>

        <View style={{ width: 20 }} />
      </View>

      {/* MAPA */}
      <MapView
        style={styles.map}
        region={{
          latitude: posicaoAtual.latitude,
          longitude: posicaoAtual.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        pitchEnabled={emViagem}
        camera={
          emViagem
            ? {
                center: posicaoAtual,
                pitch: 60,
                heading: 0,
                altitude: 500,
                zoom: 18,
              }
            : undefined
        }
      >
        <Polyline
          coordinates={coordenadas}
          strokeColor="#2563EB"
          strokeWidth={6}
        />

        <Marker coordinate={posicaoAtual} />
      </MapView>

      {/* VELOCIDADE */}
      {emViagem && (
        <>
          <View style={styles.velocidade}>
            <Text style={styles.velocidadeNumero}>
              {velocidade}
            </Text>
            <Text style={styles.velocidadeUnidade}>
              km/h
            </Text>

            {velocidade > limiteVia && (
              <View style={styles.limiteAlerta}>
                <Text style={styles.limiteNumero}>
                  {limiteVia}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* CARD INFERIOR */}
      <View style={styles.cardInferior}>
        <Text style={styles.proxima}>Próxima parada</Text>

        <Text style={styles.parada}>
          {nomeProximaParada}
        </Text>

        <Text style={styles.rua}>
          {ruaAtual}
        </Text>

        <Text style={styles.chegada}>
          {numeroRua ? `Altura: ${numeroRua}` : "Parada atual"}
        </Text>

        {!emViagem ? (
          <TouchableOpacity
            style={styles.botaoFinalizar}
            onPress={iniciarViagem}
          >
            <Text style={styles.botaoTexto}>
              Iniciar Viagem
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.botaoFinalizar}
            onPress={encerrarViagem}
          >
            <Text style={styles.botaoTexto}>
              Encerrar Viagem
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "#1E56D4",
    paddingTop: 55,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },

  voltar: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  headerCenter: { alignItems: "center" },

  linha: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  subtitulo: {
    color: "#dbeafe",
    fontSize: 14,
  },

  map: { flex: 1 },

  velocidade: {
    position: "absolute",
    bottom: 220,
    left: 30,
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#ef4444",
  },

  velocidadeNumero: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  velocidadeUnidade: {
    fontSize: 10,
    color: "#fff",
  },

  limiteAlerta: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },

  limiteNumero: {
    fontSize: 16,
    fontWeight: "bold",
  },

  cardInferior: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
  },

  proxima: {
    color: "#64748b",
    fontSize: 12,
  },

  parada: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },

  rua: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },

  chegada: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  botaoFinalizar: {
    marginTop: 20,
    backgroundColor: "#1E56D4",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});