import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add your key in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Sample Songs Data (beautiful starting masterpieces for Lyric Studio Pro)
const sampleSongs = [
  {
    id: "sample-1",
    title: "សមុទ្រទឹកភ្នែក (Sea of Tears)",
    artist: "និពន្ធដោយ AI Masterclass",
    genre: "មនោសញ្ចេតនា (Sentimental)",
    tempo: "យឺត (Slow - 72 BPM)",
    mode: "khmer",
    lyrics: `[Verse 1]
យប់ត្រជាក់ ខ្យល់បក់រវិចៗមកប៉ះកាយ
ផ្កាយទាំងឡាយលាក់ខ្លួនក្នុងពពកខ្មៅងងឹត
អង្គុយម្នាក់ឯង នឹកដល់រឿងរ៉ាវក្នុងអតីត
ក្តីស្នេហ៍ពិតប្រែជាផ្សែងហោះហើរទៅឆ្ងាយ។

[Verse 2]
ទឹកភ្នែកហូរស្រក់ចុះដូចទឹកភ្លៀងធ្លាក់
ចិត្តលាក់បាំងភាពឈឺចាប់ស្ទើរទ្រាំមិនបាន
សន្យាពីមុនថានឹងស្រឡាញ់គ្នារហូតកល្យាណ
តែពេលនេះស្ងួនបែរជាដើរចេញមិនលា។

[Chorus]
ឱ! សមុទ្រទឹកភ្នែកអើយ កុំជួយយំជំនួសខ្ញុំអី
បើគេគ្មានចំណងដៃចិត្តស្មោះត្រង់នឹងរូបកាយ
ទោះបីយំដល់ក្ស័យ ក៏មិនអាចហៅស្ងួនវិលវិញក្បែរចិត្តឆ្ងាយ
មានតែបណ្តោយតាមព្រហ្មលិខិតទៅចុះ។

[Bridge]
ភ្លេងពិណពាទ្យ និងទ្រខ្មែរបន្លឺសំនៀងស្រងូតស្រងាត់
បំពេចិត្តដែលកំពុងតែឯកាឥតឧបមា
សង្ឃឹមថាថ្ងៃស្អែកពន្លឺព្រះអាទិត្យនឹងរះចែងចាំងចរិយា
លុបលាងសមុទ្រទឹកភ្នែកឱ្យរលាយបាត់ទៅ។

[Outro]
លាហើយស្រីថ្លៃ... លាហើយសមុទ្រទឹកភ្នែក...
សល់តែអនុស្សាវរីយ៍... ក្នុងបេះដូងកំសត់ម្នាក់នេះ។`,
    producerNotes: "This track blends traditional Khmer instrumentation (such as the Tro Ou and Khloy) with soft R&B elements. Key signature should be A Minor. Keep the kick and snare minimal, letting the sub-bass and the emotional flute guide the rhythm. Add plenty of stereo reverb to the vocals for an atmospheric, spacey finish.",
    visualAiPrompt: "A cinematic, emotional twilight landscape of a stormy Cambodian beach. A single glowing golden lotus floating on the dark waves. Ethereal light beams piercing through moody storm clouds. Neo-traditional Khmer aesthetic, highly detailed, 8k resolution, photorealistic, cinematic lighting.",
    storyboard: "Scene 1: Close-up of a window with rain droplets sliding down, showing a blurry background of Phnom Penh street lights at night.\nScene 2: The singer walks alone along the dark, misty riverfront (Sisorwath Quay), holding a traditional paper lantern that glows dimly.\nScene 3: A dramatic transition showing the traditional Khloy flute being played in the shadows, surrounded by smoke and gentle warm backlight.\nScene 4: The sunrise breaks through the dark clouds, lighting up the Mekong river as the singer lets go of a floating flower into the water.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isFavorite: true
  },
  {
    id: "sample-2",
    title: "Cambodian Dream",
    artist: "AI Lyricist Pro",
    genre: "ញាប់ (Upbeat / Hip-Hop)",
    tempo: "លឿន (Fast - 120 BPM)",
    mode: "km",
    lyrics: `[Verse 1]
From the streets of PP to the temples of Angkor,
We rising up higher, we ready for more.
កូនខ្មែរជំនាន់ថ្មី ដើរឆ្ពោះទៅមុខជានិច្ច
សមត្ថភាពនិងចំណេះដឹង គ្មានថ្ងៃណារលត់លិច។
We build our own future, we shine in the dark,
Every beat, every verse, is leaving a spark!

[Chorus]
This is my Cambodian Dream, we standing as one,
Under the golden sky, chasing the sun!
ស្មារតីសាមគ្គីភាព គ្មានអ្វីអាចបំបែក
យើងរួមគ្នាស្ថាបនា សម្រាប់ថ្ងៃស្អែក!
Yeah, we make it loud, we make it proud,
Rising above the cloud!

[Verse 2]
សម្លេងស្គរដៃបន្លឺ រួមនឹងបាសបុកខ្លាំង
We got the ancient soul in a modern frame.
No matter where you go, never forget your name,
មោទនភាពជាតិយើង ត្រូវតែថែរក្សាក្នុងប្រាណ។
Hip-hop in Khmer, R&B in the air,
We setting the standard everywhere!

[Outro]
Cambodian Dream... we never stop.
ពីដីខ្មែរ ទៅកាន់ពិភពលោក...
Stay strong, stay proud!`,
    producerNotes: "An energetic fusion of Hip-Hop sub-bass with Cambodian traditional Chayam drums (ស្គរឆៃយ៉ាំ). Tempo is locked at 120 BPM. Synthesizers should play upbeat brass stabs combined with a lead pentatonic instrument like the Roneat (xylophone). Make the bass super heavy, and keep the vocal delivery sharp and confident.",
    visualAiPrompt: "A vibrant fusion of ancient Angkor Wat architecture and futuristic cyberpunk neon lights. A group of Cambodian youths looking towards the futuristic horizon. Bright orange, electric blue, and gold color scheme, synthwave aesthetic, futuristic, highly stylized.",
    storyboard: "Scene 1: Fast-paced aerial shots of Phnom Penh skyscrapers at dusk, transitioning into a close-up of dynamic street dancers.\nScene 2: Split screen showing ancient temple stone carvings on the left and a modern music studio setup on the right, vibrating with soundwaves.\nScene 3: The artist performs with a background of traditional Angkor-style motifs glowing in neon red and blue paint.\nScene 4: A massive crowd jumping in slow-motion at a music festival under a starry night, waving neon lights.",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isFavorite: false
  }
];

