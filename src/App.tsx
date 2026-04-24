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
  Trash2,
  ChevronDown,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Site {
  id: number;
  nome_site: string;
  ip: string;
  status: 'up' | 'down';
  ultima_verificacao: string;
  status_desde: string;
  categoria: string;
  uptime_sla: number;
  tmro_segundos: number;
}

const formatTMRO = (seconds: number) => {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);
  
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteLogs, setSiteLogs] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNode, setNewNode] = useState({ nome_site: '', ip: '', categoria: 'Site', descricao: '' });
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);

  // Verificar login ao carregar
  useEffect(() => {
    const savedLogin = localStorage.getItem('noc_logged_in');
    if (savedLogin === 'true') setIsLoggedIn(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'NOCng' && loginForm.pass === 'NGnoc') {
      setIsLoggedIn(true);
      localStorage.setItem('noc_logged_in', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('noc_logged_in');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Efeitos de Fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[40px] shadow-2xl">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">NOCng Monitoring</h1>
              <p className="text-slate-400 font-medium">Autenticação de Segurança</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 pl-1">Utilizador</label>
                <input 
                  type="text" 
                  value={loginForm.user}
                  onChange={e => setLoginForm({...loginForm, user: e.target.value})}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                  placeholder="Seu utilizador"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 pl-1">Senha</label>
                <input 
                  type="password" 
                  value={loginForm.pass}
                  onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Credenciais inválidas. Tente novamente.
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full p-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20 mt-4"
              >
                Entrar no Sistema
              </button>
            </form>

            <p className="text-center mt-10 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              &copy; 2026 NOCng Monitoring • Acesso Seguro
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      // Ordena por nome do site para manter a tabela organizada
      const sortedData = (data || []).sort((a: Site, b: Site) => 
        (a.nome_site || '').localeCompare(b.nome_site || '')
      );
      setSites(sortedData);
      setLoading(false);
      setCountdown(5);
    } catch (error) {
      console.error("Erro ao procurar dados:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setAvailableCategories(data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewNode({ nome_site: '', ip: '', categoria: availableCategories[0]?.nome || 'Site', descricao: '' });
        fetchData();
        alert('Dispositivo criado com sucesso! ✨');
      } else {
        const errorText = await response.text();
        alert(`Erro ao criar: ${errorText}`);
      }
    } catch (error: any) {
      console.error("Erro ao criar node:", error);
      alert(`Erro crítico: ${error.message}`);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newCategoryName })
      });
      if (response.ok) {
        setNewCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
    }
  };

  const handleDeleteSite = async (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja apagar este dispositivo?')) return;
    try {
      const response = await fetch(`/api/sites?ip=${ip}`, { method: 'DELETE' });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Erro ao apagar site:", error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Tem certeza que deseja apagar esta categoria?')) return;
    try {
      const response = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (response.ok) fetchCategories();
    } catch (error) {
      console.error("Erro ao apagar categoria:", error);
    }
  };

  const fetchSiteLogs = async (ip: string) => {
    try {
      const response = await fetch(`/api/site-logs?ip=${ip}`);
      const data = await response.json();
      setSiteLogs(data);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  const handleSiteClick = (site: Site) => {
    setSelectedSite(site);
    fetchSiteLogs(site.ip);
  };

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 5));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  // Agrupar sites por categoria
  const categories = Array.from(new Set(sites.map(s => s.categoria || 'Site')));

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* MODAL: Gerir Categorias */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Categorias</h3>
              
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
                <input required type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Nova Categoria..." />
                <button type="submit" className="px-6 bg-black text-white rounded-xl font-bold hover:opacity-90">Add</button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {availableCategories.map(cat => (
                  <div key={cat.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 group">
                    <span className="font-bold text-slate-700">{cat.nome}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button onClick={() => setIsCategoryModalOpen(false)} className="w-full p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Fechar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Novo Dispositivo */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Novo Dispositivo</h3>
              <form onSubmit={handleAddNode} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome do Site</label>
                  <input required type="text" value={newNode.nome_site} onChange={e => setNewNode({...newNode, nome_site: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="ex: SITE-LUANDA-01" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Endereço IP</label>
                  <input required type="text" value={newNode.ip} onChange={e => setNewNode({...newNode, ip: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="ex: 10.0.0.1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Categoria</label>
                  <select value={newNode.categoria} onChange={e => setNewNode({...newNode, categoria: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all appearance-none">
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descrição Técnico / Observações</label>
                  <textarea value={newNode.descricao} onChange={e => setNewNode({...newNode, descricao: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all h-24 resize-none" placeholder="ex: No 3º andar, Rack B, Porta 15..." />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 p-3 bg-black text-white rounded-xl font-bold hover:opacity-90 transition-opacity">Criar Node</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Histórico */}
      <AnimatePresence>
        {selectedSite && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSite(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSite.nome_site}</h3>
                  <p className="text-sm font-mono text-slate-400 mt-1">{selectedSite.ip} • SLA {(selectedSite.uptime_sla || 100).toFixed(2)}%</p>
                </div>
                <button 
                  onClick={() => setSelectedSite(null)}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {selectedSite.descricao && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Descrição / Notas</span>
                    <p className="text-sm text-blue-700 leading-relaxed font-medium">{selectedSite.descricao}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico de Eventos</span>
                </div>

                <div className="space-y-4">
                  {(siteLogs || []).length > 0 ? (
                    siteLogs.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-all">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          log.status === 'up' ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}>
                          {log.status === 'up' 
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 
                            : <AlertCircle className="w-5 h-5 text-rose-600" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-black uppercase tracking-wider ${
                              log.status === 'up' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {log.status === 'up' ? 'Recuperado (UP)' : 'Queda Detectada (DOWN)'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(log.changed_at).toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">O dispositivo alterou o estado para {(log.status || 'unknown').toUpperCase()}.</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Activity className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">Nenhum evento registado para este site ainda.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Médio de Resolução (TMRO): {formatTMRO(selectedSite.tmro_segundos || 0)}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-64
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-2xl tracking-tighter text-slate-900">MERCURY-JS</h1>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-900"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 tracking-tight">MSTELCOM</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Network Infrastructure</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-4 bg-black text-white rounded-2xl shadow-xl shadow-black/10 hover:opacity-90 transition-all font-bold text-sm"
          >
            <Server className="w-5 h-5" />
            Novo Dispositivo
          </button>

          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-500 rounded-2xl mb-8 hover:bg-slate-100 hover:text-slate-900 transition-all font-bold text-xs"
          >
            <Settings className="w-4 h-4" />
            Gerir Categorias
          </button>

          <div className="space-y-1">
            <button 
              onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
              {isDashboardExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {isDashboardExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-11 space-y-1"
                >
                  {categories.map((cat: string) => (
                    <button 
                      key={cat}
                      onClick={() => scrollToCategory(cat)}
                      className="w-full text-left py-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider"
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavItem icon={<Monitor className="w-5 h-5" />} label="Dispositivos" />
          <NavItem icon={<ShieldAlert className="w-5 h-5" />} label="Alertas" />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Definições" />
        </nav>

        <div className="mt-auto p-4 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Suporte</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-3 font-bold hover:bg-rose-100 transition-colors"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex gap-4 md:gap-12 items-center overflow-x-auto no-scrollbar scroll-smooth">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <HeaderStat label="TOTAL" value={sites.length} />
            <div className="w-px h-8 bg-slate-200 shrink-0"></div>
            <HeaderStat label="ONLINE" value={sites.filter(s => s.status === 'up').length} color="emerald" />
            <div className="w-px h-8 bg-slate-200 shrink-0 hidden sm:block"></div>
            <HeaderStat label="OFFLINE" value={sites.filter(s => s.status === 'down').length} color="rose" className="hidden sm:flex" />
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200">
              <div className="w-8 h-8 md:w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 bg-slate-50/50">
          {categories.map(category => {
            const categorySites = sites.filter(s => (s.categoria || 'Site') === category);
            const sitesOnline = categorySites.filter(s => s.status === 'up');
            const sitesOffline = categorySites.filter(s => s.status === 'down');
            
            // Opção A: Disponibilidade Tempo Real (% de sites online agora)
            const realTimeAvailability = categorySites.length > 0 
              ? (sitesOnline.length / categorySites.length * 100).toFixed(1) 
              : '0';

            // Opção B: Média de SLA Histórico da Categoria
            const averageSLA = categorySites.length > 0
              ? (categorySites.reduce((acc, curr) => acc + (curr.uptime_sla || 0), 0) / categorySites.length).toFixed(2)
              : '100.00';

            // TMRO Médio da Categoria
            const averageTMRO = categorySites.length > 0
              ? categorySites.reduce((acc, curr) => acc + (curr.tmro_segundos || 0), 0) / categorySites.length
              : 0;

            return (
              <div key={category} id={`category-${category}`} className="space-y-6 pt-8 first:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{category}</h2>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Agora</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${Number(realTimeAvailability) > 90 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-[10px] font-bold text-slate-700">{realTimeAvailability}%</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">SLA Real</span>
                        <span className="text-[10px] font-bold">{averageSLA}%</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full shadow-sm">
                        <span className="text-[9px] font-bold text-blue-400 uppercase">TMRO</span>
                        <span className="text-[10px] font-bold">{formatTMRO(averageTMRO)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Auto-refresh em {countdown}s</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* UP Sites */}
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {sitesOnline.map(site => (
                        <SiteCard 
                          key={site.id} 
                          site={site} 
                          type="up" 
                          onSelect={() => handleSiteClick(site)} 
                          onDelete={(e) => handleDeleteSite(site.ip, e)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* DOWN Sites */}
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {sitesOffline.map(site => (
                        <SiteCard 
                          key={site.id} 
                          site={site} 
                          type="down" 
                          onSelect={() => handleSiteClick(site)} 
                          onDelete={(e) => handleDeleteSite(site.ip, e)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}

          {/* System Logs Table (Admin Panel) */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-12 mb-20 relative z-10">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 text-xl">Logs de Sistema</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">Exportar</button>
                <button className="flex-1 sm:flex-none px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">Filtrar</button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[600px]">
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
                  <LogRow time="2023-11-24 14:30:12" device="CORE-SWITCH-LUA-01" event="VLAN 100 Port 24 Down" status="CRITICAL" color="rose" user="System" />
                  <LogRow time="2023-11-24 14:28:45" device="FIREWALL-CAB-02" event="Login success via SSH" status="INFO" color="emerald" user="admin" />
                  <LogRow time="2023-11-24 14:25:01" device="SITE-LUB-12" event="SNMP Polling Timeout" status="DOWN" color="rose" user="SNMP" />
                  <LogRow time="2023-11-24 14:20:10" device="HUB-BENG-04" event="Interface Gigabit0/1 Recovered" status="UP" color="emerald" user="System" />
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
              <span className="hidden sm:inline">Mostrando 4 de 1.458 logs</span>
              <span className="sm:hidden">4 logs</span>
              <div className="flex gap-4 items-center">
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </section>
        </main>
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

function HeaderStat({ label, value, color = 'default', className = "" }: { label: string; value: number; color?: 'emerald' | 'rose' | 'default'; className?: string }) {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-50',
    rose: 'text-rose-500 bg-rose-50',
    default: 'text-slate-900'
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-bold text-slate-400 tracking-widest">{label}</span>
      <span className={`text-2xl font-black ${colors[color]}`}>{value.toLocaleString('pt-PT')}</span>
    </div>
  );
}

function SiteCard({ site, type, onSelect, onDelete }: { site: Site, type: 'up' | 'down', key?: any, onSelect: () => void, onDelete: (e: React.MouseEvent) => void }) {
  const isUp = type === 'up';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isUp ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      className={`p-4 md:p-6 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 md:gap-6 relative group transition-all shadow-sm cursor-pointer ${
        isUp ? 'neon-border-green-light border-l-emerald-500' : 'animate-pulse-red-soft border-l-4 border-l-rose-500'
      }`}
    >
      {/* Botão de Apagar (Aparece no Hover) */}
      <button 
        onClick={onDelete}
        className="absolute top-2 right-2 p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
        title="Apagar dispositivo"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 border ${
        isUp ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
      }`}>
        {isUp 
          ? <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-emerald-500" /> 
          : <AlertCircle className="w-5 h-5 md:w-7 md:h-7 text-rose-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-900 truncate tracking-tight">{site.nome_site}</h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{site.ip} {site.status === 'down' && <span className="text-rose-500 font-bold ml-1">(TIMEOUT)</span>}</p>
          </div>
          <div className="text-right">
            <span className="block text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">
              {isUp ? 'Operacional desde' : 'Fora de serviço desde'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isUp ? 'text-slate-700 bg-slate-100' : 'text-rose-600 bg-rose-100 animate-pulse'}`}>
              {new Date(site.status_desde || site.ultima_verificacao).toLocaleTimeString('pt-PT')}
            </span>
            <div className="mt-2 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-slate-300 uppercase">SLA</span>
                <span className="text-[9px] font-black text-slate-400">{site.uptime_sla?.toFixed(2)}%</span>
              </div>
              {site.tmro_segundos > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-blue-200 uppercase tracking-tighter">TMRO</span>
                  <span className="text-[9px] font-black text-blue-400">{formatTMRO(site.tmro_segundos)}</span>
                </div>
              )}
            </div>
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
