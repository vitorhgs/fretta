import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabase";

export default function Home() {
  const router = useRouter();
  const [rotas, setRotas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    buscarRotas();
  }, []);

  const buscarRotas = async () => {
    const { data } = await supabase
      .from("rotas")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setRotas(data);
  };

  const rotasFiltradas = rotas.filter((r) =>
    r.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.voltar}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Linhas</Text>

        <View style={{ width: 20 }} />
      </View>

      {/* BUSCA */}
      <View style={styles.buscaContainer}>
        <Text style={styles.lupa}>🔍</Text>
        <TextInput
          placeholder="Buscar linha"
          value={busca}
          onChangeText={setBusca}
          style={styles.input}
        />
      </View>

      {/* LISTA */}
      <FlatList
        data={rotasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/navegacao",
                params: { rotaId: item.id },
              })
            }
          >
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.sub}>
              Ativo • Coleções
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  voltar: {
    color: "#1E56D4",
    fontSize: 28,
    fontWeight: "bold",
  },

  titulo: {
    fontSize: 18,
    fontWeight: "bold",
  },

  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },

  lupa: {
    marginRight: 10,
    fontSize: 16,
  },

  input: {
    flex: 1,
    fontSize: 15,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  nome: {
    fontSize: 16,
    fontWeight: "600",
  },

  sub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
});