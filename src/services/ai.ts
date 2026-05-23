import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateImageFromPrompt(prompt: string) {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
            outputMimeType: 'image/jpeg',
        }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64Image = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64Image}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function generateVideoPlanFromIdea(idea: string, genre: string = '', style: string = '', audience: string = '') {
  const metadata = [
    genre ? `Жанр: ${genre}` : '',
    style ? `Стиль: ${style}` : '',
    audience ? `Целевая аудитория: ${audience}` : ''
  ].filter(Boolean).join('\n');

  const prompt = `Ты — Креативный Продюсер для POLITIC DASHBOARD (AI PRODUCTION SYSTEM).
Твоя задача — составить подробный контент-план (структуру) для будущего видео на основе идеи, по best practices кино и видеопроизводства.

Сырая идея:
"${idea}"

${metadata ? `Метаданные проекта:\n${metadata}\n` : ''}

Твой план ОБЯЗАТЕЛЬНО должен включать следующие секции (разметь их заголовками):
- Краткое описание идеи
- Жанр
- Формат видео (фильм / клип / shorts / длинное видео / трейлер / документальное видео)
- Целевая аудитория
- Стиль
- Референсы по типу (Hollywood / Netflix / YouTube / TikTok / political video / documentary / music video)
- Структура истории
- Ключевые персонажи
- Примерная длительность
- Главы (Chapters)
- Визуальный стиль
- Стиль монтажа
- Стиль озвучки
- Музыка и атмосфера
- Список следующих шагов производства

Опиши концепцию подробно и профессионально. Формат ответа — структурированный Markdown текст.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating video plan:", error);
    throw error;
  }
}

export async function improveScriptWithAI(currentText: string, improveType: string, style: string, extraContext: string = '') {
  const prompt = `Ты — Голливудский Скрипт-Доктор и Креативный Директор для POLITIC DASHBOARD.
Твоя задача — проанализировать и улучшить следующий сценарий (или его часть).

Цель улучшения (что переписываем): ${improveType}
Желаемый стиль / формат: ${style}
${extraContext ? `Дополнительный контекст:\n${extraContext}\n` : ''}

Текущий текст:
"""
${currentText}
"""

Сначала выведи секцию с рекомендациями (разбери: структура, драматургия, темп, конфликт, персонажи, диалоги, удержание внимания, визуал, финал, эмоциональная дуга).
Затем ОБЯЗАТЕЛЬНО добавь разделитель:
--- ИСПРАВЛЕННЫЙ ТЕКСТ ---
После него напиши финальную, улучшенную версию без дополнительных комментариев. Ответ должен строго содержать один этот разделитель.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error improving script:", error);
    throw error;
  }
}

