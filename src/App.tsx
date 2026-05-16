import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
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
  PlusCircle,
  ChevronRight,
  Monitor,
  HelpCircle,
  FileText,
  Trash2,
  ChevronDown,
  Map as MapIcon,
  Lock,
  LogOut,
  Search,
  X,
  Pin,
  PinOff,
  ShieldCheck,
  HandMetal,
  User,
  Image as ImageIcon,
  Share2,
  Workflow,
  Radio,
  Signal,
  Wifi,
  Satellite,
  Cable,
  Network,
  Cpu,
  Trash,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Site {
  id: number;
  nome_site: string;
  ip: string;
  status: 'up' | 'down' | 'dependente';
  ultima_verificacao: string;
  status_desde: string;
  categoria: string;
  uptime_sla: number;
  tmro_segundos: number;
  depende_de?: string;
  causa_raiz?: string;
  descricao?: string;
  fabricante?: string;
  ticket_numero?: string;
  responsavel?: string;
}

const getOTRSLink = (ticketNum: string | undefined) => {
  if (!ticketNum) return null;
  const num = ticketNum.replace(/\D/g, ''); // Extrai apenas os números, ignorando espaços ou prefixos
  if (!num) return null;
  // Equivalência: 093812 -> 71640. Offset = -22172
  const internalId = parseInt(num, 10) - 22172;
  return `https://suporte.mstelcom.net/otrs/index.pl?Action=AgentTicketZoom;TicketID=${internalId}`;
};

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

