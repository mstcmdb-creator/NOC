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

// ENDPOINT PONTE PARA MIKROTIK (VERSÃO ULTRA-SIMPLIFICADA PARA DEBUG)
app.get("/api/update-status", async (req, res) => {
  const { ip, status, name, category } = req.query;
  
  if (!ip || !status) {
    return res.status(400).send("Faltam parâmetros ip e status");
  }

  try {
    // 1. Tentar gravar na base de dados
    const { error } = await supabase
      .from('sites')
      .upsert({ 
        ip: ip as string, 
        status: status as string, 
        nome_site: name as string || (ip as string),
        categoria: category as string || 'Site',
        ultima_verificacao: new Date().toISOString()
      }, { onConflict: 'ip' });

    if (error) {
      // Se houver erro no Supabase, mandamos para o MikroTik ver
      return res.status(200).send(`ERRO_DB: ${error.message} - CODE: ${error.code}`);
    }

    return res.status(200).send("DB_SUCESSO_OK");
  } catch (err: any) {
    return res.status(200).send(`ERRO_CATCH: ${err.message}`);
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
