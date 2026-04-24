import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
const PORT = 3000;

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
      console.error("Erro ao procurar dados no Supabase:", error);
      return res.json([
        { id: 1, nome_site: "Sede Lisboa - Core", ip: "192.168.1.1", status: "up", ultima_verificacao: new Date().toISOString() },
        { id: 2, nome_site: "Data Center Porto", ip: "10.0.0.45", status: "up", ultima_verificacao: new Date().toISOString() }
      ]);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// ENDPOINT PONTE PARA MIKROTIK (v6 e v7)
// Este endpoint permite que o MikroTik atualize o estado sem headers complexos
app.get("/api/update-status", async (req, res) => {
  const { ip, status } = req.query;
  
  if (!ip || !status) {
    return res.status(400).send("Faltam parâmetros ip e status");
  }

  try {
    const { error } = await supabase
      .from('sites')
      .update({ status: status as string })
      .eq('ip', ip as string);

    if (error) {
      console.error("Erro no Supabase:", error);
      return res.status(500).send(error.message);
    }

    console.log(`MikroTik: Site ${ip} atualizado para ${status}`);
    res.send("OK");
  } catch (err) {
    res.status(500).send("Erro interno");
  }
});

// Novo endpoint para o MikroTik atualizar o status via GET simples
app.get("/api/update-status", async (req, res) => {
  const { ip, status } = req.query;
  
  if (!ip || !status) {
    return res.status(400).send("Faltam parâmetros ip e status");
  }

  try {
    const { error } = await supabase
      .from('sites')
      .update({ status: status as string })
      .eq('ip', ip as string);

    if (error) {
      console.error("Erro ao atualizar no Supabase:", error);
      return res.status(500).send(error.message);
    }

    console.log(`Status do site ${ip} atualizado para ${status}`);
    res.send("OK");
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).send("Erro interno");
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
  });
}

startServer();