// 1. Endpoint to retrieve pre-loaded samples
app.get("/api/samples", (req, res) => {
  res.json(sampleSongs);
});

// 2. Endpoint to generate a brand new song project using Gemini
app.post("/api/generate", async (req, res) => {
  const { prompt, genre, tempo, mode, title, artist } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "សូមបញ្ចូលការណែនាំ ឬប្រធានបទបទចម្រៀង (Prompt is required)" });
  }

  try {
    const ai = getGemini();

    const systemInstruction = `
      You are an expert, award-winning Khmer and English music lyricist, songwriter, and executive producer.
      Your job is to generate a fully realized song project based on the user's creative prompt, genre, tempo, and language mode.
      The output must be structured exactly in JSON format containing:
      1. 'title': A creative title for the song (either in Khmer, English, or both, matching the mode).
      2. 'lyrics': Beautiful, high-quality, and deeply emotional lyrics. Organize lyrics with clear labels in brackets like [Verse 1], [Verse 2], [Chorus], [Bridge], [Outro] to make them easily readable.
         - If mode is 'khmer': Generate pure, artistic Khmer lyrics with elegant poetic flow and traditional rhyme structures (ចុងចួន).
         - If mode is 'english': Generate creative, catchy English lyrics.
         - If mode is 'km' (bilingual): Blend Khmer and English creatively in the verses and chorus.
      3. 'producerNotes': Professional music production advice (e.g., recommend appropriate Khmer instruments like Tro, Khloy, or Pin, and state key signatures, chord suggestions, vocal cues, and mixing tips).
      4. 'visualAiPrompt': A descriptive, highly aesthetic English prompt (1-2 sentences) to generate an album cover in an image generator (like Midjourney or Gemini) that matches the mood.
      5. 'storyboard': A beautiful 4-scene description in Khmer/English describing the narrative flow for a stunning music video. Format it with 'Scene 1: ...', 'Scene 2: ...' etc.
    `;

    const userPrompt = `
      Create a unique song based on the following instructions:
      - Prompt/Theme: "${prompt}"
      - Music Genre: "${genre}"
      - Tempo/Speed: "${tempo}"
      - Language/Mode: "${mode}"
      ${title ? `- Desired Title: "${title}"` : ""}
      ${artist ? `- Desired Artist/Style: "${artist}"` : ""}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The creative title of the song.",
            },
            lyrics: {
              type: Type.STRING,
              description: "Full song lyrics divided into sections with bracketed headers like [Verse 1], [Chorus], etc.",
            },
            producerNotes: {
              type: Type.STRING,
              description: "AI producer's creative notes, instruments, chords, and style advice.",
            },
            visualAiPrompt: {
              type: Type.STRING,
              description: "High-quality, descriptive visual AI prompt in English for the album cover.",
            },
            storyboard: {
              type: Type.STRING,
              description: "A 4-scene music video storyboard narration.",
            },
          },
          required: ["title", "lyrics", "producerNotes", "visualAiPrompt", "storyboard"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from the Gemini model.");
    }

    const resultData = JSON.parse(responseText.trim());
    
    // Override title if custom title was specified
    if (title && title.trim()) {
      resultData.title = title.trim();
    }

    res.json(resultData);
  } catch (err: any) {
    console.error("Gemini Generation Error:", err);
    
    // Friendly error messaging
    const message = err.message || "";
    if (message.includes("GEMINI_API_KEY")) {
      res.status(500).json({
        error: "រកមិនឃើញ API KEY។ សូមបើក Settings > Secrets រួចបន្ថែម GEMINI_API_KEY របស់អ្នក។ (GEMINI_API_KEY is missing in Secrets)",
      });
    } else {
      res.status(500).json({
        error: `មានបញ្ហាក្នុងការតាក់តែង៖ ${message || "សូមព្យាយាមម្តងទៀត។"}`,
      });
    }
  }
});

// Setup Vite Dev server or static asset serving for Production
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
    console.log(`Lyric Studio Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