const getVendorLogo = (vendor: string | undefined, name: string) => {
  const v = vendor?.toLowerCase() || name.toLowerCase();
  
  if (v.includes('mikrotik') || v.includes('rb') || v.includes('ccr')) return 'https://www.google.com/s2/favicons?sz=64&domain=mikrotik.com';
  if (v.includes('zte')) return 'https://www.google.com/s2/favicons?sz=64&domain=zte.com.cn';
  if (v.includes('radwin')) return 'https://www.google.com/s2/favicons?sz=64&domain=radwin.com';
  if (v.includes('huawei')) return 'https://www.google.com/s2/favicons?sz=64&domain=huawei.com';
  if (v.includes('ubiquiti') || v.includes('uiquiti') || v.includes('ubnt') || v.includes('airmax')) return 'https://www.google.com/s2/favicons?sz=64&domain=ui.com';
  if (v.includes('cisco')) return 'https://www.google.com/s2/favicons?sz=64&domain=cisco.com';
  if (v.includes('cambium')) return 'https://www.google.com/s2/favicons?sz=64&domain=cambiumnetworks.com';
  if (v.includes('mimosa')) return 'https://www.google.com/s2/favicons?sz=64&domain=mimosa.co';
  
  return null;
};

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteLogs, setSiteLogs] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNode, setNewNode] = useState({ nome_site: '', ip: '', categoria: 'Site', descricao: '', depende_de: '', fabricante: '', ticket_numero: '', responsavel: '' });
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editNode, setEditNode] = useState({ nome_site: '', ip: '', categoria: 'Site', descricao: '', depende_de: '', fabricante: '', ticket_numero: '', responsavel: '' });
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedSites, setPinnedSites] = useState<string[]>(() => JSON.parse(localStorage.getItem('pinned_sites') || '[]'));
  const [pinnedCategories, setPinnedCategories] = useState<string[]>(() => JSON.parse(localStorage.getItem('pinned_categories') || '[]'));
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [ackNode, setAckNode] = useState<Site | null>(null);
  const [ackData, setAckData] = useState({ responsavel: '', ticket_numero: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'dependente'>('all');
  const [monitors, setMonitors] = useState<any[]>([]);
  const [isMonitorsModalOpen, setIsMonitorsModalOpen] = useState(false);

  const STATIC_PASSWORD = "N0cNG2026#"; // Atualizado conforme solicitação

  useEffect(() => {
    localStorage.setItem('pinned_sites', JSON.stringify(pinnedSites));
  }, [pinnedSites]);

  useEffect(() => {
    localStorage.setItem('pinned_categories', JSON.stringify(pinnedCategories));
  }, [pinnedCategories]);

  const togglePinSite = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedSites(prev => 
      prev.includes(ip) ? prev.filter(i => i !== ip) : [...prev, ip]
    );
  };

  const togglePinCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  useEffect(() => {
    const auth = localStorage.getItem('noc_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === STATIC_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('noc_authenticated', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('noc_authenticated');
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      // Ordena por nome do site para manter a tabela organizada
      const sortedData = (data || []).sort((a: Site, b: Site) => 
        (a.nome_site || '').localeCompare(b.nome_site || '')
      );
      // Verifica timeout para sites da categoria Cliente (90 segundos para tolerância)
      const now = new Date().getTime();
      const timeoutMs = 90000; // Aumentado para 90s para evitar conflitos com pings de 60s
      
      const sitesToTimeout = sortedData.filter((s: Site) => {
        if (!s.categoria?.toLowerCase().includes('cliente')) return false;
        if (s.status !== 'up') return false;
        if (!s.ultima_verificacao) return false;
        return (now - new Date(s.ultima_verificacao).getTime()) > timeoutMs;
      });

      for (const site of sitesToTimeout) {
        // Envia request para update-status para down
        fetch(`/api/update-status?ip=${site.ip}&status=down`).catch(console.error);
        site.status = 'down'; // Atualiza localmente na interface
      }

      setSites(sortedData);
      fetchGlobalLogs(); // Atualizar logs reais
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

  const fetchGlobalLogs = async () => {
    try {
      const response = await fetch('/api/all-logs');
      const data = await response.json();
      setGlobalLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs globais:", error);
    }
  };

  const fetchMonitors = async () => {
    try {
      const response = await fetch('/api/monitors');
      if (response.ok) {
        const data = await response.json();
        setMonitors(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar monitores:", error);
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
        setNewNode({ nome_site: '', ip: '', categoria: availableCategories[0]?.nome || 'Site', descricao: '', depende_de: '', fabricante: '' });
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

  const handleEditNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    try {
      const response = await fetch('/api/sites/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editNode, old_ip: editingSite.ip })
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchData();
        alert('Dispositivo atualizado! ✨');
      } else {
        const errorText = await response.text();
        alert(`Erro ao atualizar: ${errorText}`);
      }
    } catch (error: any) {
      console.error("Erro ao editar node:", error);
      alert(`Erro crítico: ${error.message}`);
    }
  };

  const handleAckNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackNode) return;
    try {
      const response = await fetch('/api/sites/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...ackNode, 
          responsavel: ackData.responsavel, 
          ticket_numero: ackData.ticket_numero,
          old_ip: ackNode.ip 
        })
      });
      if (response.ok) {
        setIsAckModalOpen(false);
        setAckData({ responsavel: '', ticket_numero: '' });
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao reconhecer falha:", error);
    }
  };

  const openAckModal = (site: Site, e: React.MouseEvent) => {
    e.stopPropagation();
    setAckNode(site);
    setAckData({ responsavel: '', ticket_numero: site.ticket_numero || '' });
    setIsAckModalOpen(true);
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setEditNode({
      nome_site: site.nome_site,
      ip: site.ip,
      categoria: site.categoria,
      descricao: site.descricao || '',
      depende_de: site.depende_de || '',
      fabricante: site.fabricante || '',
      ticket_numero: site.ticket_numero || '',
      responsavel: site.responsavel || ''
    });
    setIsEditModalOpen(true);
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
    fetchGlobalLogs();
    fetchMonitors();
    
    const interval = setInterval(() => {
      fetchData();
      fetchMonitors();
    }, 5000);

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 5));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  // Lógica de Filtragem
  const filteredSites = sites.filter(site => {
    const search = searchTerm.toLowerCase();
    return (
      site.nome_site?.toLowerCase().includes(search) ||
      site.ip?.toLowerCase().includes(search) ||
      site.categoria?.toLowerCase().includes(search) ||
      site.descricao?.toLowerCase().includes(search) ||
      site.status?.toLowerCase().includes(search)
    );
  });

  // Agrupar sites por categoria e ordenar categorias (pinadas primeiro)
  const categories = Array.from(new Set(filteredSites.map(s => s.categoria || 'Site')))
    .sort((a, b) => {
      const pinA = pinnedCategories.includes(a as string);
      const pinB = pinnedCategories.includes(b as string);
      if (pinA && !pinB) return -1;
      if (!pinA && pinB) return 1;

      if (statusFilter !== 'all') {
        const getLatest = (cat: string) => {
          const sitesCat = filteredSites.filter(s => (s.categoria || 'Site') === cat && s.status === statusFilter);
          if (sitesCat.length === 0) return 0;
          return Math.max(...sitesCat.map(s => new Date(s.status_desde || s.ultima_verificacao).getTime()));
        };
        const latestA = getLatest(a as string);
        const latestB = getLatest(b as string);
        if (latestA !== latestB) {
          return latestB - latestA; // Decrescente (mais recente primeiro)
        }
      }

      return (a as string).localeCompare(b as string);
    });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden p-10 border border-white/20">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/20">
                <Globe className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tighter">Mercury Sentinel</h1>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Network Intelligence</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-black transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  required
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Introduza a chave de acesso"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${loginError ? 'border-rose-500 bg-rose-50' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-black/5 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300`}
                />
              </div>

              {loginError && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-bold text-rose-500 text-center uppercase tracking-widest"
                >
                  Chave incorreta. Tente novamente.
                </motion.p>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
              >
                Entrar no Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            
            <div className="mt-10 pt-10 border-t border-slate-100 flex justify-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                Acesso restrito ao pessoal técnico.<br/>
                Monitorização em Tempo Real.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
      
      {/* MODAL: Editar Dispositivo */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Editar Dispositivo</h3>
              <form onSubmit={handleEditNode} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome do Site</label>
                  <input required type="text" value={editNode.nome_site} onChange={e => setEditNode({...editNode, nome_site: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Endereço IP</label>
                  <input required type="text" value={editNode.ip} onChange={e => setEditNode({...editNode, ip: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Categoria</label>
                  <select value={editNode.categoria} onChange={e => setEditNode({...editNode, categoria: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all appearance-none">
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fabricante</label>
                  <select value={editNode.fabricante} onChange={e => setEditNode({...editNode, fabricante: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all appearance-none">
                    <option value="">Detetar Automático</option>
                    <option value="MikroTik">MikroTik</option>
                    <option value="ZTE">ZTE</option>
                    <option value="Radwin">Radwin</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Ubiquiti">Ubiquiti</option>
                    <option value="Cisco">Cisco</option>
                    <option value="Cambium">Cambium</option>
                    <option value="Mimosa">Mimosa</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Depende de (Segure CTRL para vários)</label>
                  <select 
                    multiple 
                    value={editNode.depende_de.split(',').filter(Boolean)} 
                    onChange={e => {
                      const options = e.target.options;
                      const values = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) values.push(options[i].value);
                      }
                      setEditNode({...editNode, depende_de: values.join(',')});
                    }} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all h-24"
                  >
                    {sites.filter(s => s.ip !== editingSite?.ip).map(s => (
                      <option key={s.ip} value={s.ip}>{s.nome_site} ({s.ip})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nº Ticket</label>
                    <input type="text" value={editNode.ticket_numero} onChange={e => setEditNode({...editNode, ticket_numero: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Ex: 8892" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Responsável</label>
                    <input type="text" value={editNode.responsavel} onChange={e => setEditNode({...editNode, responsavel: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Nome" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                  <textarea value={editNode.descricao} onChange={e => setEditNode({...editNode, descricao: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all h-20 resize-none" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 p-3 bg-black text-white rounded-xl font-bold hover:opacity-90 transition-opacity">Salvar Alterações</button>
                </div>
              </form>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fabricante</label>
                  <select value={newNode.fabricante} onChange={e => setNewNode({...newNode, fabricante: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all appearance-none">
                    <option value="">Detetar Automático</option>
                    <option value="MikroTik">MikroTik</option>
                    <option value="ZTE">ZTE</option>
                    <option value="Radwin">Radwin</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Ubiquiti">Ubiquiti</option>
                    <option value="Cisco">Cisco</option>
                    <option value="Cambium">Cambium</option>
                    <option value="Mimosa">Mimosa</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Depende de (Segure CTRL para vários)</label>
                  <select 
                    multiple 
                    value={newNode.depende_de.split(',').filter(Boolean)} 
                    onChange={e => {
                      const options = e.target.options;
                      const values = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) values.push(options[i].value);
                      }
                      setNewNode({...newNode, depende_de: values.join(',')});
                    }} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all h-32"
                  >
                    {sites.map(s => (
                      <option key={s.ip} value={s.ip}>{s.nome_site} ({s.ip})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nº Ticket</label>
                    <input type="text" value={newNode.ticket_numero} onChange={e => setNewNode({...newNode, ticket_numero: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Ex: 8892" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Responsável</label>
                    <input type="text" value={newNode.responsavel} onChange={e => setNewNode({...newNode, responsavel: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Nome" />
                  </div>
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

      {/* MODAL: Reconhecer Falha */}
      <AnimatePresence>
        {isAckModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAckModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 border border-white/20">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                <ShieldCheck className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Reconhecer Falha</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Introduza quem está a tratar deste incidente e o número do ticket associado.</p>
              
              <form onSubmit={handleAckNode} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Técnico Responsável</label>
                  <input required autoFocus type="text" value={ackData.responsavel} onChange={e => setAckData({...ackData, responsavel: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Nome do técnico" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Número do Ticket (Opcional)</label>
                  <input type="text" value={ackData.ticket_numero} onChange={e => setAckData({...ackData, ticket_numero: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Ex: 8823" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAckModalOpen(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Sair</button>
                  <button type="submit" className="flex-1 p-3 bg-black text-white rounded-xl font-bold hover:opacity-90 transition-opacity">Confirmar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Servidores de Monitorização */}
      <AnimatePresence>
        {isMonitorsModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMonitorsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Servidores MNT Monitor</h3>
                  <p className="text-xs text-slate-500 font-medium">Estado dos nós de monitorização do MikroTik.</p>
                </div>
                <button onClick={() => setIsMonitorsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {monitors.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhum servidor de monitorização registado.</p>
                ) : (
                  monitors.map(m => {
                    const isUp = (new Date().getTime() - new Date(m.last_seen).getTime()) <= 20000;
                    return (
                      <div key={m.name} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Server className={`w-5 h-5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`} />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                            <p className="text-[10px] text-slate-400">Visto pela última vez: {new Date(m.last_seen).toLocaleTimeString('pt-PT')}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {isUp ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
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
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSite.nome_site}</h3>
                    {selectedSite.status === 'down' && !selectedSite.ticket_numero && (
                      <a 
                        href="https://suporte.mstelcom.net/otrs/index.pl?Action=AgentTicketPhone"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-black tracking-widest uppercase transition-all shadow-sm shadow-rose-200"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Abrir Ticket
                      </a>
                    )}
                  </div>
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
                          <div className="mt-2 flex gap-3 items-center">
                            {log.ticket_numero ? (
                              <a 
                                href={getOTRSLink(log.ticket_numero) || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors flex items-center gap-1"
                              >
                                Ticket #{log.ticket_numero}
                                <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                              </a>
                            ) : (
                              log.status === 'down' && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  Sem ticket associado
                                </span>
                              )
                            )}
                            {log.responsavel && <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-100 italic">Resp: {log.responsavel}</span>}
                          </div>
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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-black/10">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 leading-none">MERCURY-JS</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">NOCng Monitoring</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-900"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          <NavItem 
            icon={<Network className="w-5 h-5 text-blue-500" />} 
            label="Mapas" 
            active={activeTab === 'mapas'} 
            onClick={() => {
              setActiveTab('mapas');
              setIsMobileMenuOpen(false);
            }} 
          />
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
              onClick={() => {
                setActiveTab('dashboard');
                setIsDashboardExpanded(!isDashboardExpanded);
                if (activeTab !== 'dashboard') setIsMobileMenuOpen(false);
              }}
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
                  {categories.map((cat: string) => {
                    const downCount = sites.filter(s => (s.categoria || 'Site') === cat && (s.status === 'down' || s.status === 'dependente')).length;
                    const isPinned = pinnedCategories.includes(cat);

                    return (
                      <div key={cat} className="flex items-center justify-between group/cat">
                        <button 
                          onClick={() => scrollToCategory(cat)}
                          className="flex-1 text-left py-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider flex items-center gap-2"
                        >
                          {isPinned && <Pin className="w-3 h-3 text-blue-500 fill-blue-500" />}
                          {cat}
                        </button>
                        <div className="flex items-center gap-2 pr-2">
                          {downCount > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                              {downCount}
                            </span>
                          )}
                          <button 
                            onClick={(e) => togglePinCategory(cat, e)}
                            className={`p-1 rounded-md transition-all opacity-0 group-hover/cat:opacity-100 ${isPinned ? 'text-blue-500 opacity-100' : 'text-slate-300 hover:text-slate-500'}`}
                          >
                            <Pin className={`w-3 h-3 ${isPinned ? 'fill-blue-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          <NavItem 
            icon={<Workflow className="w-5 h-5" />} 
            label="Diagnóstico Inicial" 
            active={activeTab === 'diagnostico'} 
            onClick={() => {
              setActiveTab('diagnostico');
              setIsMobileMenuOpen(false);
            }} 
          />
          <NavItem 
            icon={<Monitor className="w-5 h-5" />} 
            label="Dispositivos" 
            active={activeTab === 'dispositivos'} 
            onClick={() => {
              setActiveTab('dispositivos');
              setIsMobileMenuOpen(false);
            }} 
          />
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
          <button 
            onClick={handleLogout}
            className="w-full p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-3 hover:bg-rose-100 transition-colors font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex gap-4 md:gap-12 items-center flex-1 overflow-hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex gap-4 md:gap-6 items-center border-r border-slate-100 pr-4 md:pr-8 overflow-x-auto no-scrollbar">
              <HeaderStat label="TOTAL" value={sites.length} onClick={() => setStatusFilter('all')} isActive={statusFilter === 'all'} />
              <HeaderStat label="UP" value={sites.filter(s => s.status === 'up').length} color="emerald" onClick={() => setStatusFilter('up')} isActive={statusFilter === 'up'} />
              <HeaderStat label="DOWN" value={sites.filter(s => s.status === 'down').length} color="rose" onClick={() => setStatusFilter('down')} isActive={statusFilter === 'down'} />
              <HeaderStat className="hidden sm:flex" label="DEP" value={sites.filter(s => s.status === 'dependente').length} color="amber" onClick={() => setStatusFilter('dependente')} isActive={statusFilter === 'dependente'} />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6 ml-4">
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

        {/* Main View Area */}
        <main className={`flex-1 ${(activeTab === 'diagnostico' || activeTab === 'mapas') ? 'overflow-hidden' : 'overflow-y-auto'} bg-slate-50/50 ${(activeTab === 'diagnostico' || activeTab === 'mapas') ? 'p-0' : 'p-4 md:p-8'}`}>
          {(activeTab !== 'diagnostico' && activeTab !== 'mapas') && (
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
            <div className="w-full max-w-2xl relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-black transition-colors">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar dispositivos, IPs, categorias..."
                className="w-full pl-11 pr-11 py-2.5 md:py-3.5 bg-slate-100/50 border border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-slate-200 focus:ring-8 focus:ring-black/5 outline-none transition-all text-xs md:text-sm font-bold placeholder:text-slate-400"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {(() => {
                const isRealTimeActive = monitors.length > 0 && monitors.some(m => {
                  const lastSeen = new Date(m.last_seen).getTime();
                  const now = new Date().getTime();
                  return (now - lastSeen) <= 20000;
                });
                
                return (
                  <div 
                    onClick={() => setIsMonitorsModalOpen(true)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hidden sm:flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isRealTimeActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tempo Real Ativo</span>
                  </div>
                );
              })()}
              <button 
                onClick={() => fetchData()}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-slate-600"
                title="Forçar Atualização"
              >
                <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          )}

          <div className={(activeTab === 'diagnostico' || activeTab === 'mapas') ? 'h-full' : 'p-4 md:p-8'}>
            <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {categories.map(category => {
                  const categorySites = filteredSites
                    .filter(s => (s.categoria || 'Site') === category)
                    .filter(s => statusFilter === 'all' || s.status === statusFilter)
                    .sort((a, b) => {
                      const pinA = pinnedSites.includes(a.ip);
                      const pinB = pinnedSites.includes(b.ip);
                      if (pinA && !pinB) return -1;
                      if (!pinA && pinB) return 1;
                      
                      const timeA = new Date(a.status_desde || a.ultima_verificacao).getTime();
                      const timeB = new Date(b.status_desde || b.ultima_verificacao).getTime();
                      return timeB - timeA;
                    });
                  
                  if (categorySites.length === 0) return null;

                  const sitesOnline = categorySites.filter(s => s.status === 'up');
                  const sitesDownAndDep = categorySites.filter(s => s.status !== 'up');
                  
                  const realTimeAvailability = categorySites.length > 0 
                    ? (sitesOnline.length / categorySites.length * 100).toFixed(1) 
                    : '0';

                  const averageSLA = categorySites.length > 0
                    ? (categorySites.reduce((acc, curr) => acc + (curr.uptime_sla || 0), 0) / categorySites.length).toFixed(2)
                    : '100.00';

                  const averageTMRO = categorySites.length > 0
                    ? categorySites.reduce((acc, curr) => acc + (curr.tmro_segundos || 0), 0) / categorySites.length
                    : 0;

                  return (
                    <div key={category} id={`category-${category}`} className="space-y-6 pt-8 first:pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{category as string}</h2>
                            <button 
                              onClick={(e) => togglePinCategory(category as string, e)}
                              className={`p-1.5 rounded-lg transition-all ${pinnedCategories.includes(category as string) ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-slate-900'}`}
                            >
                              <Pin className={`w-5 h-5 ${pinnedCategories.includes(category) ? 'fill-blue-500' : ''}`} />
                            </button>
                          </div>
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
                        {sitesOnline.length > 0 && (
                          <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                              {sitesOnline.map(site => (
                                <SiteCard 
                                  key={site.id} 
                                  site={site} 
                                  type="up" 
                                  sites={sites}
                                  onSelect={() => handleSiteClick(site)} 
                                  onDelete={() => {}} // Desativado no dashboard
                                  isPinned={pinnedSites.includes(site.ip)}
                                  onTogglePin={(e) => togglePinSite(site.ip, e)}
                                  onAck={openAckModal}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        )}

                        {sitesDownAndDep.length > 0 && (
                          <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                              {sitesDownAndDep.map(site => (
                                <SiteCard 
                                  key={site.id} 
                                  site={site} 
                                  type={site.status === 'dependente' ? 'dependent' : 'down'} 
                                  sites={sites}
                                  onSelect={() => handleSiteClick(site)} 
                                  onDelete={() => {}} // Desativado no dashboard
                                  isPinned={pinnedSites.includes(site.ip)}
                                  onTogglePin={(e) => togglePinSite(site.ip, e)}
                                  onAck={openAckModal}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* System Logs Table (Mini Version in Dashboard) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-12 relative z-10">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Logs Recentes</h3>
                    <button className="text-xs font-bold text-blue-600 hover:underline">Ver todos</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100">
                        {globalLogs.slice(0, 5).map((log) => (
                          <LogRow 
                            key={log.id}
                            time={new Date(log.changed_at).toLocaleString('pt-PT')}
                            device={log.sites?.nome_site || log.site_ip}
                            event={log.status === 'up' ? 'Conexão Restaurada' : 'Queda de Conexão'}
                            status={log.status === 'up' ? 'ONLINE' : 'OFFLINE'}
                            color={log.status === 'up' ? 'emerald' : 'rose'}
                            user="MikroTik"
                            ticket={log.ticket_numero}
                            responsavel={log.responsavel}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </motion.div>
            ) : activeTab === 'mapas' ? (
              <motion.div 
                key="mapas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <MapasMPLS sites={sites} />
              </motion.div>
            ) : activeTab === 'diagnostico' ? (
              <motion.div 
                key="diagnostico"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <DiagnosticoInicial />
              </motion.div>
            ) : (
              <motion.div 
                key="dispositivos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Gestão de Dispositivos</h2>
                    <p className="text-slate-400 font-medium">Adicione, edite ou remova elementos da sua monitorização.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:opacity-90 transition-all"
                  >
                    <Server className="w-5 h-5" />
                    Novo Dispositivo
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome / Identificação</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço IP</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dependência</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSites.map(site => (
                          <tr key={site.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5 max-w-[300px]">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-slate-900 block break-words leading-tight mb-1">{site.nome_site}</span>
                                  <span className="text-[10px] text-slate-400 font-medium break-words block leading-normal">{site.descricao || 'Sem descrição'}</span>
                                </div>
                                {getVendorLogo(site.fabricante, site.nome_site) && (
                                  <div className="w-6 h-6 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden p-0.5 shrink-0 bg-white">
                                    <img src={getVendorLogo(site.fabricante, site.nome_site)!} alt="" className="w-full h-full object-contain" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{site.ip}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{site.categoria}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-bold text-slate-400">
                                {site.depende_de ? site.depende_de.split(',').length + ' items' : 'Nenhuma'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => openEditModal(site)}
                                  className="p-2 text-slate-300 hover:text-black transition-colors" 
                                  title="Editar"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => handleDeleteSite(site.ip, e)}
                                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors" 
                                  title="Apagar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
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

function HeaderStat({ label, value, color = 'default', className = "", onClick, isActive = false }: { label: string; value: number; color?: 'emerald' | 'rose' | 'amber' | 'default'; className?: string; onClick?: () => void; isActive?: boolean }) {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-50',
    rose: 'text-rose-500 bg-rose-50',
    amber: 'text-amber-500 bg-amber-50',
    default: 'text-slate-900'
  };

  return (
    <div 
      onClick={onClick}
      className={`flex flex-col gap-0 md:gap-1 p-2 rounded-xl transition-all ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${isActive ? 'bg-slate-100 ring-1 ring-slate-200' : ''} ${className}`}
    >
      <span className="text-[8px] md:text-[10px] font-bold text-slate-400 tracking-widest">{label}</span>
      <span className={`text-base md:text-2xl font-black ${colors[color]}`}>{value.toLocaleString('pt-PT')}</span>
    </div>
  );
}

function SiteCard({ site, type, sites, onSelect, onDelete, isPinned, onTogglePin, onAck }: { site: Site, type: 'up' | 'down' | 'dependent', sites: Site[], key?: any, onSelect: () => void, onDelete: (e: React.MouseEvent) => void, isPinned: boolean, onTogglePin: (e: React.MouseEvent) => void, onAck: (site: Site, e: React.MouseEvent) => void }) {
  const isUp = type === 'up';
  const isDependent = type === 'dependent';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isUp ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      className={`p-3 md:p-6 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center gap-3 md:gap-6 relative group transition-all shadow-sm cursor-pointer ${
        isPinned ? 'ring-2 ring-blue-500/20 border-blue-200' : ''
      } ${
        isUp 
          ? 'neon-border-green-light border-l-emerald-500' 
          : isDependent 
            ? 'border-l-4 border-l-amber-500' 
            : 'animate-pulse-red-soft border-l-4 border-l-rose-500'
      }`}
    >
      {/* Pin Button */}
      <button 
        onClick={onTogglePin}
        className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all z-10 ${isPinned ? 'text-blue-500 bg-blue-50 opacity-100' : 'text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100'}`}
      >
        <Pin className={`w-4 h-4 ${isPinned ? 'fill-blue-500' : ''}`} />
      </button>

      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 border ${
        isUp 
          ? 'bg-emerald-50 border-emerald-100' 
          : isDependent
            ? 'bg-amber-50 border-amber-100'
            : 'bg-rose-50 border-rose-100'
      }`}>
        {isUp 
          ? <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-emerald-500" /> 
          : isDependent
            ? <Activity className="w-5 h-5 md:w-7 md:h-7 text-amber-500" />
            : <AlertCircle className="w-5 h-5 md:w-7 md:h-7 text-rose-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0 flex-1 w-full">
            <h4 className="font-bold text-slate-900 break-words tracking-tight leading-tight mb-0.5 text-xs md:text-base">
              {site.nome_site}
            </h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
              {site.ip} 
              {site.status === 'down' && <span className="text-rose-500 font-bold ml-1">(TIMEOUT)</span>}
              {site.status === 'dependente' && <span className="text-amber-500 font-bold ml-1">(DEPENDENTE)</span>}
            </p>

            {(site.ticket_numero || site.responsavel) && !isUp && (
              <div className="mt-2 flex flex-wrap gap-2">
                {site.responsavel && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md">
                    <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Reconhecido por {site.responsavel}</span>
                  </div>
                )}
                {site.ticket_numero && (
                  <a 
                    href={getOTRSLink(site.ticket_numero) || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-md hover:bg-rose-100 transition-colors"
                  >
                    <span className="text-[7px] font-black text-rose-400 uppercase tracking-tighter">Ticket</span>
                    <span className="text-[9px] font-bold text-rose-700">#{site.ticket_numero}</span>
                    <RefreshCw className="w-2 h-2 text-rose-300" />
                  </a>
                )}
              </div>
            )}
            
            {isDependent && site.depende_de && !site.causa_raiz && (
              <div className="mt-2 p-2 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight flex items-start gap-1.5">
                  <Activity className="w-3 h-3 shrink-0" />
                  <span className="leading-snug">Depende de: {site.depende_de.split(',').map(ip => sites.find(s => s.ip === ip)?.nome_site || ip).join(', ')}</span>
                </p>
              </div>
            )}
            {isDependent && site.causa_raiz && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl w-full">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight flex items-start gap-2 break-words leading-relaxed">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Falha causada por dependência do {site.causa_raiz}</span>
                </p>
              </div>
            )}
            
            {/* Acknowledge Button & Vendor Badge Inline */}
            {!isUp && (
              <div className="mt-4 flex items-center justify-end gap-3">
                {!site.responsavel && (
                  <button 
                    onClick={(e) => onAck(site, e)}
                    className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200/50"
                  >
                    Reconhecer Falha
                  </button>
                )}
                {getVendorLogo(site.fabricante, site.nome_site) && (
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-1 shrink-0">
                    <img 
                      src={getVendorLogo(site.fabricante, site.nome_site)!} 
                      alt="Vendor" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {isUp && getVendorLogo(site.fabricante, site.nome_site) && (
              <div className="mt-4 flex justify-end">
                <div className="w-6 h-6 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-1">
                  <img 
                    src={getVendorLogo(site.fabricante, site.nome_site)!} 
                    alt="Vendor" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-right shrink-0 w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 sm:border-l sm:border-slate-100 sm:pl-4">
            <div className="flex flex-col items-start sm:items-end">
              <span className="block text-[6px] md:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">
                {isUp ? 'Operacional desde' : isDependent ? 'Em espera desde' : 'Fora de serviço desde'}
              </span>
              <span className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded inline-block whitespace-nowrap ${
                isUp 
                  ? 'text-slate-700 bg-slate-100' 
                  : isDependent
                    ? 'text-amber-600 bg-amber-100'
                    : 'text-rose-600 bg-rose-100 animate-pulse'
              }`}>
                {new Date(site.status_desde || site.ultima_verificacao).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="mt-0 sm:mt-2 flex flex-row sm:flex-col items-center sm:items-end gap-2 md:gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase">SLA</span>
                <span className="text-[8px] md:text-[9px] font-black text-slate-400">{site.uptime_sla?.toFixed(1)}%</span>
              </div>
              {site.tmro_segundos > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[7px] md:text-[8px] font-bold text-blue-200 uppercase tracking-tighter">TMRO</span>
                  <span className="text-[8px] md:text-[9px] font-black text-blue-400">{formatTMRO(site.tmro_segundos)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LogRow({ time, device, event, status, color, user, ticket, responsavel }: any) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700'
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 text-xs font-medium text-slate-500 font-mono">{time}</td>
      <td className="px-6 py-4">
        <span className="text-xs font-extrabold text-slate-900 tracking-tight block">{device}</span>
        {ticket && (
          <a 
            href={getOTRSLink(ticket) || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[9px] font-bold text-rose-500 hover:underline inline-flex items-center gap-1 mt-1"
          >
            Ticket: #{ticket}
            <ArrowRight className="w-2 h-2 opacity-50" />
          </a>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-slate-600 block">{event}</span>
        {responsavel && <span className="text-[9px] text-slate-400 block mt-1">Resp: {responsavel}</span>}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${colors[color as keyof typeof colors]}`}>
          <span className={`w-1 h-1 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
          {status}
        </span>
      </td>
    </tr>
  );
}

function DiagnosticoInicial() {
  const techs = [
    { name: 'FWA' },
    { name: 'Radwin' },
    { name: 'Ubiquiti' },
    { name: 'V-SAT Idirect' },
    { name: 'FTTX' }
  ];

  const [activeTech, setActiveTech] = useState('FWA');
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isAddingConnection, setIsAddingConnection] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch(`/api/diagnostico/${activeTech}`);
        if (response.ok) {
          const data = await response.json();
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes);
            setEdges(data.edges || []);
          } else {
            const localNodes = localStorage.getItem(`diag_nodes_${activeTech}`);
            const localEdges = localStorage.getItem(`diag_edges_${activeTech}`);
            setNodes(localNodes ? JSON.parse(localNodes) : []);
            setEdges(localEdges ? JSON.parse(localEdges) : []);
          }
        }
      } catch (error) {
        const localNodes = localStorage.getItem(`diag_nodes_${activeTech}`);
        const localEdges = localStorage.getItem(`diag_edges_${activeTech}`);
        setNodes(localNodes ? JSON.parse(localNodes) : []);
        setEdges(localEdges ? JSON.parse(localEdges) : []);
      }
    };
    fetchSchema();
  }, [activeTech]);

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    localStorage.setItem(`diag_nodes_${activeTech}`, JSON.stringify(nodes));
    localStorage.setItem(`diag_edges_${activeTech}`, JSON.stringify(edges));

    const saveToDB = async () => {
      try {
        await fetch('/api/diagnostico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tech: activeTech, nodes, edges })
        });
      } catch (err) {}
    };
    const timer = setTimeout(saveToDB, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges, activeTech]);

  const addNode = (type: 'step' | 'image' | 'decision') => {
    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 400 / zoom,
      y: 300 / zoom,
      text: type === 'decision' ? 'Latência acima do limite' : type === 'image' ? 'Distribuição Principal' : 'CTRL-001',
      subtitle: type === 'decision' ? 'Última verificação: 2 min atrás' : type === 'image' ? 'Conectividade física verificada via log de inspeção visual no local.' : 'Status Ativo',
      image: type === 'image' ? 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=400&q=80' : null,
      tags: type === 'image' ? ['FTTX-HUB', 'VLAN 204'] : [],
      status: 'Ativo'
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(edge => edge.from !== id && edge.to !== id));
  };

  const updateNode = (id: string, field: string, value: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const startConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingConnection(id);
  };

  const endConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAddingConnection && isAddingConnection !== id) {
      if (!edges.some(edge => edge.from === isAddingConnection && edge.to === id)) {
        setEdges(prev => [...prev, { id: `${isAddingConnection}-${id}`, from: isAddingConnection, to: id }]);
      }
      setIsAddingConnection(null);
    } else {
      setIsAddingConnection(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      <div className="px-8 py-8 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Diagnóstico Inicial</h2>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {techs.map(t => (
              <button
                key={t.name}
                onClick={() => setActiveTech(t.name)}
                className={`px-8 py-5 rounded-lg text-sm font-black transition-all ${
                  activeTech === t.name 
                    ? 'bg-[#047857] text-white shadow-2xl shadow-emerald-500/20 scale-105' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
             <button onClick={() => addNode('step')} className="flex items-center gap-3 px-8 py-5 bg-[#047857] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all">
               <PlusCircle className="w-5 h-5" /> PASSO
             </button>
             <button onClick={() => addNode('decision')} className="flex items-center gap-3 px-8 py-5 bg-[#f97316] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all">
               <HelpCircle className="w-5 h-5" /> DECISÃO
             </button>
             <button onClick={() => addNode('image')} className="flex items-center gap-3 px-8 py-5 bg-[#3b82f6] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all">
               <ImageIcon className="w-5 h-5" /> IMAGEM
             </button>
          </div>
        </div>
      </div>

      {/* Toolbar Flutuante */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-white p-2 rounded-2xl shadow-2xl border border-slate-100 z-50">
        <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-black" title="Aumentar Zoom"><ZoomIn className="w-6 h-6" /></button>
        <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-black" title="Diminuir Zoom"><ZoomOut className="w-6 h-6" /></button>
        <button onClick={() => setZoom(1)} className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-black" title="Resetar Zoom"><Navigation className="w-6 h-6" /></button>
        <button className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-black cursor-grab"><HandMetal className="w-6 h-6" /></button>
      </div>

      {/* Espaço de Trabalho */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
        <div 
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            {edges.map(edge => {
              const from = nodes.find(n => n.id === edge.from);
              const to = nodes.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const fromOffset = from.type === 'image' ? { x: 225, y: 80 } : { x: 160, y: 60 };
              const toOffset = to.type === 'image' ? { x: 225, y: 80 } : { x: 160, y: 60 };
              return (
                <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={() => setEdges(edges.filter(e => e.id !== edge.id))}>
                  <line 
                    x1={from.x + fromOffset.x} y1={from.y + fromOffset.y} 
                    x2={to.x + toOffset.x} y2={to.y + toOffset.y} 
                    stroke="#94a3b8" strokeWidth="2" strokeDasharray="8,8"
                    markerEnd="url(#arrow)"
                    className="opacity-40 hover:opacity-100 hover:stroke-rose-400 transition-all"
                  />
                </g>
              );
            })}
          </svg>

          <div className="absolute inset-0 z-10">
            <AnimatePresence>
              {nodes.map(node => (
                <motion.div
                  key={node.id}
                  drag
                  dragMomentum={false}
                  onDragEnd={(e, info) => {
                    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: n.x + info.offset.x / zoom, y: n.y + info.offset.y / zoom } : n));
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ x: node.x, y: node.y, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute group ${node.type === 'image' ? 'w-[450px]' : 'w-[320px]'} bg-white rounded-2xl shadow-2xl border-2 transition-all ${
                    isAddingConnection === node.id ? 'border-blue-500 ring-4 ring-blue-500/10 scale-105' : 'border-slate-100 hover:border-slate-300'
                  }`}
                  style={{ position: 'absolute' }}
                  onClick={(e) => isAddingConnection && endConnection(node.id, e)}
                >
                  {node.type === 'step' && (
                    <div className="flex flex-col">
                      <div className="bg-black p-4 rounded-t-[14px] flex items-center justify-between">
                        <input 
                          value={node.text}
                          onChange={e => updateNode(node.id, 'text', e.target.value)}
                          className="bg-transparent text-[11px] font-black text-white uppercase tracking-[0.2em] outline-none w-full"
                        />
                        <Settings className="w-4 h-4 text-white/30" />
                      </div>
                      <div className="p-6 flex items-center justify-between">
                        <input 
                          value="Status"
                          readOnly
                          className="text-sm font-bold text-slate-400 bg-transparent outline-none w-20"
                        />
                        <div className="flex flex-col items-end gap-1.5">
                          <input 
                            value={node.status || 'Ativo'}
                            onChange={e => updateNode(node.id, 'status', e.target.value)}
                            className="text-sm font-black text-emerald-500 uppercase tracking-widest bg-transparent outline-none text-right"
                          />
                          <div className="w-32 h-1.5 bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}

                  {node.type === 'decision' && (
                    <div className="p-8 border-2 border-[#f97316] rounded-2xl relative bg-white">
                      <div className="absolute top-6 left-6 w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-[#f97316]" />
                      </div>
                      <div className="ml-20">
                        <textarea 
                          value={node.text}
                          onChange={e => updateNode(node.id, 'text', e.target.value)}
                          className="text-base font-black text-slate-800 leading-tight mb-1 bg-transparent w-full outline-none resize-none"
                          rows={2}
                        />
                        <input 
                          value={node.subtitle}
                          onChange={e => updateNode(node.id, 'subtitle', e.target.value)}
                          className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-transparent w-full outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {node.type === 'image' && (
                    <div className="p-6 border-2 border-[#3b82f6] rounded-2xl flex gap-6 bg-white">
                      <div className="w-40 h-40 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-inner group-relative">
                        <img src={node.image!} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity flex items-center justify-center p-4">
                           <input 
                             placeholder="URL da Imagem"
                             value={node.image || ''}
                             onChange={e => updateNode(node.id, 'image', e.target.value)}
                             className="text-[8px] bg-white rounded p-1 w-full outline-none"
                           />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col pt-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Server className="w-4 h-4 text-slate-400" />
                          <input 
                            value="UNIDADE DE RACK 04"
                            readOnly
                            className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-transparent outline-none"
                          />
                        </div>
                        <input 
                          value={node.text}
                          onChange={e => updateNode(node.id, 'text', e.target.value)}
                          className="text-xl font-black text-slate-800 leading-none mb-3 bg-transparent outline-none"
                        />
                        <textarea 
                          value={node.subtitle}
                          onChange={e => updateNode(node.id, 'subtitle', e.target.value)}
                          className="text-xs font-bold text-slate-500 leading-relaxed mb-6 bg-transparent outline-none resize-none"
                          rows={3}
                        />
                        <div className="mt-auto flex gap-2">
                          {node.tags?.map((tag: string, idx: number) => (
                            <input 
                              key={idx}
                              value={tag}
                              onChange={e => {
                                const newTags = [...node.tags];
                                newTags[idx] = e.target.value;
                                updateNode(node.id, 'tags', newTags);
                              }}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-emerald-100 outline-none w-20"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controles de Bloco (Sempre visíveis no hover) */}
                  <div className="absolute -top-4 -right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-20">
                    <button onClick={(e) => startConnection(node.id, e)} className="w-10 h-10 bg-white border border-slate-200 rounded-full shadow-2xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all" title="Conectar"><Share2 className="w-5 h-5" /></button>
                    <button onClick={(e) => deleteNode(node.id, e)} className="w-10 h-10 bg-white border border-slate-200 rounded-full shadow-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all" title="Apagar"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tooltip de Ajuda Inferior */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-5 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center gap-5 border border-white/10">
        <div className="p-2 bg-white/10 rounded-xl">
          <MousePointer2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Guia de Edição</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clique nos textos para editar. Arraste para mover. Use os botões no canto do bloco para conectar ou apagar.</span>
        </div>
      </div>
    </div>
  );
}
function MapasMPLS({ sites }: { sites: any[] }) {
  const [maps, setMaps] = useState<any[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string>('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isAddingConnection, setIsAddingConnection] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Carregar lista de mapas
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const response = await fetch('/api/diagnostico?tech=mpls_map_list');
        const data = await response.json();
        const mapList = data.maps || [{ id: 'default', name: 'Mapa Principal' }];
        setMaps(mapList);
        if (!currentMapId) setCurrentMapId(mapList[0].id);
      } catch (err) {
        setMaps([{ id: 'default', name: 'Mapa Principal' }]);
        setCurrentMapId('default');
      }
    };
    fetchMaps();
  }, []);

  // Carregar dados do mapa atual
  useEffect(() => {
    if (!currentMapId) return;
    const fetchMapData = async () => {
      try {
        const response = await fetch(`/api/diagnostico?tech=mpls_data_${currentMapId}`);
        const data = await response.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (err) {
        const localNodes = localStorage.getItem(`mpls_nodes_${currentMapId}`);
        const localEdges = localStorage.getItem(`mpls_edges_${currentMapId}`);
        setNodes(localNodes ? JSON.parse(localNodes) : []);
        setEdges(localEdges ? JSON.parse(localEdges) : []);
      }
    };
    fetchMapData();
  }, [currentMapId]);

  // Salvar dados do mapa atual
  useEffect(() => {
    if (!currentMapId || (nodes.length === 0 && edges.length === 0)) return;
    localStorage.setItem(`mpls_nodes_${currentMapId}`, JSON.stringify(nodes));
    localStorage.setItem(`mpls_edges_${currentMapId}`, JSON.stringify(edges));

    const saveToDB = async () => {
      try {
        await fetch('/api/diagnostico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tech: `mpls_data_${currentMapId}`, nodes, edges })
        });
      } catch (err) {}
    };
    const timer = setTimeout(saveToDB, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges, currentMapId]);

  const createNewMap = async () => {
    const name = prompt('Nome do novo mapa:');
    if (!name) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newMaps = [...maps, { id: newId, name }];
    setMaps(newMaps);
    setCurrentMapId(newId);
    setNodes([]);
    setEdges([]);
    
    // Salvar lista de mapas
    await fetch('/api/diagnostico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tech: 'mpls_map_list', maps: newMaps })
    });
  };

  const deleteCurrentMap = async () => {
    if (!confirm('Apagar este mapa permanentemente?')) return;
    const newMaps = maps.filter(m => m.id !== currentMapId);
    setMaps(newMaps);
    if (newMaps.length > 0) {
      setCurrentMapId(newMaps[0].id);
    } else {
      const defaultId = 'default';
      const defaultMaps = [{ id: defaultId, name: 'Mapa Principal' }];
      setMaps(defaultMaps);
      setCurrentMapId(defaultId);
    }
    
    await fetch('/api/diagnostico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tech: 'mpls_map_list', maps: newMaps.length > 0 ? newMaps : [{ id: 'default', name: 'Mapa Principal' }] })
    });
  };

  const addMonitoredDevice = (site: any) => {
    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type: site.categoria?.toLowerCase().includes('router') ? 'router' : 
            site.categoria?.toLowerCase().includes('switch') ? 'sw' : 'server',
      x: 100,
      y: 100,
      name: site.nome_site,
      ip: site.ip,
      status: 'Ativo'
    };
    setNodes(prev => [...prev, newNode]);
    setIsImportModalOpen(false);
  };

  const addNode = (type: string) => {
    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 400 / zoom,
      y: 300 / zoom,
      name: type.toUpperCase(),
      ip: '10.255.0.' + Math.floor(Math.random() * 254),
      status: 'Ativo',
      latency: Math.floor(Math.random() * 50) + 'ms',
      loss: '0%'
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(edge => edge.from !== id && edge.to !== id));
  };

  const updateNode = (id: string, field: string, value: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const exportToPng = async () => {
    if (mapRef.current) {
      try {
        const dataUrl = await toPng(mapRef.current, {
          backgroundColor: '#0f172a',
          quality: 1,
          pixelRatio: 2
        });
        const link = document.createElement('a');
        link.download = `mapa-mpls-${activeRegion.toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Erro ao exportar PNG:', err);
      }
    }
  };

  const nodeTypes = [
    { id: 'router', label: 'Core P', color: 'bg-blue-600' },
    { id: 'pe', label: 'PE-Edge', color: 'bg-emerald-600' },
    { id: 'sw', label: 'Switch L3', color: 'bg-indigo-600' },
    { id: 'fw', label: 'Firewall', color: 'bg-rose-600' },
    { id: 'cloud', label: 'Internet', color: 'bg-sky-600' },
    { id: 'radio', label: 'Rádio/FWA', color: 'bg-amber-600' },
    { id: 'sat', label: 'Satélite', color: 'bg-purple-600' },
    { id: 'server', label: 'Server', color: 'bg-slate-600' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020617] relative overflow-hidden select-none">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_1px,transparent_1px)] [background-size:40px_40px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,_#ffffff05_1px,transparent_1px)] [background-size:200px_200px]"></div>
      </div>

      <div className="px-8 py-6 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Network className="w-7 h-7 text-blue-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                MAPA
              </h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-1">Mercury Sentinel NOC Active Vision</p>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            {maps.map(m => (
              <button
                key={m.id}
                onClick={() => setCurrentMapId(m.id)}
                className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                  currentMapId === m.id 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
            <button onClick={createNewMap} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all ml-2" title="Novo Mapa"><PlusCircle className="w-4 h-4" /></button>
            <button onClick={deleteCurrentMap} className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all" title="Apagar Mapa Atual"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            disabled={isLocked}
            className="px-6 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-20"
          >
            <Server className="w-5 h-5" />
            Importar Dispositivo
          </button>
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
            <button 
              onClick={() => setIsLocked(!isLocked)}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border ${
                isLocked 
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {isLocked ? 'Locked' : 'Edit Mode'}
            </button>
            
            <button 
              onClick={exportToPng}
              className="px-6 py-3 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white border border-white/5 rounded-xl transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
            >
              <FileText className="w-4 h-4" />
              Export PNG
            </button>
          </div>

          <div className="h-12 w-px bg-white/10"></div>

          <div className="grid grid-cols-4 gap-2">
            {nodeTypes.map(t => (
              <button 
                key={t.id}
                disabled={isLocked}
                onClick={() => addNode(t.id)} 
                className={`flex items-center justify-center p-3 ${t.color.replace('bg-', 'text-')} bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-20 group`}
                title={t.label}
              >
                <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div 
        className="flex-1 relative overflow-hidden" 
        ref={mapRef}
        onMouseMove={(e) => {
          if (isAddingConnection && mapRef.current) {
            const rect = mapRef.current.getBoundingClientRect();
            setMousePos({ 
              x: (e.clientX - rect.left) / zoom, 
              y: (e.clientY - rect.top) / zoom 
            });
          }
        }}
      >
        <div 
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Linha Temporária de Conexão */}
            {isAddingConnection && (
              <path
                d={`M ${nodes.find(n => n.id === isAddingConnection)?.x + 128} ${nodes.find(n => n.id === isAddingConnection)?.y + 40} L ${mousePos.x} ${mousePos.y}`}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5, 5"
                className="opacity-50"
              />
            )}
            {edges.map(edge => {
              const from = nodes.find(n => n.id === edge.from);
              const to = nodes.find(n => n.id === edge.to);
              if (!from || !to) return null;

              const x1 = (from.x + 128); 
              const y1 = (from.y + 40); 
              const x2 = (to.x + 128);
              const y2 = (to.y + 40);

              return (
                <g key={edge.id} className="group/edge pointer-events-auto cursor-pointer" onClick={() => !isLocked && setEdges(edges.filter(e => e.id !== edge.id))}>
                  <path
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke="rgba(59, 130, 246, 0.05)"
                    strokeWidth="10"
                    fill="none"
                    className="transition-all group-hover/edge:stroke-blue-500/20"
                  />
                  <path
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke="url(#edgeGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="15, 15"
                    className="animate-dash"
                    style={{ filter: 'url(#glow)' }}
                  />
                  <text 
                    x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} 
                    fill="#3b82f6" fontSize="7" fontWeight="black" 
                    className="select-none pointer-events-none opacity-40 uppercase tracking-widest"
                    textAnchor="middle"
                  >
                    Túnel MPLS Active
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute inset-0 z-10">
            <AnimatePresence>
              {nodes.map(node => {
                const siteInfo = sites.find(s => s.ip === node.ip);
                const isOnline = siteInfo ? siteInfo.status === 'up' : true;

                return (
                  <motion.div
                    key={node.id}
                    drag={!isLocked}
                    dragMomentum={false}
                    onDragEnd={(e, info) => {
                      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: n.x + info.offset.x / zoom, y: n.y + info.offset.y / zoom } : n));
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ x: node.x, y: node.y, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute group w-64 bg-slate-900/60 backdrop-blur-3xl border-2 transition-all p-5 rounded-[2.5rem] ${
                      isAddingConnection === node.id ? 'border-blue-500 ring-[12px] ring-blue-500/10' : 
                      isOnline ? 'border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.05)] hover:border-emerald-500/40' : 
                      'border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.15)] animate-pulse'
                    }`}
                    style={{ position: 'absolute' }}
                    onClick={() => !isLocked && isAddingConnection && (() => {
                      if (isAddingConnection !== node.id) {
                        setEdges(prev => [...prev, { id: `${isAddingConnection}-${node.id}`, from: isAddingConnection, to: node.id }]);
                      }
                      setIsAddingConnection(null);
                    })()}
                  >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-2xl ${
                        node.type === 'router' ? 'from-blue-500 to-blue-700 shadow-blue-500/20' : 
                        node.type === 'pe' ? 'from-emerald-500 to-emerald-700 shadow-emerald-500/20' : 
                        node.type === 'sw' ? 'from-indigo-500 to-indigo-700 shadow-indigo-500/20' :
                        node.type === 'fw' ? 'from-rose-500 to-rose-700 shadow-rose-500/20' :
                        'from-slate-500 to-slate-700'
                      }`}>
                        {node.type === 'router' || node.type === 'pe' ? (
                          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'} fill-none stroke-current stroke-2`}>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v10M7 12h10M9 9l6 6M15 9l-6 6" />
                          </svg>
                        ) : node.type === 'sw' ? (
                          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'} fill-none stroke-current stroke-2`}>
                            <rect x="3" y="6" width="18" height="12" rx="2" />
                            <path d="M7 10h10M7 14h10M9 8v8M15 8v8" />
                          </svg>
                        ) : node.type === 'fw' ? (
                          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'} fill-none stroke-current stroke-2`}>
                            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                            <path d="M12 17v-6M8 11h8" />
                          </svg>
                        ) : node.type === 'cloud' ? (
                          <Globe className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'}`} />
                        ) : node.type === 'radio' ? (
                          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'} fill-none stroke-current stroke-2`}>
                            <circle cx="12" cy="12" r="2" />
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                        ) : node.type === 'sat' ? (
                          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'} fill-none stroke-current stroke-2`}>
                            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 9V5M12 19v-4M9 12H5M19 12h-4" />
                          </svg>
                        ) : (
                          <Server className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-rose-100'}`} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <input 
                          disabled={isLocked}
                          value={node.name}
                          onChange={e => updateNode(node.id, 'name', e.target.value)}
                          className="bg-transparent text-xs font-black text-white outline-none w-full"
                        />
                        <input 
                          disabled={isLocked}
                          value={node.ip}
                          onChange={e => updateNode(node.id, 'ip', e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-full mt-0.5"
                        />
                      </div>
                    </div>
                    {!isLocked && (
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <button onClick={(e) => { e.stopPropagation(); setIsAddingConnection(node.id); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all shadow-xl" title="Conectar"><Share2 className="w-3 h-3" /></button>
                      <button onClick={(e) => deleteNode(node.id, e)} className="p-2 bg-rose-500/20 hover:bg-rose-500 rounded-lg text-rose-500 hover:text-white transition-all shadow-xl" title="Apagar"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-slate-800 p-2 rounded-2xl shadow-2xl border border-white/5 z-50">
        <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-slate-400 hover:text-white" title="Aumentar Zoom"><ZoomIn className="w-6 h-6" /></button>
        <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-slate-400 hover:text-white" title="Diminuir Zoom"><ZoomOut className="w-6 h-6" /></button>
        <button onClick={() => setZoom(1)} className="p-4 hover:bg-white/5 rounded-2xl transition-all text-slate-400 hover:text-white" title="Resetar Zoom"><Navigation className="w-6 h-6" /></button>
      </div>

      {/* Modal de Importação */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Importar Dispositivos</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Selecione um elemento monitorado para o mapa</p>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {sites.filter(s => !nodes.some(n => n.ip === s.ip)).map(site => (
                  <button 
                    key={site.id}
                    onClick={() => addMonitoredDevice(site)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 ${site.status === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <Server className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-white block">{site.nome_site}</span>
                        <span className="text-[10px] font-mono text-slate-500">{site.ip}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{site.categoria}</span>
                      <PlusCircle className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
