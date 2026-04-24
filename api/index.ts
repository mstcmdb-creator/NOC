import express from "express";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Endpoint da API para o Dashboard buscar todos os sites
app.get("/api/sites", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*');
    
    if (error) {
      console.error("Erro no Supabase:", error);
      return res.json([]);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// ENDPOINT PONTE PARA MIKROTIK
app.get("/api/update-status", async (req, res) => {
  const { ip, status, name, category } = req.query;
  
  if (!ip || !status) {
    return res.status(400).send("Faltam parâmetros ip e status");
  }

  try {
    // 1. Buscar dados atuais para calcular o tempo passado
    const { data: oldSite, error: fetchError } = await supabase
      .from('sites')
      .select('*')
      .eq('ip', ip as string)
      .maybeSingle();

    if (fetchError) {
      console.error("Erro ao procurar site:", fetchError);
      return res.status(500).send(`Erro ao procurar site: ${fetchError.message}`);
    }

    let tempoTotal = Number(oldSite?.tempo_total_segundos || 0);
    let tempoOnline = Number(oldSite?.tempo_online_segundos || 0);
    let totalIncidentes = Number(oldSite?.total_incidentes_resolvidos || 0);
    let totalTempoResolucao = Number(oldSite?.total_tempo_resolucao_segundos || 0);
    let tmroSegundos = Number(oldSite?.tmro_segundos || 0);

    if (oldSite?.ultima_verificacao) {
      const agora = new Date();
      const ultima = new Date(oldSite.ultima_verificacao);
      const deltaSegundos = Math.floor((agora.getTime() - ultima.getTime()) / 1000);

      // Apenas conta se o intervalo for razoável (evita saltos se o sistema esteve parado)
      if (deltaSegundos > 0 && deltaSegundos < 3600) {
        tempoTotal += deltaSegundos;
        if (oldSite.status === 'up') {
          tempoOnline += deltaSegundos;
        }
      }
    }

    const uptimeSLA = tempoTotal > 0 ? parseFloat((tempoOnline / tempoTotal * 100).toFixed(2)) : 100.0;

    // DETEÇÃO DE RESOLUÇÃO (Passou de DOWN para UP)
    if (oldSite?.status === 'down' && status === 'up') {
      const agora = new Date();
      const caiuEm = new Date(oldSite.status_desde || oldSite.ultima_verificacao);
      const tempoFalha = Math.floor((agora.getTime() - caiuEm.getTime()) / 1000);

      if (tempoFalha > 0) {
        totalIncidentes += 1;
        totalTempoResolucao += tempoFalha;
        tmroSegundos = parseFloat((totalTempoResolucao / totalIncidentes).toFixed(1));
      }
    }

    // 2. Gravar novos dados com métricas de SLA e TMRO
    const { error: upsertError } = await supabase
      .from('sites')
      .upsert({ 
        ip: ip as string, 
        status: status as string, 
        nome_site: name as string || oldSite?.nome_site || (ip as string),
        categoria: category as string || oldSite?.categoria || 'Site',
        tempo_total_segundos: tempoTotal,
        tempo_online_segundos: tempoOnline,
        uptime_sla: uptimeSLA,
        total_incidentes_resolvidos: totalIncidentes,
        total_tempo_resolucao_segundos: totalTempoResolucao,
        tmro_segundos: tmroSegundos,
        status_desde: (status !== oldSite?.status) ? new Date().toISOString() : (oldSite?.status_desde || new Date().toISOString()),
        ultima_verificacao: new Date().toISOString()
      }, { onConflict: 'ip' });

    if (upsertError) {
      console.error("Erro no Upsert:", upsertError);
      return res.status(500).send(`Erro ao gravar dados: ${upsertError.message}`);
    }

    res.send("OK");
  } catch (err: any) {
    console.error("Erro Crítico:", err);
    res.status(500).send(`Erro Crítico no Servidor: ${err.message || 'Erro Desconhecido'}`);
  }
});

// NOVO ENDPOINT: Histórico de um site específico
app.get("/api/site-logs", async (req, res) => {
  const { ip } = req.query;
  
  if (!ip) {
    return res.status(400).send("Falta o IP");
  }

  try {
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('site_ip', ip as string)
      .order('changed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json([]);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json([]);
  }
});

// NOVO: Criar site manualmente
app.post("/api/sites", async (req, res) => {
  const { nome_site, ip, categoria, descricao } = req.body;

  if (!nome_site || !ip) {
    return res.status(400).send("Nome e IP são obrigatórios");
  }

  try {
    const { data, error } = await supabase
      .from('sites')
      .upsert({ 
        nome_site, 
        ip, 
        categoria: categoria || 'Site',
        descricao: descricao || '',
        status: 'down', // Começa como down até o primeiro ping
        ultima_verificacao: new Date().toISOString()
      }, { onConflict: 'ip' });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// NOVO: Listar categorias
app.get("/api/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json([]);
  }
});

// NOVO: Criar categoria
app.post("/api/categories", async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).send("Nome é obrigatório");

  try {
    const { data, error } = await supabase
      .from('categorias')
      .insert({ nome })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// NOVO: Apagar site
app.delete("/api/sites", async (req, res) => {
  const { ip } = req.query;
  try {
    const { error } = await supabase.from('sites').delete().eq('ip', ip as string);
    if (error) throw error;
    res.send("OK");
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// NOVO: Apagar categoria
app.delete("/api/categories", async (req, res) => {
  const { id } = req.query;
  try {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
    res.send("OK");
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

export default app;