export async function generateFullScriptFromPlan(plan: string, characters: any[] = [], genre: string = '', style: string = '', audience: string = '') {

  const metadata = [
    genre ? `Жанр: ${genre}` : '',
    style ? `Стиль: ${style}` : '',
    audience ? `Целевая аудитория: ${audience}` : ''
  ].filter(Boolean).join('\n');

  const charContext = characters.length > 0 
    ? `Доступные персонажи:\n${characters.map(c => `- ${c.name}: ${c.physicalDescription}, одет в: ${c.clothing}. Особенности: ${c.distinctiveFeatures}`).join('\n')}\nМатериал должен учитывать их участие.`
    : '';

  const prompt = `Ты — Главный Сценарист для POLITIC DASHBOARD.
Напиши полный литературный (или режиссерский) сценарий/narration text от начала и до конца на основе предложенного плана. Пиши подробно, включая диалоги (если есть) или дикторский текст.

${metadata ? `Метаданные проекта:\n${metadata}\n` : ''}
${charContext}

План видео:
"${plan}"

Формат ответа: текст подробного сценария.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating full script:", error);
    throw error;
  }
}

export async function generateChaptersFromLongVideoIdea(fullScript: string, characters: any[] = [], genre: string = '', style: string = '', audience: string = '') {
  const metadata = [
    genre ? `Жанр: ${genre}` : '',
    style ? `Стиль: ${style}` : '',
    audience ? `Целевая аудитория: ${audience}` : ''
  ].filter(Boolean).join('\n');

  const charContext = characters.length > 0 
    ? `Доступные персонажи:\n${characters.map(c => `- ${c.name}: ${c.physicalDescription}, одет в: ${c.clothing}. Особенности: ${c.distinctiveFeatures}`).join('\n')}\nМатериал должен учитывать их участие.`
    : '';

  const prompt = `Ты — Режиссер-документалист/Монтажер для POLITIC DASHBOARD (AI PRODUCTION SYSTEM).
Твоя задача — проанализировать ПОЛНЫЙ СЦЕНАРИЙ и разбить его на детальные монтажные главы (chapters) по best practices видеопроизводства.

${metadata ? `Метаданные проекта:\n${metadata}\n` : ''}
${charContext}

Полный сценарий:
"${fullScript}"

Ответь строго в формате JSON, используя структуру плоского массива глав (каждая глава - это объект, представляющий сцену).
Каждая глава должна содержать:
- chapterNumber: номер главы (число)
- title: название главы
- meaning: краткое описание того, о чем глава
- shortDescription: краткое описание
- dramaticFunction: драматическая функция главы (завязка, конфликт, раскрытие и т.д.)
- scenesList: список ключевых сцен внутри главы (массив строк)
- charactersInvolved: кто из персонажей участвует (массив строк)
- locations: локации (массив строк)
- keyEvents: ключевые события
- visualStyle: визуальный стиль главы
- mood: настроение
- duration: примерная длительность в секундах (число)
- voiceover: диалоги или voice-over текст для главы
- visualAction: что происходит в кадре в целом на протяжении главы
- firstFrameIdea: промт для генерации первой картинки (First frame prompt) на английском!
- lastFrameIdea: промт для генерации последней картинки (Last frame prompt) на английском!
- veoPrompt: промт для генерации видео на английском!
- musicAndSoundCues: подсказки для музыки и звуковых эффектов
- emotion: преобладающая эмоция
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              meaning: { type: Type.STRING },
              voiceover: { type: Type.STRING },
              visualAction: { type: Type.STRING },
              emotion: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              firstFrameIdea: { type: Type.STRING },
              lastFrameIdea: { type: Type.STRING },
              veoPrompt: { type: Type.STRING },
            },
            required: ["meaning", "voiceover", "visualAction", "emotion", "duration", "firstFrameIdea", "lastFrameIdea", "veoPrompt"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating chapters:", error);
    throw error;
  }
}

export async function generateScriptFromIdea(idea: string, characters: any[] = [], genre: string = '', style: string = '', audience: string = '') {
  const metadata = [
    genre ? `Жанр: ${genre}` : '',
    style ? `Стиль: ${style}` : '',
    audience ? `Целевая аудитория: ${audience}` : ''
  ].filter(Boolean).join('\n');

  const charContext = characters.length > 0 
    ? `Available Cast/Characters:\n${characters.map(c => `- ${c.name}: ${c.physicalDescription}, wearing ${c.clothing}. ${c.distinctiveFeatures}`).join('\n')}\n\nPlease assign relevant character IDs to scenes if they appear.`
    : '';

  const prompt = `Ты — Режиссер-сценарист для POLITIC DASHBOARD (AI PRODUCTION SYSTEM).
Твоя задача — проанализировать сырой текст идеи, смягчить trigger words, адаптировать под кинематографичный формат и разбить на сцены.

${metadata ? `Метаданные проекта:\n${metadata}\n` : ''}
${charContext}

Сырая идея:
"${idea}"

Ответь строго в формате JSON, используя эту структуру массива сцен.
Каждая сцена должна содержать:
- meaning: смысл сцены
- voiceover: дикторский текст
- visualAction: что происходит в кадре
- emotion: настроение
- duration: длительность в секундах (число)
- firstFrameIdea: идея для первого кадра
- lastFrameIdea: идея для последнего кадра
- veoPrompt: готовый кинематографичный промпт на английском (ультрареализм, без текста)
- characterIds: array of strings containing the IDs of characters present in this scene (if any)
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              meaning: { type: Type.STRING },
              voiceover: { type: Type.STRING },
              visualAction: { type: Type.STRING },
              emotion: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              firstFrameIdea: { type: Type.STRING },
              lastFrameIdea: { type: Type.STRING },
              veoPrompt: { type: Type.STRING },
              characterIds: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
            },
            required: ["meaning", "voiceover", "visualAction", "emotion", "duration", "firstFrameIdea", "lastFrameIdea", "veoPrompt"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
}
