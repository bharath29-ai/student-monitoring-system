import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Firebase Cloud Function to analyze classroom attention using Gemini AI.
 */
export const analyzeClassroom = onRequest({ cors: true, memory: "1GiB" }, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      res.status(400).send({ error: "No image provided" });
      return;
    }

    // You'll need to set this secret in Firebase: firebase functions:secrets:set GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not set.");
      res.status(500).send({ error: "AI Configuration missing" });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    logger.info("Sending image to Gemini for analysis...");

    // Prepare the image data
    const base64Data = imageBase64.split(",")[1] || imageBase64;
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `
      Analyze this classroom image and detect student attention levels.
      Count visible students and classify each as:
      - "attentive": looking at board/teacher, upright posture, engaged
      - "distracted": looking away, using phone, talking to others
      - "sleepy": head down, eyes closed, slouching heavily

      Return a JSON object with these fields:
      {
        "total_students": number,
        "attentive": number,
        "distracted": number,
        "sleepy": number,
        "attention_percentage": number (0-100),
        "observations": "string summary",
        "students": [
          {
            "box_2d": [ymin, xmin, ymax, xmax], // approximate normalized 0-1000
            "label": "attentive" | "distracted" | "sleepy"
          }
        ]
      }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // Extract JSON from response (Gemini sometimes wraps it in markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json(analysis);

  } catch (error: any) {
    logger.error("Analysis failed:", error);
    res.status(500).send({ error: error.message });
  }
});
