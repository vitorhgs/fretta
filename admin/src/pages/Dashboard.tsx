import { MapContainer, TileLayer } from "react-leaflet";

function Dashboard() {
  const viagensDeHoje = [
    { linha: "Linha 001", trajeto: "Centro / Empresa", hora: "07:45", status: "Em andamento" },
    { linha: "Linha 002", trajeto: "Bairro / Empresa", hora: "08:10", status: "Em andamento" },
    { linha: "Linha 003", trajeto: "Residencial / Empresa", hora: "08:35", status: "Em andamento" },
    { linha: "Linha 004", trajeto: "Shopping / Empresa", hora: "09:00", status: "Em andamento" },
  ];

  return (
    <div className="space-y-6">
      
      {/* GRID DE CARDS MÉTRICOS (IGUAL AO MOCKUP) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1 - Linhas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase block">Linhas</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">28</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ativas</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>

        {/* Card 2 - Rotas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase block">Rotas</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">156</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ativas</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.053 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Card 3 - Motoristas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase block">Motoristas</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">112</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Cadastrados</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-purple-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Card 4 - Veículos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase block">Veículos</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">85</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ativos</span>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 2 9 18zm0 0v-8" />
            </svg>
          </div>
        </div>

      </div>

      {/* DUAS COLUNAS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: MAPA DE OPERAÇÕES */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Operações em andamento</h2>
          
          <div className="flex-1 h-[350px] rounded-xl overflow-hidden relative">
            <MapContainer
              center={[-23.55052, -46.633308]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
            </MapContainer>
            
            <button className="absolute bottom-4 left-4 z-[999] bg-white text-[#1E56D4] px-4 py-2 rounded-lg font-semibold text-xs shadow-md border hover:bg-slate-50 transition">
              Ver no mapa completo
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: VIAGENS DE HOJE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Viagens de hoje</h2>
          
          <div className="flex-1 divide-y divide-slate-100">
            {viagensDeHoje.map((viagem, index) => (
              <div key={index} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{viagem.linha}</h4>
                  <p className="text-xs text-slate-400 mt-1">{viagem.trajeto} • {viagem.hora}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full">
                  {viagem.status}
                </span>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 bg-[#1E56D4] text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition">
            Ver todas as viagens
          </button>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;