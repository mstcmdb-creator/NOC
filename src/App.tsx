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
  Map as MapIcon,
  Lock,
  LogOut,
  Search,
  X,
  Pin,
  PinOff,
  ShieldCheck,
  HandMetal,
  User
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
  if (!ticketNum || !/^\d+$/.test(ticketNum)) return null;
  // Equivalência: 093812 -> 71640. Offset = -22172
  const internalId = parseInt(ticketNum, 10) - 22172;
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
      const pinA = pinnedCategories.includes(a);
      const pinB = pinnedCategories.includes(b);
      if (pinA && !pinB) return -1;
      if (!pinA && pinB) return 1;
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">MERCURY-JS</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">NOCng Security Gate</p>
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
                          {(log.ticket_numero || log.responsavel) && (
                            <div className="mt-2 flex gap-3">
                              {log.ticket_numero && (
                                <a 
                                  href={getOTRSLink(log.ticket_numero) || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors flex items-center gap-1"
                                >
                                  Ticket #{log.ticket_numero}
                                  <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                                </a>
                              )}
                              {log.responsavel && <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-100 italic">Resp: {log.responsavel}</span>}
                            </div>
                          )}
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
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {/* Sub-Header: Search & Secondary Actions */}
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
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hidden sm:flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tempo Real Ativo</span>
              </div>
              <button 
                onClick={() => fetchData()}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-slate-600"
                title="Forçar Atualização"
              >
                <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-8">
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
                  const sitesDependent = categorySites.filter(s => s.status === 'dependente');
                  const sitesOffline = categorySites.filter(s => s.status === 'down');
                  
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

                        <div className="space-y-4">
                          <AnimatePresence mode="popLayout">
                            {[...sitesDependent, ...sitesOffline].map(site => (
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
            
            {!isUp && site.depende_de && (
              <p className="text-[9px] text-slate-400 mt-1 italic break-words leading-normal">
                Depende de: {site.depende_de.split(',').map(ip => sites.find(s => s.ip === ip)?.nome_site || ip).join(', ')}
              </p>
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
      <td className="px-6 py-4 text-xs text-slate-400 font-medium">{user}</td>
    </tr>
  );
}
