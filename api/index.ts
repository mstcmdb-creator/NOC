import express from "express";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();

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
    const { data: oldSite } = await supabase
      .from('sites')
      .select('*')
      .eq('ip', ip as string)
      .single();

    let tempoTotal = oldSite?.tempo_total_segundos || 0;
    let tempoOnline = oldSite?.tempo_online_segundos || 0;

    if (oldSite && oldSite.ultima_verificacao) {
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

    // 2. Gravar novos dados com métricas de SLA
    const { error } = await supabase
      .from('sites')
      .upsert({ 
        ip: ip as string, 
        status: status as string, 
        nome_site: name as string || oldSite?.nome_site || (ip as string),
        categoria: category as string || oldSite?.categoria || 'Site',
        tempo_total_segundos: tempoTotal,
        tempo_online_segundos: tempoOnline,
        uptime_sla: uptimeSLA,
        ultima_verificacao: new Date().toISOString()
      }, { onConflict: 'ip' });

    if (error) {
      console.error("Erro no Supabase:", error);
      return res.status(500).send(error.message);
    }

    res.send("OK");
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).send("Erro interno");
  }
});

export default app;
