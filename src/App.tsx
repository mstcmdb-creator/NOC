import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  LayoutDashboard, 
  ShieldAlert, 
  Settings, 
  Globe, 
  Clock,
  ArrowRight,
  RefreshCw,
  Bell,
  Menu,
  ChevronRight,
  Monitor,
  HelpCircle,
  FileText,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Site {
  id: number;
  nome_site: string;
  ip: string;
  status: 'up' | 'down';
  ultima_verificacao: string;
}

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(data);
      setLoading(false);
      setCountdown(10);
    } catch (error) {
      console.error("Erro ao procurar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const sitesOnline = sites.filter(s => s.status === 'up');
  const sitesOffline = sites.filter(s => s.status === 'down');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex z-30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-black text-2xl tracking-tighter text-slate-900">MERCURY-JS</h1>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 tracking-tight">MSTELCOM</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Network Infrastructure</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
          />
          <NavItem icon={<Monitor className="w-5 h-5" />} label="Dispositivos" />
          <NavItem icon={<ShieldAlert className="w-5 h-5" />} label="Alertas" />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Definições" />
        </nav>

        <div className="mt-auto p-4 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Suporte</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Documentação</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex gap-12 items-center">
            <HeaderStat label="TOTAL DE SITES" value={sites.length} />
            <div className="w-px h-8 bg-slate-200"></div>
            <HeaderStat label="SITES ONLINE" value={sitesOnline.length} color="emerald" />
            <div className="w-px h-8 bg-slate-200"></div>
            <HeaderStat label="SITES OFFLINE" value={sitesOffline.length} color="rose" />
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <HelpCircle className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard View */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
          {/* Sites Division Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: UP Sites */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-800 tracking-tight text-lg uppercase">Sites Online</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">Estável</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Auto-refresh em {countdown}s</span>
              </div>
              
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {sitesOnline.map(site => (
                    <SiteCard key={site.id} site={site} type="up" />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: DOWN Sites */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-800 tracking-tight text-lg uppercase">Sites Críticos</h3>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded uppercase tracking-wider">Alerta</span>
                </div>
                <button className="text-xs text-blue-600 font-semibold hover:underline">Ver todos os incidentes</button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {sitesOffline.map(site => (
                    <SiteCard key={site.id} site={site} type="down" />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* System Logs Table (Admin Panel) */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-12 mb-20 relative z-10">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xl">Logs de Sistema</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">Exportar CSV</button>
                <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">Filtrar Logs</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dispositivo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilizador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Hardcoded sample logs based on the UI image requirement */}
                  <LogRow time="2023-11-24 14:30:12" device="CORE-SWITCH-LUA-01" event="VLAN 100 Port 24 Down" status="CRITICAL" color="rose" user="System_Automator" />
                  <LogRow time="2023-11-24 14:28:45" device="FIREWALL-CAB-02" event="Login success via SSH" status="INFO" color="emerald" user="admin_joao" />
                  <LogRow time="2023-11-24 14:25:01" device="SITE-LUB-12" event="SNMP Polling Timeout" status="DOWN" color="rose" user="SNMP_Service" />
                  <LogRow time="2023-11-24 14:20:10" device="HUB-BENG-04" event="Interface Gigabit0/1 Recovered" status="UP" color="emerald" user="System_Automator" />
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
              <span>Mostrando 4 de 1.458 logs nas últimas 24 horas</span>
              <div className="flex gap-4 items-center">
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </section>
        </main>

        {/* Floating Map Placeholder (Bottom Right) */}
        <div className="absolute bottom-8 right-8 z-30">
          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-200 w-64 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localização dos Nodes</span>
            <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative group">
              <img 
                src="https://api.dicebear.com/7.x/initials/svg?seed=MAP" 
                alt="Map Placeholder" 
                className="w-full h-full object-cover opacity-30 saturate-0"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg">VER MAPA EM TEMPO REAL</button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              <Activity className="absolute bottom-4 left-4 w-6 h-6 text-emerald-400 opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
        active 
        ? 'bg-slate-900 text-white shadow-lg' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: active ? 'w-5 h-5 text-white' : 'w-5 h-5 text-slate-400' })}
      {label}
    </button>
  );
}

function HeaderStat({ label, value, color }: { label: string, value: number, color?: 'emerald' | 'rose' }) {
  const colors = {
    emerald: 'text-emerald-500',
    rose: 'text-rose-600',
    default: 'text-slate-900'
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 tracking-widest">{label}</span>
      <span className={`text-2xl font-black ${color ? colors[color] : colors.default}`}>{value.toLocaleString('pt-PT')}</span>
    </div>
  );
}

function SiteCard({ site, type }: { site: Site, type: 'up' | 'down', key?: any }) {
  const isUp = type === 'up';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isUp ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`p-6 rounded-2xl bg-white border border-slate-200 flex items-center gap-6 relative group transition-all shadow-sm ${
        isUp ? 'neon-border-green-light border-l-emerald-500' : 'animate-pulse-red-soft border-l-4 border-l-rose-500'
      }`}
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${
        isUp ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
      }`}>
        {isUp 
          ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> 
          : <AlertCircle className="w-7 h-7 text-rose-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-900 truncate tracking-tight">{site.nome_site}</h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{site.ip} {site.status === 'down' && <span className="text-rose-500 font-bold ml-1">(TIMEOUT)</span>}</p>
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Última Verificação</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isUp ? 'text-slate-700' : 'text-rose-600 bg-rose-100 animate-pulse'}`}>
              {isUp ? 'Agora mesmo' : new Date(site.ultima_verificacao).toLocaleTimeString('pt-PT')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LogRow({ time, device, event, status, color, user }: any) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700'
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 text-xs font-medium text-slate-500 font-mono">{time}</td>
      <td className="px-6 py-4 text-xs font-extrabold text-slate-900 tracking-tight">{device}</td>
      <td className="px-6 py-4 text-xs text-slate-600">{event}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${colors[color as keyof typeof colors]}`}>
          <span className={`w-1 h-1 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-slate-400 font-medium">{user}</td>
    </tr>
  );
}
