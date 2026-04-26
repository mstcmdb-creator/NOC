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

    // Lógica de Dependência (Motor de Diagnóstico Automático)
    const sites = data || [];
    const siteMap = new Map(sites.map(s => [s.ip, s]));

    const processedSites = sites.map(site => {
      if (site.status === 'up') return site;
      
      const deps = (site.depende_de || '').split(',').map((ip: string) => ip.trim()).filter(Boolean);
      if (deps.length === 0) return site;

      const downDependencies = deps
        .map(depIp => siteMap.get(depIp))
        .filter(dep => dep && dep.status === 'down');

      if (downDependencies.length > 0) {
        const findRoots = (currentSite: any): string[] => {
          const deps = (currentSite.depende_de || '').split(',').map((ip: string) => ip.trim()).filter(Boolean);
          const downDeps = deps.map(ip => siteMap.get(ip)).filter(d => d && d.status === 'down');
          if (downDeps.length === 0) return [currentSite.nome_site];
          return downDeps.flatMap(d => findRoots(d));
        };

        const allRoots = downDependencies.flatMap(dep => findRoots(dep));
        const uniqueRoots = Array.from(new Set(allRoots));

        return { 
          ...site, 
          status: 'dependente', 
          causa_raiz: uniqueRoots.join(', ')
        };
      }

      return site;
    });

    res.json(processedSites);
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
    console.error("Erro interno:", err);
    res.status(500).send("Erro interno");
  }
});

// NOVO: Atualizar site
app.post("/api/sites/update", async (req, res) => {
  const { nome_site, ip, categoria, descricao, depende_de, old_ip } = req.body;
  try {
    const { error } = await supabase
      .from('sites')
      .update({ nome_site, ip, categoria, descricao, depende_de })
      .eq('ip', old_ip);

    if (error) throw error;
    res.send("OK");
  } catch (err: any) {
    res.status(500).send(err.message);
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

  // Só inicia o listen se não estiver na Vercel
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor a correr em http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
