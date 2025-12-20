import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeContract = async (text: string, fileBase64?: string, mimeType?: string): Promise<string> => {
  try {
    const parts: any[] = [];

    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: mimeType
        }
      });
    }

    let prompt = `제공된 계약 조항이나 문서 이미지를 분석하세요. 
      임차인 또는 매수인 입장에서 구체적인 위험 요소를 식별하세요.
      응답은 JSON 형식으로 반환하며, 모든 텍스트 값은 한국어로 작성하세요.
      단, severity 값은 'High', 'Medium', 'Low' 중 하나로 유지하세요.
      각 위험 요소에 대해 구체적이고 실행 가능한 단계별 대응 방안을 제시하세요.
      `;

    if (text) {
      prompt += `\n\n구체적인 조항/내용: "${text}"`;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: "당신은 유능한 한국 부동산 전문 AI 비서입니다. 계약서의 위험 요소를 분석하고 조언을 제공하세요. 전문적이지만 이해하기 쉽게 간결하게 작성하세요.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "전체 분석에 대한 간략한 요약 (한국어)" },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clause: { type: Type.STRING, description: "위험이 있는 구체적인 조항 내용 또는 요약" },
                  explanation: { type: Type.STRING, description: "해당 조항이 위험한 이유" },
                  severity: { type: Type.STRING, description: "위험도: High, Medium, 또는 Low" },
                  suggestion: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "사용자가 취해야 할 구체적이고 단계적인 대응 방안 (최소 2-3단계)" 
                  }
                }
              }
            }
          }
        }
      }
    });
    return response.text || "{}";
  } catch (error) {
    console.error("AI Analysis failed", error);
    return JSON.stringify({
      summary: "현재 분석 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.",
      risks: []
    });
  }
};

export const getFinancialAdvice = async (income: number, cash: number, price: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `다음은 한국 주택 구매를 위한 재정 데이터입니다:
      - 연 소득: ${income}백만 원
      - 보유 현금: ${cash}백만 원
      - 목표 매물 가격: ${price}백만 원
      
      이 조건의 현실적인 가능성에 대해 3문장으로 요약해주세요. LTV/DSR 규제 위험을 일반적인 관점에서 언급하세요.
      어조: 전문적이고, 신중하며, 격려하는 태도. 한국어로 작성하세요.`,
    });
    return response.text || "조언을 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI Advice failed", error);
    return "조언 서비스를 이용할 수 없습니다.";
  }
};