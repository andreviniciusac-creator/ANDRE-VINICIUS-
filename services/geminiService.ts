import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

// NOTE: In a real production app, never expose API keys on the client.
// This is for demonstration purposes as per instructions using process.env.
// The user must ensure process.env.API_KEY is available in their build environment.

const apiKey = process.env.API_KEY || ''; 
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
}

export const geminiService = {
  isAvailable: () => !!ai,

  generateProductDescription: async (name: string, category: string, features: string): Promise<string> => {
    if (!ai) return "Gemini API Key não configurada.";

    try {
      const prompt = `Escreva uma descrição atraente, curta e elegante (máximo 40 palavras) para uma loja de roupas feminina.
      Produto: ${name}
      Categoria: ${category}
      Características: ${features}
      
      Apenas a descrição, sem aspas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Descrição indisponível.";
    } catch (error) {
      console.error("Erro Gemini:", error);
      return "Erro ao gerar descrição.";
    }
  },

  analyzeSalesTrend: async (sales: Sale[]): Promise<string> => {
    if (!ai) return "Análise indisponível. Configure a API Key.";
    if (sales.length === 0) return "Sem dados suficientes para análise.";

    // Summarize data for the prompt to save tokens
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalSales = sales.length;
    
    // Simple logic to find top seller in JS before sending to AI
    const itemCounts: Record<string, number> = {};
    sales.forEach(s => s.items.forEach(i => {
      itemCounts[i.productName] = (itemCounts[i.productName] || 0) + i.quantity;
    }));
    const topProducts = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(", ");

    const prompt = `Atue como um consultor de vendas de moda experiente.
    Analise estes dados de vendas recentes:
    - Total Vendido: R$ ${totalRevenue.toFixed(2)}
    - Número de Vendas: ${totalSales}
    - Produtos mais vendidos: ${topProducts}

    Forneça um insight curto (max 50 palavras) e motivador para a equipe de vendas sobre o desempenho e uma dica rápida.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Não foi possível analisar.";
    } catch (error) {
      return "Erro na análise de vendas.";
    }
  }
};
