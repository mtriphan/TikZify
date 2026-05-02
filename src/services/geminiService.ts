import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const generateTikZFromImage = async (base64Image: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            text: `You are an expert LaTeX and TikZ developer. Your task is to analyze the provided image and generate the exact LaTeX TikZ code that reproduces the drawing as accurately as possible.

Guidelines:
1. Wrap your code within \\begin{tikzpicture} and \\end{tikzpicture}.
2. Use relative coordinates or a consistent coordinate system.
3. IMPORTANT: Use VIETNAMESE for all labels, annotations, and comments within the code if they are present in the image or provide useful context.
4. If it's a diagram, use nodes and branches. 
5. If it's a math expression or geometric shape, use appropriate TikZ libraries (e.g., shapes, arrows, positioning).
6. Specify any necessary TikZ libraries in a comment at the top using Vietnamese like so: % Thư viện: shapes, arrows
7. Focus on being precise with proportions and labels.
8. Output ONLY the TikZ code block. No explanation needed.`,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating TikZ:", error);
    throw error;
  }
};
