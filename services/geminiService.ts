import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.API_KEY || ''; 
    return new GoogleGenAI({ apiKey });
}

export const generateStrategyCode = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
      console.warn("No API KEY provided for Gemini");
      return "# 错误: 未配置 Google Gemini API Key。无法生成代码。\n# 请在环境变量中设置 API_KEY。";
  }

  try {
    const ai = getClient();
    const systemInstruction = `
      你是一个专业的量化交易策略编写助手。
      请根据用户的描述，生成可执行的 Python 交易策略代码片段。
      假设我们使用一个通用的量化框架，包含 'on_tick(data)', 'buy(symbol, amount)', 'sell(symbol, amount)' 等基础函数。
      代码应该包含详细的中文注释，解释策略逻辑。
      只返回 Python 代码，不要包含 Markdown 格式化符号（如 \`\`\`python）。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "# 未能生成代码，请重试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `# 生成代码时出错: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};