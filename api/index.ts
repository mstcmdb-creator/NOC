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

  const siteName = (name as string) || (ip as string);
  const siteCategory = (category as string) || 'Site';

  try {
    const { error } = await supabase
      .from('sites')
      .upsert({ 
        ip: ip as string, 
        status: status as string, 
        nome_site: siteName,
        categoria: siteCategory
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
