/**
 * Robustly parse JSON from LLM responses
 * Handles common issues like markdown code blocks, trailing commas, etc.
 */
export function parseJsonSafe<T = any>(text: string): { success: true; data: T } | { success: false; error: string } {
  if (!text || typeof text !== "string") {
    return { success: false, error: "Empty or invalid input" };
  }

  let cleanedText = text.trim();

  // Remove markdown code blocks
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // Try to find JSON object or array bounds
  const jsonStart = cleanedText.search(/[\[{]/);
  const jsonEndBracket = cleanedText.lastIndexOf("]");
  const jsonEndBrace = cleanedText.lastIndexOf("}");
  const jsonEnd = Math.max(jsonEndBracket, jsonEndBrace);

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
  }

  // Remove trailing commas before } or ]
  cleanedText = cleanedText.replace(/,\s*([\]}])/g, "\$1");

  // Try parsing
  try {
    const parsed = JSON.parse(cleanedText);
    return { success: true, data: parsed as T };
  } catch (firstError) {
    // Try fixing common issues - newlines in strings
    try {
      const fixedText = cleanedText
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      
      const parsed = JSON.parse(fixedText);
      return { success: true, data: parsed as T };
    } catch (secondError) {
      const errMsg = firstError instanceof Error ? firstError.message : String(firstError);
      return { 
        success: false, 
        error: "JSON parse failed: " + errMsg
      };
    }
  }
}
