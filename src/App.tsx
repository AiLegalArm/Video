import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, FileText, Mic, Music, Image as ImageIcon, Video, 
  Clapperboard, Download, Settings, Play, Square, FastForward,
  Plus, Trash2, Library
} from 'lucide-react';
import { PipelineMode, ProjectState, Scene } from './types';
import { generateScriptFromIdea, generateImageFromPrompt, generateVideoPlanFromIdea, generateFullScriptFromPlan, generateChaptersFromLongVideoIdea, improveScriptWithAI } from './services/ai';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { ScrollArea } from './components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Slider } from './components/ui/slider';

export default function App() {
  const [activeMode, setActiveMode] = useState<PipelineMode>(() => {
    return (localStorage.getItem('politic_active_mode') as PipelineMode) || 'IDEA';
  });

  useEffect(() => {
    localStorage.setItem('politic_active_mode', activeMode);
  }, [activeMode]);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptTab, setScriptTab] = useState<'TEXT' | 'SCENES'>('TEXT');
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [improveTargetType, setImproveTargetType] = useState<'FULL' | 'SCENE'>('FULL');
  const [improveSceneId, setImproveSceneId] = useState<string | null>(null);
  const [improveStyle, setImproveStyle] = useState('Hollywood');
  const [improveFeedback, setImproveFeedback] = useState('');
  const [improveNewText, setImproveNewText] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const [isImageLibOpen, setIsImageLibOpen] = useState(false);
  const [isVideoLibOpen, setIsVideoLibOpen] = useState(false);
  const [newImagePromptTitle, setNewImagePromptTitle] = useState('');
  const [newImagePromptText, setNewImagePromptText] = useState('');
  const [newVideoPromptTitle, setNewVideoPromptTitle] = useState('');
  const [newVideoPromptText, setNewVideoPromptText] = useState('');
  const [project, setProject] = useState<ProjectState>(() => {
    try {
      const saved = localStorage.getItem('politic_project_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved project state:', e);
    }
    return {
      idea: '',
      videoPlan: '',
      fullScript: '',
      style: '',
      genre: '',
      targetAudience: '',
      scenes: [],
      globalVoiceConfig: {
        language: 'Русский',
        gender: 'Мужской',
        age: 'Взрослый',
        tone: 'Серьезный',
        speed: 1.0,
        pitch: 0,
        style: 'Нейтральный',
      },
      exportSettings: {
        format: 'MP4 (H.264)',
        resolution: '1080p',
        aspectRatio: '16:9',
        fps: '30',
      },
      videoEditorConfig: {
        logoUrl: null,
        logoPosition: 'top-right',
        logoOpacity: 100,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        audioSyncOffsetMs: 0,
      },
      standaloneImages: [],
      standaloneAudio: [],
      standaloneVideos: [],
      characters: [],
      audioTimelineGenerated: false,
      videoTimelineGenerated: false,
      imagePromptsLibrary: [
        { id: 'img-1', title: "Кинематографичный", prompt: "Cinematic lighting, ultra-detailed, 8k, photorealistic, 35mm lens" },
        { id: 'img-2', title: "Студийный свет", prompt: "Dramatic studio lighting, high contrast, sharp focus, volumetric lighting, 8k" },
        { id: 'img-3', title: "Макро", prompt: "Extreme macro photography, shallow depth of field, incredible texture detail, photorealistic" },
        { id: 'img-4', title: "Киберпанк", prompt: "Neon lighting, cyberpunk aesthetic, dark rainy night, high detail reflections" },
        { id: 'img-5', title: "Аниме", prompt: "Studio Ghibli style, vibrant colors, detailed anime background, magical atmosphere" }
      ],
      videoPromptsLibrary: [
        { id: 'vid-1', title: "Плавный наезд", prompt: "Slow cinematic push-in, smooth camera motion, realistic physics, 4k" },
        { id: 'vid-2', title: "Облет дроном", prompt: "Drone flyover, epic scale, sweeping camera movement, 4k 60fps" },
        { id: 'vid-3', title: "Таймлапс", prompt: "Time-lapse, rapidly moving clouds and shadows, hyper-lapse motion" },
        { id: 'vid-4', title: "Слоу-мо", prompt: "Extreme slow motion, 1000 fps, dramatic fluid dynamics, high detail" },
        { id: 'vid-5', title: "Смена фокуса", prompt: "Rack focus from foreground to background, cinematic depth of field, natural motion" }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('politic_project_data', JSON.stringify(project));
  }, [project]);

  const modes: { id: PipelineMode; label: string; icon: React.ReactNode }[] = [
    { id: 'IDEA', label: 'Идея', icon: <Lightbulb size={18} /> },
    { id: 'VIDEO_PLAN', label: 'План видео', icon: <FileText size={18} /> },
    { id: 'CAST', label: 'Персонажи', icon: <Library size={18} /> },
    { id: 'SCRIPT', label: 'Редактор сценария', icon: <FileText size={18} /> },
    { id: 'CHAPTER_SEGMENTATION', label: 'Сегментация', icon: <Video size={18} /> },
    { id: 'TTS', label: 'Голос', icon: <Mic size={18} /> },
    { id: 'AUDIO_EDIT', label: 'Аудио', icon: <Music size={18} /> },
    { id: 'IMAGE', label: 'Кадры', icon: <ImageIcon size={18} /> },
    { id: 'VIDEO', label: 'Видео', icon: <Video size={18} /> },
    { id: 'VIDEO_EDIT', label: 'Видеоредактор', icon: <Clapperboard size={18} /> },
    { id: 'FINAL_EXPORT', label: 'Финальный экспорт', icon: <Download size={18} /> },
  ];

  const activeCharacters = project.characters.filter(c => c.status === 'selected' || c.status === 'used');

  const handleGenerateScript = async () => {
    if (!project.idea) return;
    setIsLoading(true);
    try {
      const generatedScenes = await generateScriptFromIdea(project.idea, activeCharacters, project.genre, project.style, project.targetAudience);
      const scenesWithIds = generatedScenes.map((s: any, idx: number) => ({
        ...s,
        id: `scene-${idx}-${Date.now()}`
      }));
      setProject(p => ({ ...p, scenes: scenesWithIds }));
      setActiveMode('SCRIPT');
    } catch (e) {
      console.error(e);
      alert("Error generating script");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateChapters = async () => {
    if (!project.fullScript) return;
    setIsLoading(true);
    try {
      const generatedChapters = await generateChaptersFromLongVideoIdea(project.fullScript, activeCharacters, project.genre, project.style, project.targetAudience);
      const scenesWithIds = generatedChapters.map((s: any, idx: number) => ({
        ...s,
        id: `scene-${idx}-${Date.now()}`
      }));
      setProject(p => ({ ...p, scenes: scenesWithIds }));
    } catch (e) {
      console.error(e);
      alert("Error generating chapters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideoPlan = async () => {
    if (!project.idea) return;
    setIsLoading(true);
    try {
      const generatedPlan = await generateVideoPlanFromIdea(project.idea, project.genre, project.style, project.targetAudience);
      setProject(p => ({ ...p, videoPlan: generatedPlan }));
    } catch (e) {
      console.error(e);
      alert("Error generating video plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFullScript = async () => {
    if (!project.videoPlan) return;
    setIsLoading(true);
    try {
      const generatedScript = await generateFullScriptFromPlan(project.videoPlan, activeCharacters, project.genre, project.style, project.targetAudience);
      setProject(p => ({ ...p, fullScript: generatedScript }));
    } catch (e) {
      console.error(e);
      alert("Error generating full script");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenImproveModal = (type: 'FULL' | 'SCENE', sceneId?: string) => {
    setImproveTargetType(type);
    setImproveSceneId(sceneId || null);
    setImproveFeedback('');
    setImproveNewText('');
    setIsImproveModalOpen(true);
  };

  const handleRunImprovement = async () => {
    setIsImproving(true);
    setImproveFeedback('');
    setImproveNewText('');
    try {
      let currentText = '';
      if (improveTargetType === 'FULL') {
        currentText = project.fullScript;
      } else {
        const scene = project.scenes.find(s => s.id === improveSceneId);
        if (scene) {
          currentText = `Глава/Сцена: ${scene.title || scene.meaning}\nVoiceover / Диалоги: ${scene.voiceover}\nВизуальное действие: ${scene.visualAction}`;
        }
      }

      const result = await improveScriptWithAI(
        currentText, 
        improveTargetType === 'FULL' ? 'Полный сценарий' : 'Отдельная сцена/глава', 
        improveStyle,
        `Жанр проекта: ${project.genre}\nСтиль проекта: ${project.style}\n`
      );

      const parts = result.split('--- ИСПРАВЛЕННЫЙ ТЕКСТ ---');
      if (parts.length > 1) {
        setImproveFeedback(parts[0].trim());
        setImproveNewText(parts[1].trim());
      } else {
        setImproveNewText(result.trim());
      }
    } catch (e) {
      console.error(e);
      setImproveFeedback("Ошибка генерации. Попробуйте еще раз.");
    } finally {
      setIsImproving(false);
    }
  };

  const handleApplyImprovement = (action: 'REPLACE' | 'NEW_VERSION') => {
    if (!improveNewText) return;

    if (action === 'NEW_VERSION') {
      if (improveTargetType === 'FULL') {
         setProject(p => ({ ...p, fullScript: `${p.fullScript}\n\n--- АЛЬТЕРНАТИВНАЯ ВЕРСИЯ (${improveStyle}) ---\n\n${improveNewText}` }));
      } else {
         const oldSceneIndex = project.scenes.findIndex(s => s.id === improveSceneId);
         if (oldSceneIndex !== -1) {
           const newScene = { ...project.scenes[oldSceneIndex], id: `scene-${Date.now()}`, meaning: `[${improveStyle} ver] ` + (project.scenes[oldSceneIndex].title || project.scenes[oldSceneIndex].meaning), voiceover: improveNewText };
           setProject(p => {
             const newScenes = [...p.scenes];
             newScenes.splice(oldSceneIndex + 1, 0, newScene);
             return { ...p, scenes: newScenes };
           });
         }
      }
    } else {
      if (improveTargetType === 'FULL') {
        setProject(p => ({ ...p, fullScript: improveNewText }));
      } else {
        setProject(p => ({
          ...p,
          scenes: p.scenes.map(s => s.id === improveSceneId ? { ...s, voiceover: improveNewText } : s)
        }));
      }
    }
    setIsImproveModalOpen(false);
  };


  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene-manual-${Date.now()}`,
      meaning: 'Новая сцена',
      voiceover: '',
      visualAction: '',
      emotion: 'Нейтрально',
      duration: 10,
      firstFrameIdea: '',
      lastFrameIdea: '',
      veoPrompt: ''
    };
    setProject(p => ({ ...p, scenes: [...p.scenes, newScene] }));
  };

  const handleAddStandaloneAudio = () => {
    setProject(p => ({
      ...p,
      standaloneAudio: [...p.standaloneAudio, { id: `audio-${Date.now()}`, text: '', isGenerating: false }]
    }));
  };

  const handleAddStandaloneImage = () => {
    setProject(p => ({
      ...p,
      standaloneImages: [...p.standaloneImages, { id: `img-${Date.now()}`, prompt: '', isGenerating: false }]
    }));
  };

  const handleAddStandaloneVideo = () => {
    setProject(p => ({
      ...p,
      standaloneVideos: [...p.standaloneVideos, { id: `vid-${Date.now()}`, prompt: '', isGenerating: false }]
    }));
  };

  const enrichPromptWithCharacters = (prompt: string, characterIds: string[] = []) => {
    if (!characterIds.length || !project.characters.length) return prompt;
    
    let characterContext = "";
    characterIds.forEach(id => {
      const char = project.characters.find(c => c.id === id);
      if (char) {
        characterContext += `Character "${char.name}": ${char.physicalDescription}. Wearing: ${char.clothing}. Features: ${char.distinctiveFeatures}. `;
      }
    });

    return `Maintaining character consistency: ${characterContext} Scene Description: ${prompt}`;
  };

  const handleGenerateCharacterImage = async (charId: string) => {
    const char = project.characters.find(c => c.id === charId);
    if (!char) return;

    setProject(p => ({
      ...p,
      characters: p.characters.map(c => c.id === charId ? { ...c, isGeneratingImage: true } : c)
    }));

    try {
      const refText = char.referenceImageUrl ? ' [BASED ON PROVIDED REFERENCE PHOTO]' : '';
      const prompt = `Character portrait, headshot: ${char.physicalDescription}. Wearing: ${char.clothing}. Features: ${char.distinctiveFeatures}.${refText} Cinematic lighting, ultra-detailed, photorealistic`;
      const imageUrl = await generateImageFromPrompt(prompt);
      
      if (imageUrl) {
        setProject(p => ({
          ...p,
          characters: p.characters.map(c => c.id === charId ? { ...c, imageUrl, isGeneratingImage: false } : c)
        }));
      } else {
        setProject(p => ({
          ...p,
          characters: p.characters.map(c => c.id === charId ? { ...c, isGeneratingImage: false } : c)
        }));
      }
    } catch (e) {
      console.error(e);
      setProject(p => ({
        ...p,
        characters: p.characters.map(c => c.id === charId ? { ...c, isGeneratingImage: false } : c)
      }));
      alert("Error generating character image");
    }
  };

  const handleGenerateStandaloneImage = async (id: string, prompt: string) => {
    if (!prompt) return;
    setProject(p => ({
      ...p,
      standaloneImages: p.standaloneImages.map(img => img.id === id ? { ...img, isGenerating: true } : img)
    }));
    try {
      const imageUrl = await generateImageFromPrompt(prompt);
      if (imageUrl) {
        setProject(p => ({
          ...p,
          standaloneImages: p.standaloneImages.map(img => img.id === id ? { ...img, imageUrl, isGenerating: false } : img)
        }));
      }
    } catch (e) {
      console.error(e);
      setProject(p => ({
        ...p,
        standaloneImages: p.standaloneImages.map(img => img.id === id ? { ...img, isGenerating: false } : img)
      }));
    }
  };

  const handleGenerateImage = async (sceneId: string, type: 'first' | 'last', prompt: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    const enrichedPrompt = enrichPromptWithCharacters(prompt, scene?.characterIds || []);

    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => s.id === sceneId ? { ...s, [type === 'first' ? 'isGeneratingFirstFrame' : 'isGeneratingLastFrame']: true } : s)
    }));

    try {
      const imageUrl = await generateImageFromPrompt(enrichedPrompt);
      if (imageUrl) {
        setProject(p => ({
          ...p,
          scenes: p.scenes.map(s => s.id === sceneId ? { 
            ...s, 
            [type === 'first' ? 'firstFrameImage' : 'lastFrameImage']: imageUrl,
            [type === 'first' ? 'isGeneratingFirstFrame' : 'isGeneratingLastFrame']: false 
          } : s)
        }));
      }
    } catch (e) {
      console.error(e);
      setProject(p => ({
        ...p,
        scenes: p.scenes.map(s => s.id === sceneId ? { ...s, [type === 'first' ? 'isGeneratingFirstFrame' : 'isGeneratingLastFrame']: false } : s)
      }));
    }
  };

  const [progress, setProgress] = useState<Record<string, number>>({});

  const downloadFile = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMedia = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const simulateProgress = (id: string, duration: number = 2000) => {
    setProgress(p => ({ ...p, [id]: 0 }));
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(prev => ({ ...prev, [id]: p }));
      if (p >= 100) clearInterval(interval);
    }, 50);
  };

  const renderIdeaMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 01</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Ввод идеи</h3>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Жанр</label>
            <Input 
               placeholder="Например: Документальный, Киберпанк..." 
               className="bg-white/50 border-[#1A1A1A]/10 rounded-none text-sm"
               value={project.genre}
               onChange={(e) => setProject(p => ({ ...p, genre: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Стиль</label>
            <Input 
               placeholder="Например: Нуар, Минимализм, 3D анимация..." 
               className="bg-white/50 border-[#1A1A1A]/10 rounded-none text-sm"
               value={project.style}
               onChange={(e) => setProject(p => ({ ...p, style: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Целевая аудитория</label>
            <Input 
               placeholder="Например: Подростки, Бизнесмены..." 
               className="bg-white/50 border-[#1A1A1A]/10 rounded-none text-sm"
               value={project.targetAudience}
               onChange={(e) => setProject(p => ({ ...p, targetAudience: e.target.value }))}
            />
          </div>
        </div>
        <Textarea 
          placeholder="Введите сырую идею здесь... (например, репортаж о новом технопарке...)" 
          className="flex-1 min-h-[300px] text-lg p-6 bg-white/50 border border-[#1A1A1A]/10 font-serif leading-relaxed rounded-none"
          value={project.idea}
          onChange={(e) => setProject(p => ({ ...p, idea: e.target.value }))}
        />
      </div>
      <div className="flex justify-between pt-4 gap-4">
        <Button variant="outline" onClick={async () => {
          setActiveMode('VIDEO_PLAN');
          await handleGenerateVideoPlan();
        }} disabled={isLoading || !project.idea} className="border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A] hover:text-[#F5F2ED]">
          Сгенерировать план по best practices
        </Button>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => downloadFile(project.idea, 'idea.txt')} disabled={!project.idea} className="border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold">
            Экспорт идеи
          </Button>
          <Button size="lg" onClick={() => setActiveMode('VIDEO_PLAN')} disabled={!project.idea} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>
    </div>
  );

  const renderVideoPlanMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 02</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">План видео</h3>
        </div>
      </div>
      <div className="flex-1">
        <Textarea 
          placeholder="План видео появится здесь..." 
          className="h-full min-h-[300px] text-lg p-6 bg-white/50 border border-[#1A1A1A]/10 font-serif leading-relaxed rounded-none"
          value={project.videoPlan}
          onChange={(e) => setProject(p => ({ ...p, videoPlan: e.target.value }))}
        />
      </div>
      <div className="flex justify-between pt-4 gap-4">
        <Button variant="outline" onClick={handleGenerateVideoPlan} disabled={isLoading || !project.idea} className="border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A] hover:text-[#F5F2ED]">
          {isLoading ? 'Генерация...' : 'Сгенерировать план по best practices'}
        </Button>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => downloadFile(project.videoPlan, 'video_plan.txt')} disabled={!project.videoPlan} className="border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold">
            Экспорт плана
          </Button>
          <Button size="lg" onClick={() => setActiveMode('CAST')} disabled={!project.videoPlan} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>
    </div>
  );

  const renderChapterSegmentationMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 05</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Сегментация на главы</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={async () => {
            await handleGenerateChapters();
          }} disabled={isLoading || !project.fullScript} className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A] hover:text-[#F5F2ED]">
            {isLoading ? 'Разбивка на главы...' : 'Автоматическая сегментация на главы'}
          </Button>
          <Button size="lg" onClick={() => {
            setProject(p => ({ ...p, scenes: p.scenes.map(s => ({...s, status: 'selected'})) }));
            setActiveMode('SCRIPT');
            setScriptTab('SCENES');
          }} disabled={project.scenes.length === 0} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать все главы в проекте
          </Button>
        </div>
      </div>

      {project.scenes.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center p-12 text-center border border-[#1A1A1A]/10 bg-white/50">
            <Video className="w-16 h-16 opacity-20 mb-6" />
            <h4 className="text-2xl font-serif italic mb-4">Детализация сценария</h4>
            <p className="text-[#1A1A1A]/60 max-w-md mx-auto mb-8 font-sans">
                На этом этапе ИИ анализирует полный текст сценария и автоматически делит его на главы, генерируя промты первого и финального кадров, визуальный стиль и драматические функции.
            </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 pb-12">
          <div className="space-y-8">
            {project.scenes.map((chapter, idx) => (
              <Card key={chapter.id} className={`border ${chapter.status === 'selected' ? 'border-emerald-600' : 'border-[#1A1A1A]/10'} rounded-none shadow-none bg-white/50 relative overflow-hidden`}>
                {chapter.status === 'selected' && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] uppercase font-bold tracking-widest px-2 py-1 z-10">
                    Используется
                  </div>
                )}
                <CardHeader className="pb-3 border-b border-[#1A1A1A]/10 bg-black/5 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Глава {chapter.chapterNumber || (idx + 1)}</span>
                    <CardTitle className="text-2xl font-serif italic pr-12">{chapter.title || chapter.meaning}</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOpenImproveModal('SCENE', chapter.id)} className="h-6 text-[9px] uppercase tracking-widest font-bold border-purple-600/30 text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-none">
                    AI-совет / Улучшить
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Краткое описание</label>
                        <p className="text-sm font-serif leading-relaxed text-[#1A1A1A]/80">{chapter.shortDescription || chapter.meaning}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Драматическая функция</label>
                        <p className="text-xs font-sans text-[#1A1A1A]/70">{chapter.dramaticFunction || 'Раскрытие сюжета'}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Ключевые события / Сцены</label>
                        <p className="text-xs font-sans text-[#1A1A1A]/70">{chapter.keyEvents}</p>
                        {chapter.scenesList && chapter.scenesList.length > 0 && (
                          <ul className="list-disc list-inside text-xs font-sans text-[#1A1A1A]/70 mt-1">
                            {chapter.scenesList.map((sl, i) => <li key={i}>{sl}</li>)}
                          </ul>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Диалоги / Voice-over</label>
                        <Textarea 
                          value={chapter.voiceover}
                          onChange={(e) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === chapter.id ? { ...s, voiceover: e.target.value } : s) }))}
                          className="min-h-[100px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs font-serif italic"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Персонажи</label>
                          <p className="text-xs font-sans text-[#1A1A1A]/70">{(chapter.charactersInvolved || []).join(', ') || 'Нет выделенных персонажей'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Локации</label>
                          <p className="text-xs font-sans text-[#1A1A1A]/70">{(chapter.locations || []).join(', ') || 'Не определено'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Визуальный стиль & Настроение</label>
                          <p className="text-xs font-sans text-[#1A1A1A]/70">{chapter.visualStyle} — {chapter.mood}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Музыка и Звуки</label>
                          <p className="text-xs font-sans text-[#1A1A1A]/70">{chapter.musicAndSoundCues}</p>
                        </div>
                      </div>

                      <div className="border-t border-[#1A1A1A]/10 pt-4 mt-2 mb-2"></div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 italic">★ First Frame Prompt (EN)</label>
                        <Textarea 
                          value={chapter.firstFrameIdea}
                          onChange={(e) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === chapter.id ? { ...s, firstFrameIdea: e.target.value } : s) }))}
                          className="min-h-[60px] bg-transparent border-[#1A1A1A]/20 rounded-none text-[10px] font-mono leading-relaxed focus-visible:ring-emerald-600/50"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 italic">★ Last Frame Prompt (EN)</label>
                        <Textarea 
                          value={chapter.lastFrameIdea}
                          onChange={(e) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === chapter.id ? { ...s, lastFrameIdea: e.target.value } : s) }))}
                          className="min-h-[60px] bg-transparent border-[#1A1A1A]/20 rounded-none text-[10px] font-mono leading-relaxed focus-visible:ring-emerald-600/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-purple-600 italic">▶ Video Generation Prompt (EN)</label>
                        <Textarea 
                          value={chapter.veoPrompt}
                          onChange={(e) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === chapter.id ? { ...s, veoPrompt: e.target.value } : s) }))}
                          className="min-h-[60px] bg-transparent border-[#1A1A1A]/20 rounded-none text-[10px] font-mono leading-relaxed focus-visible:ring-purple-600/50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#1A1A1A]/10 pt-4 flex justify-between items-center">
                     <span className="text-[10px] uppercase font-bold opacity-40">~ {chapter.duration || 10} сек</span>
                     <Button 
                       onClick={() => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === chapter.id ? { ...s, status: 'selected' } : s) }))} 
                       size="sm" 
                       variant="outline" 
                       className={`px-8 rounded-none text-[10px] uppercase font-bold tracking-widest ${chapter.status === 'selected' ? 'border-emerald-600 text-emerald-600 bg-emerald-600/5' : 'border-[#1A1A1A]/20 text-[#1A1A1A]'}`}>
                        Использовать в проекте
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderScriptMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 04</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Сценарий</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#1A1A1A]/5 p-1 rounded-none">
            <button 
              onClick={() => setScriptTab('TEXT')}
              className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${scriptTab === 'TEXT' ? 'bg-[#1A1A1A] text-[#F5F2ED]' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'}`}
            >
              Полный текст
            </button>
            <button 
              onClick={() => setScriptTab('SCENES')}
              className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${scriptTab === 'SCENES' ? 'bg-[#1A1A1A] text-[#F5F2ED]' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'}`}
            >
              Раскадровка сцен
            </button>
          </div>
        </div>
      </div>
      
      {scriptTab === 'TEXT' ? (
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1">
            <Textarea 
              placeholder="Полный текст сценария появится здесь..." 
              className="h-full min-h-[300px] text-lg p-6 bg-white/50 border border-[#1A1A1A]/10 font-serif leading-relaxed rounded-none"
              value={project.fullScript}
              onChange={(e) => setProject(p => ({ ...p, fullScript: e.target.value }))}
            />
          </div>
          <div className="flex justify-between pt-4 gap-4">
            <Button variant="outline" onClick={handleGenerateFullScript} disabled={isLoading || !project.videoPlan} className="border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A] hover:text-[#F5F2ED]">
              {isLoading ? 'Генерация...' : 'Сгенерировать сценарий (ИИ)'}
            </Button>
            <Button variant="outline" onClick={() => handleOpenImproveModal('FULL')} disabled={!project.fullScript} className="border-purple-600/30 text-purple-700 bg-purple-50 px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-purple-600 hover:text-white transition-colors">
              AI-совет / Улучшить сценарий
            </Button>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => downloadFile(project.fullScript, 'full_script.txt')} disabled={!project.fullScript} className="border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold">
                Экспорт сценария
              </Button>
              <Button size="lg" onClick={() => setActiveMode('CHAPTER_SEGMENTATION')} disabled={!project.fullScript} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
                Перейти к сегментации
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-end gap-4">
            <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => downloadFile(JSON.stringify(project.scenes, null, 2), 'script.json', 'application/json')}>Экспорт раскадровки</Button>
            <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={handleAddScene}>Добавить сцену вручную</Button>
            <Button size="lg" onClick={() => setActiveMode('TTS')} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
              Использовать в проекте
            </Button>
          </div>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-8 pb-12">
              {project.scenes.map((scene, index) => (
            <Card key={scene.id} className="border border-[#1A1A1A]/10 rounded-none shadow-none bg-white/50">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10 bg-black/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-serif italic">Сцена {String(index + 1).padStart(2, '0')}</CardTitle>
                    <CardDescription className="text-[#1A1A1A]/60 font-medium text-xs mt-1">{scene.meaning} ({scene.emotion})</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] uppercase font-bold opacity-40">{scene.duration} СЕК</span>
                    <Button variant="outline" size="sm" onClick={() => handleOpenImproveModal('SCENE', scene.id)} className="h-6 text-[9px] uppercase tracking-widest font-bold border-purple-600/30 text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-none">
                      AI-совет / Улучшить
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Дикторский текст</label>
                    <Textarea 
                      value={scene.voiceover}
                      onChange={(e) => {
                        const newScenes = [...project.scenes];
                        newScenes[index].voiceover = e.target.value;
                        setProject(p => ({ ...p, scenes: newScenes }));
                      }}
                      className="min-h-[100px] bg-transparent border-[#1A1A1A]/10 rounded-none font-serif text-lg leading-relaxed focus-visible:ring-[#1A1A1A]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Персонажи в сцене</label>
                    <div className="flex flex-wrap gap-2">
                      {project.characters.map(char => (
                        <Badge 
                          key={char.id}
                          variant={scene.characterIds?.includes(char.id) ? 'default' : 'outline'}
                          className={`rounded-none cursor-pointer text-[10px] uppercase font-bold tracking-widest ${scene.characterIds?.includes(char.id) ? 'bg-[#1A1A1A] text-[#F5F2ED]' : 'border-[#1A1A1A]/20 text-[#1A1A1A]/60'}`}
                          onClick={() => {
                            const currentIds = scene.characterIds || [];
                            const newIds = currentIds.includes(char.id) 
                              ? currentIds.filter(id => id !== char.id)
                              : [...currentIds, char.id];
                            const newScenes = [...project.scenes];
                            newScenes[index].characterIds = newIds;
                            setProject(p => ({ ...p, scenes: newScenes }));
                          }}
                        >
                          {char.name}
                        </Badge>
                      ))}
                      {project.characters.length === 0 && (
                        <span className="text-[9px] opacity-40 uppercase font-bold italic">Добавьте персонажей в разделе "CAST"</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Визуальное действие</label>
                    <Textarea 
                      value={scene.visualAction}
                      onChange={(e) => {
                        const newScenes = [...project.scenes];
                        newScenes[index].visualAction = e.target.value;
                        setProject(p => ({ ...p, scenes: newScenes }));
                      }}
                      className="min-h-[80px] bg-transparent border-[#1A1A1A]/10 rounded-none font-sans text-sm focus-visible:ring-[#1A1A1A]/30"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Промпты Nano Banana</label>
                    <div className="space-y-2">
                       <div className="p-3 bg-[#1A1A1A] text-[#F5F2ED] rounded-sm relative">
                         <span className="absolute -top-1.5 left-2 bg-[#F5F2ED] text-[#1A1A1A] text-[8px] font-bold px-1 uppercase border border-[#1A1A1A]">Первый кадр</span>
                         <p className="text-xs font-serif italic mt-1">{scene.firstFrameIdea}</p>
                       </div>
                       <div className="p-3 bg-[#1A1A1A] text-[#F5F2ED] rounded-sm relative">
                         <span className="absolute -top-1.5 left-2 bg-[#F5F2ED] text-[#1A1A1A] text-[8px] font-bold px-1 uppercase border border-[#1A1A1A]">Последний кадр</span>
                         <p className="text-xs font-serif italic mt-1">{scene.lastFrameIdea}</p>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Промпт Veo 3.1</label>
                    <Textarea 
                      value={scene.veoPrompt}
                      onChange={(e) => {
                        const newScenes = [...project.scenes];
                        newScenes[index].veoPrompt = e.target.value;
                        setProject(p => ({ ...p, scenes: newScenes }));
                      }}
                      className="min-h-[100px] bg-transparent border border-[#1A1A1A]/10 rounded-none text-xs font-mono focus-visible:ring-[#1A1A1A]/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {project.scenes.length === 0 && (
             <div className="text-center p-12 text-[#1A1A1A]/60 font-serif italic text-lg border border-[#1A1A1A]/10 bg-white/30">Сценарий еще не сгенерирован. Вы можете добавить сцену вручную.</div>
          )}
        </div>
      </ScrollArea>
      </>
      )}
    </div>
  );

  const renderTTSMode = () => (
    <div className="flex flex-col space-y-6 pb-20">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 03</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Генератор голоса</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => downloadFile(JSON.stringify({ globalVoiceConfig: project.globalVoiceConfig, standaloneAudio: project.standaloneAudio, scenes: project.scenes.map(s => ({ id: s.id, voiceover: s.voiceover })) }, null, 2), 'tts_data.json', 'application/json')}>Экспорт TTS данных</Button>
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={handleAddStandaloneAudio}>Свободная генерация</Button>
          <Button size="lg" onClick={() => setActiveMode('AUDIO_EDIT')} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6 bg-white/50 border border-[#1A1A1A]/10 rounded-none shadow-none">
           <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-60 mb-4">Глобальные настройки голоса</h4>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div>
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Язык</span>
               <Select value={project.globalVoiceConfig.language} onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, language: val } }))}>
                 <SelectTrigger className="rounded-none border-[#1A1A1A]/20 bg-transparent text-xs font-serif italic"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-none font-serif italic text-xs">
                   <SelectItem value="Русский">Русский</SelectItem>
                   <SelectItem value="English">English</SelectItem>
                   <SelectItem value="Армянский">Армянский</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Пол</span>
               <Select value={project.globalVoiceConfig.gender} onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, gender: val } }))}>
                 <SelectTrigger className="rounded-none border-[#1A1A1A]/20 bg-transparent text-xs font-serif italic"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-none font-serif italic text-xs"><SelectItem value="Мужской">Мужской</SelectItem><SelectItem value="Женский">Женский</SelectItem></SelectContent>
               </Select>
             </div>
             <div>
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Возраст</span>
               <Select value={project.globalVoiceConfig.age} onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, age: val } }))}>
                 <SelectTrigger className="rounded-none border-[#1A1A1A]/20 bg-transparent text-xs font-serif italic"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-none font-serif italic text-xs"><SelectItem value="Молодой">Молодой</SelectItem><SelectItem value="Взрослый">Взрослый</SelectItem><SelectItem value="Пожилой">Пожилой</SelectItem></SelectContent>
               </Select>
             </div>
             <div>
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Тон</span>
               <Select value={project.globalVoiceConfig.tone} onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, tone: val } }))}>
                 <SelectTrigger className="rounded-none border-[#1A1A1A]/20 bg-transparent text-xs font-serif italic"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-none font-serif italic text-xs"><SelectItem value="Серьезный">Серьезный</SelectItem><SelectItem value="Радостный">Радостный</SelectItem><SelectItem value="Драматичный">Драматичный</SelectItem><SelectItem value="Нейтральный">Нейтральный</SelectItem></SelectContent>
               </Select>
             </div>
             <div>
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Скорость: {project.globalVoiceConfig.speed.toFixed(1)}x</span>
               <div className="pt-2">
                 <Slider 
                   defaultValue={[project.globalVoiceConfig.speed]} 
                   max={2} min={0.5} step={0.1} 
                   onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, speed: val[0] } }))}
                   className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                 />
               </div>
             </div>
           </div>
           
           <Separator className="my-6 bg-[#1A1A1A]/10" />
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div className="w-full md:w-2/3">
                <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-60 mb-4">Тонкая настройка (Fine-tuning)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Высота (Pitch)</span>
                      <span className="font-mono text-xs">{project.globalVoiceConfig.pitch! > 0 ? '+' : ''}{project.globalVoiceConfig.pitch}</span>
                    </div>
                    <Slider 
                      defaultValue={[project.globalVoiceConfig.pitch || 0]} 
                      max={10} min={-10} step={1} 
                      onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, pitch: val[0] } }))}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Стиль речи</span>
                    <Select value={project.globalVoiceConfig.style || 'Нейтральный'} onValueChange={(val) => setProject(p => ({ ...p, globalVoiceConfig: { ...p.globalVoiceConfig, style: val } }))}>
                      <SelectTrigger className="rounded-none border-[#1A1A1A]/20 bg-transparent text-xs font-serif italic"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none font-serif italic text-xs">
                        <SelectItem value="Нейтральный">Нейтральный</SelectItem>
                        <SelectItem value="Энтузиазм">С энтузиазмом</SelectItem>
                        <SelectItem value="Спокойный">Спокойный</SelectItem>
                        <SelectItem value="Шепот">Шепот</SelectItem>
                        <SelectItem value="Убедительный">Убедительный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
             </div>
             <div className="w-full md:w-auto">
               <Button variant="outline" className="w-full md:w-auto border-[#1A1A1A] text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold px-6 h-10" onClick={() => simulateProgress('tts-preview', 1000)}>
                  <Play size={14} className="mr-2" /> Предпрослушивание
               </Button>
             </div>
           </div>
        </Card>

        <div className="space-y-4">
          {project.standaloneAudio.map((audio, i) => (
             <div key={audio.id} className="border border-[#1A1A1A]/10 bg-white/50 p-6 relative">
                 <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#1A1A1A]/10"></div>
                 <div className="flex flex-col gap-4">
                   <div className="flex">
                     <div className="w-16 shrink-0 opacity-40 font-mono text-xl">{String(i + 1).padStart(2, '0')}</div>
                     <div className="flex-1 pr-8">
                       <Textarea 
                         value={audio.text} 
                         onChange={e => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, text: e.target.value } : a) }))}
                         className="border-none bg-transparent resize-none p-0 focus-visible:ring-0 text-xl font-serif leading-normal" 
                         placeholder="Текст для независимой генерации голоса..."
                       />
                     </div>
                     <div className="w-64 shrink-0 border-l border-[#1A1A1A]/10 pl-8 space-y-4">
                       <Button className="w-full rounded-none bg-[#F5F2ED] hover:bg-[#1A1A1A] hover:text-[#F5F2ED] text-[#1A1A1A] border border-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold" onClick={() => simulateProgress(audio.id, 1500)}>
                         Сгенерировать
                       </Button>
                       {progress[audio.id] !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono opacity-60">
                               <span>Генерация</span>
                               <span>{Math.round(progress[audio.id])}%</span>
                            </div>
                            <div className="h-1 bg-[#1A1A1A]/10"><div className="h-full bg-[#1A1A1A] transition-all duration-300" style={{ width: `${progress[audio.id]}%` }}></div></div>
                          </div>
                       )}
                       {progress[audio.id] === 100 && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-green-700 uppercase tracking-widest">
                               <Play size={12} /> Аудио готово
                            </div>
                            <Button 
                              onClick={() => downloadFile(audio.text, `standalone_audio_${audio.id}.txt`)}
                              variant="outline" 
                              className="h-8 w-8 p-0 rounded-none border-[#1A1A1A]/20"
                            >
                              <Download size={14} />
                            </Button>
                          </div>
                       )}
                     </div>
                   </div>
                   
                   <div className="pl-16 border-t border-[#1A1A1A]/10 pt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <input 
                          type="checkbox" 
                          id={`override-audio-${audio.id}`}
                          checked={!!audio.voiceConfig}
                          onChange={(e) => {
                            setProject(p => ({
                              ...p,
                              standaloneAudio: p.standaloneAudio.map(a => 
                                a.id === audio.id 
                                  ? { ...a, voiceConfig: e.target.checked ? { ...p.globalVoiceConfig } : undefined }
                                  : a
                              )
                            }));
                          }}
                          className="w-3 h-3 rounded-none border-[#1A1A1A]"
                        />
                        <label htmlFor={`override-audio-${audio.id}`} className="text-[10px] uppercase tracking-widest font-bold opacity-60 cursor-pointer">
                          Использовать индивидуальные настройки голоса
                        </label>
                      </div>
                      
                      {audio.voiceConfig && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#1A1A1A]/5 p-4 border border-[#1A1A1A]/10">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Язык</span>
                            <Select value={audio.voiceConfig.language} onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, language: val } } : a) }))}>
                              <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-none text-[10px]">
                                <SelectItem value="Русский">Русский</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Армянский">Армянский</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Пол</span>
                            <Select value={audio.voiceConfig.gender} onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, gender: val } } : a) }))}>
                              <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-none text-[10px]"><SelectItem value="Мужской">Мужской</SelectItem><SelectItem value="Женский">Женский</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Возраст</span>
                            <Select value={audio.voiceConfig.age} onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, age: val } } : a) }))}>
                              <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-none text-[10px]"><SelectItem value="Молодой">Молодой</SelectItem><SelectItem value="Взрослый">Взрослый</SelectItem><SelectItem value="Пожилой">Пожилой</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Тон</span>
                            <Select value={audio.voiceConfig.tone} onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, tone: val } } : a) }))}>
                              <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-none text-[10px]"><SelectItem value="Серьезный">Серьезный</SelectItem><SelectItem value="Радостный">Радостный</SelectItem><SelectItem value="Драматичный">Драматичный</SelectItem><SelectItem value="Нейтральный">Нейтральный</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Стиль речи</span>
                            <Select value={audio.voiceConfig.style} onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, style: val } } : a) }))}>
                              <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-none text-[10px]">
                                <SelectItem value="Нейтральный">Нейтральный</SelectItem>
                                <SelectItem value="Энтузиазм">С энтузиазмом</SelectItem>
                                <SelectItem value="Спокойный">Спокойный</SelectItem>
                                <SelectItem value="Шепот">Шепот</SelectItem>
                                <SelectItem value="Убедительный">Убедительный</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Скорость: {audio.voiceConfig.speed?.toFixed(1) || 1.0}x</span>
                            <Slider 
                              value={[audio.voiceConfig.speed || 1.0]} 
                              max={2} min={0.5} step={0.1} 
                              onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, speed: val[0] } } : a) }))}
                              className="mt-2 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                            />
                          </div>
                          <div className="col-span-2 md:col-span-2">
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Высота (Pitch): {audio.voiceConfig.pitch! > 0 ? '+' : ''}{audio.voiceConfig.pitch || 0}</span>
                            <Slider 
                              value={[audio.voiceConfig.pitch || 0]} 
                              max={10} min={-10} step={1} 
                              onValueChange={(val) => setProject(p => ({ ...p, standaloneAudio: p.standaloneAudio.map(a => a.id === audio.id ? { ...a, voiceConfig: { ...a.voiceConfig!, pitch: val[0] } } : a) }))}
                              className="mt-2 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                            />
                          </div>
                        </div>
                      )}
                   </div>
                 </div>
             </div>
          ))}

          {project.scenes.map((scene, i) => (
             <div key={scene.id} className="flex flex-col p-4 bg-white/50 border border-[#1A1A1A]/10">
               <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                 <div className="w-12 h-12 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 flex items-center justify-center font-serif text-xl italic shrink-0">
                   {String(i+1).padStart(2, '0')}
                 </div>
                 <div className="flex-1 font-serif text-[#1A1A1A] leading-relaxed">{scene.voiceover}</div>
                 <div className="flex items-center gap-4 shrink-0">
                   {progress[scene.id] !== undefined && progress[scene.id] < 100 && (
                     <div className="w-24 space-y-1">
                       <div className="h-1 bg-[#1A1A1A]/10"><div className="h-full bg-[#1A1A1A]" style={{ width: `${progress[scene.id]}%` }}></div></div>
                     </div>
                   )}
                   {progress[scene.id] === 100 && (
                     <Button 
                       onClick={() => downloadFile(scene.voiceover, `scene_${i+1}_audio.txt`)}
                       className="rounded-none bg-green-700 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-2"
                     >
                       <Download size={12} className="mr-2" /> Скачать
                     </Button>
                   )}
                   <Button 
                     onClick={() => simulateProgress(scene.id, 1000)}
                     disabled={progress[scene.id] !== undefined && progress[scene.id] < 100}
                     className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold px-4 py-2"
                   >
                     <Play size={12} className="mr-2"/> Сгенерировать
                   </Button>
                 </div>
               </div>
               
               <div className="ml-0 md:ml-18 mt-4 border-t border-[#1A1A1A]/10 pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="checkbox" 
                      id={`override-scene-${scene.id}`}
                      checked={!!scene.voiceConfig}
                      onChange={(e) => {
                        setProject(p => ({
                          ...p,
                          scenes: p.scenes.map(s => 
                            s.id === scene.id 
                              ? { ...s, voiceConfig: e.target.checked ? { ...p.globalVoiceConfig } : undefined }
                              : s
                          )
                        }));
                      }}
                      className="w-3 h-3 rounded-none border-[#1A1A1A]"
                    />
                    <label htmlFor={`override-scene-${scene.id}`} className="text-[10px] uppercase tracking-widest font-bold opacity-60 cursor-pointer">
                      Использовать индивидуальные настройки голоса
                    </label>
                  </div>
                  
                  {scene.voiceConfig && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#1A1A1A]/5 p-4 border border-[#1A1A1A]/10">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Язык</span>
                        <Select value={scene.voiceConfig.language} onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, language: val } } : s) }))}>
                          <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none text-[10px]">
                            <SelectItem value="Русский">Русский</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Армянский">Армянский</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Пол</span>
                        <Select value={scene.voiceConfig.gender} onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, gender: val } } : s) }))}>
                          <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none text-[10px]"><SelectItem value="Мужской">Мужской</SelectItem><SelectItem value="Женский">Женский</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Возраст</span>
                        <Select value={scene.voiceConfig.age} onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, age: val } } : s) }))}>
                          <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none text-[10px]"><SelectItem value="Молодой">Молодой</SelectItem><SelectItem value="Взрослый">Взрослый</SelectItem><SelectItem value="Пожилой">Пожилой</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Тон</span>
                        <Select value={scene.voiceConfig.tone} onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, tone: val } } : s) }))}>
                          <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none text-[10px]"><SelectItem value="Серьезный">Серьезный</SelectItem><SelectItem value="Радостный">Радостный</SelectItem><SelectItem value="Драматичный">Драматичный</SelectItem><SelectItem value="Нейтральный">Нейтральный</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Стиль речи</span>
                        <Select value={scene.voiceConfig.style} onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, style: val } } : s) }))}>
                          <SelectTrigger className="h-6 rounded-none border-[#1A1A1A]/20 bg-white text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none text-[10px]">
                            <SelectItem value="Нейтральный">Нейтральный</SelectItem>
                            <SelectItem value="Энтузиазм">С энтузиазмом</SelectItem>
                            <SelectItem value="Спокойный">Спокойный</SelectItem>
                            <SelectItem value="Шепот">Шепот</SelectItem>
                            <SelectItem value="Убедительный">Убедительный</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Скорость: {scene.voiceConfig.speed?.toFixed(1) || 1.0}x</span>
                        <Slider 
                          value={[scene.voiceConfig.speed || 1.0]} 
                          max={2} min={0.5} step={0.1} 
                          onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, speed: val[0] } } : s) }))}
                          className="mt-2 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                        />
                      </div>
                      <div className="col-span-2 md:col-span-2">
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1 block">Высота (Pitch): {scene.voiceConfig.pitch! > 0 ? '+' : ''}{scene.voiceConfig.pitch || 0}</span>
                        <Slider 
                          value={[scene.voiceConfig.pitch || 0]} 
                          max={10} min={-10} step={1} 
                          onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, voiceConfig: { ...s.voiceConfig!, pitch: val[0] } } : s) }))}
                          className="mt-2 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                        />
                      </div>
                    </div>
                  )}
               </div>
             </div>
          ))}
          {project.scenes.length === 0 && project.standaloneAudio.length === 0 && <div className="text-center p-12 text-[#1A1A1A]/60 font-serif italic text-lg border border-[#1A1A1A]/10 bg-white/30">Сцены не сгенерированы. Вы можете использовать свободную генерацию.</div>}
        </div>
      </div>
    </div>
  );

  const renderAudioEditMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 04</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Аудиоредактор</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => downloadFile('{"timeline": "audio", "tracks": ["VO", "SFX", "BGM"]}', 'audio_timeline.edl', 'application/json')}>Экспорт EDL таймлайна</Button>
          <Button size="lg" onClick={() => setActiveMode('IMAGE')} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between border border-[#1A1A1A]/10 bg-white/50 p-6">
         <div className="space-y-6 flex-1 relative overflow-x-auto">
            {/* Timeline header */}
            <div className="flex border-b border-[#1A1A1A]/10 pb-2 mb-4 sticky top-0 bg-white/50 z-10 backdrop-blur-sm min-w-[600px]">
               <div className="w-32 shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50">Треки</div>
               <div className="flex-1 relative h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgwLjV2MTBIMHoiIGZpbGw9IiNjY2MiIC8+PHBhdGggZD0iTTEwIDBoMC41djVIMTB6IiBmaWxsPSIjY2NjIiAvPjxwYXRoIGQ9Ik0yMCAwaDAuNXY1SDIweiIgZmlsbD0iI2NjYyIgLz48cGF0aCBkPSJNMzAgMGgwLjV2NUgzMHoiIGZpbGw9IiNjY2MiIC8+PC9zdmc+')] bg-repeat-x"></div>
            </div>

            <div className="min-w-[600px] space-y-4">
              {/* Voiceover Track */}
              <div className="flex items-center gap-4 group">
                 <div className="w-32 h-16 bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex flex-col justify-center px-2 shrink-0 relative">
                    <span className="text-[10px] font-bold uppercase tracking-widest">A1: Голос</span>
                    <span className="text-[8px] font-mono opacity-50">VO</span>
                 </div>
                 <div className="flex-1 h-16 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 relative">
                   {project.scenes.map((scene, i) => (
                     <div key={scene.id} className="absolute h-12 top-2 bg-[#1A1A1A] text-[#F5F2ED] border-l-4 border-[#F5F2ED] p-1 overflow-hidden" style={{ left: `${i * 120}px`, width: `110px` }}>
                       <span className="text-[8px] font-mono leading-none block line-clamp-2">{scene.voiceover || 'Без голоса'}</span>
                     </div>
                   ))}
                   {project.scenes.length === 0 && <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/30">Пусто</span>}
                 </div>
              </div>

              {/* SFX Track */}
              <div className="flex items-center gap-4 group">
                 <div className="w-32 h-16 bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex flex-col justify-center px-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest">A2: Эффекты</span>
                    <span className="text-[8px] font-mono opacity-50">SFX</span>
                 </div>
                 <div className="flex-1 h-16 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 relative">
                     <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/30">Пусто (Добавьте эффекты)</span>
                 </div>
              </div>

              {/* Music Track */}
              <div className="flex items-center gap-4 group">
                 <div className="w-32 h-16 bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex flex-col justify-center px-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest">A3: Музыка</span>
                    <span className="text-[8px] font-mono opacity-50">BGM</span>
                 </div>
                 <div className="flex-1 h-16 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 relative">
                    <div className="absolute h-12 top-2 left-0 right-0 bg-white/40 border-l border-r border-[#1A1A1A]/20 flex items-center justify-center">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50">Фоновая музыка (отключена)</span>
                    </div>
                 </div>
              </div>
            </div>
         </div>
         
         <div className="mt-6 flex justify-between items-center border-t border-[#1A1A1A]/10 pt-4">
             <div className="flex items-center gap-4">
                <Button variant="outline" className="h-8 w-8 p-0 rounded-none border-[#1A1A1A]"><Play size={14} /></Button>
                <div className="text-[10px] font-mono">00:00:00 / 00:01:20</div>
             </div>
             <Button className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold px-8 py-4">Рендер финального микса</Button>
         </div>
      </div>
    </div>
  );

  const renderImageMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 04</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Nano Banana 2 (Генератор кадров)</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold bg-white/50" onClick={() => setIsImageLibOpen(!isImageLibOpen)}><Library size={14} className="mr-2" /> {isImageLibOpen ? 'Скрыть библиотеку' : 'Библиотека промптов'}</Button>
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => downloadFile(JSON.stringify({ standaloneImages: project.standaloneImages, scenes: project.scenes.map(s => ({ id: s.id, firstFrameImage: s.firstFrameImage, lastFrameImage: s.lastFrameImage })) }, null, 2), 'images_metadata.json', 'application/json')}>Экспорт метаданных (JSON)</Button>
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={handleAddStandaloneImage}>Свободная генерация</Button>
          <Button size="lg" onClick={() => setActiveMode('VIDEO')} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-8 pb-12">
          {isImageLibOpen && (
            <Card className="bg-white/50 border border-[#1A1A1A]/10 rounded-none shadow-none">
              <CardHeader className="p-4 border-b border-[#1A1A1A]/10 bg-black/5 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif text-lg italic">Библиотека промптов (Nano Banana)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 border-b border-[#1A1A1A]/10">
                  {project.imagePromptsLibrary.map((item) => (
                    <div key={item.id} className="p-4 border-r border-b border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 group relative transition-colors">
                       <div className="font-bold text-[11px] uppercase tracking-widest text-[#1A1A1A]/80 mb-1">{item.title}</div>
                       <div className="text-[11px] font-mono whitespace-pre-wrap opacity-60 pr-8">{item.prompt}</div>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                         onClick={() => setProject(p => ({ ...p, imagePromptsLibrary: p.imagePromptsLibrary.filter(i => i.id !== item.id) }))}
                       >
                         <Trash2 size={12} />
                       </Button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-black/5 flex flex-col md:flex-row gap-4 items-start">
                   <div className="flex-1 space-y-2 w-full">
                     <Input placeholder="Название шаблона" className="h-8 text-[11px] rounded-none border-[#1A1A1A]/20 bg-white placeholder:text-[#1A1A1A]/40" value={newImagePromptTitle} onChange={e => setNewImagePromptTitle(e.target.value)} />
                     <Textarea placeholder="Текст промпта..." className="text-[11px] font-mono rounded-none border-[#1A1A1A]/20 min-h-[60px] bg-white resize-none placeholder:text-[#1A1A1A]/40" value={newImagePromptText} onChange={e => setNewImagePromptText(e.target.value)} />
                   </div>
                   <Button 
                     className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold h-8 flex-shrink-0"
                     disabled={!newImagePromptTitle.trim() || !newImagePromptText.trim()}
                     onClick={() => {
                        setProject(p => ({ ...p, imagePromptsLibrary: [...p.imagePromptsLibrary, { id: `img-${Date.now()}`, title: newImagePromptTitle.trim(), prompt: newImagePromptText.trim() }] }));
                        setNewImagePromptTitle('');
                        setNewImagePromptText('');
                     }}
                   >
                     <Plus size={14} className="mr-2" /> Добавить
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {project.standaloneImages.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {project.standaloneImages.map((img) => (
                 <Card key={img.id} className="bg-white/50 border border-[#1A1A1A]/10 rounded-none shadow-none">
                   <CardHeader className="p-4 pb-2 border-b border-[#1A1A1A]/10 bg-black/5 flex flex-row items-center justify-between">
                     <CardTitle className="font-serif text-lg italic outline-none w-full" contentEditable suppressContentEditableWarning onBlur={e => {
                       const value = e.currentTarget.textContent || '';
                       setProject(p => ({ ...p, standaloneImages: p.standaloneImages.map(i => i.id === img.id ? { ...i, prompt: value } : i) }));
                     }}>{img.prompt || 'Введите промпт...'}</CardTitle>
                     <Select onValueChange={(val) => setProject(p => ({ ...p, standaloneImages: p.standaloneImages.map(i => i.id === img.id ? { ...i, prompt: (i.prompt ? i.prompt + ', ' : '') + val } : i) }))}>
                       <SelectTrigger className="h-6 text-[9px] bg-transparent border-[#1A1A1A]/20 rounded-none w-[120px] ml-4"><SelectValue placeholder="Шаблоны" /></SelectTrigger>
                       <SelectContent className="rounded-none text-[10px]">
                         {project.imagePromptsLibrary.map(p => <SelectItem key={p.id} value={p.prompt}>{p.title}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </CardHeader>
                   <CardContent className="p-6">
                     <div className="h-48 bg-[#1A1A1A]/5 flex items-center justify-center border border-[#1A1A1A]/20 border-dashed group relative overflow-hidden">
                       {img.imageUrl ? (
                         <img src={img.imageUrl} alt="Generated" className="w-full h-full object-cover" />
                       ) : (
                         <ImageIcon className="text-[#1A1A1A]/20" size={32} />
                       )}
                       <div className="absolute inset-0 bg-[#1A1A1A]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm gap-2">
                         <Button onClick={() => handleGenerateStandaloneImage(img.id, img.prompt)} disabled={img.isGenerating} className="rounded-none bg-[#F5F2ED] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold">
                           {img.isGenerating ? 'Генерация...' : 'Сгенерировать'}
                         </Button>
                         {img.imageUrl && (
                           <Button onClick={(e) => { e.stopPropagation(); downloadMedia(img.imageUrl!, `img_${img.id}.jpg`); }} className="rounded-none bg-[#F5F2ED] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-2">
                             <Download size={14} />
                           </Button>
                         )}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {project.scenes.map((scene, i) => (
              <Card key={scene.id} className="bg-white/50 border border-[#1A1A1A]/10 rounded-none shadow-none flex flex-col">
                <CardHeader className="p-4 pb-2 border-b border-[#1A1A1A]/10 bg-black/5 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="font-serif text-lg italic">Кадры сцены {String(i+1).padStart(2, '0')}</CardTitle>
                  <Button 
                    onClick={() => {
                        handleGenerateImage(scene.id, 'first', scene.firstFrameIdea);
                        handleGenerateImage(scene.id, 'last', scene.lastFrameIdea);
                    }}
                    disabled={scene.isGeneratingFirstFrame || scene.isGeneratingLastFrame}
                    className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold"
                  >
                    Generate Frames
                  </Button>
                </CardHeader>
                <CardContent className="p-6 flex-1 space-y-8">
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">ПЕРВЫЙ КАДР</div>
                       <Select onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, firstFrameIdea: (s.firstFrameIdea ? s.firstFrameIdea + ', ' : '') + val } : s) }))}>
                         <SelectTrigger className="h-6 text-[9px] bg-transparent border-[#1A1A1A]/20 rounded-none w-[150px]"><SelectValue placeholder="Шаблоны Nano Banana" /></SelectTrigger>
                         <SelectContent className="rounded-none text-[10px]">
                           {project.imagePromptsLibrary.map(p => <SelectItem key={p.id} value={p.prompt}>{p.title}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="h-40 bg-[#1A1A1A]/5 flex items-center justify-center border border-[#1A1A1A]/20 border-dashed group relative overflow-hidden">
                        {scene.firstFrameImage ? (
                          <img src={scene.firstFrameImage} alt="First Frame" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-[#1A1A1A]/20" size={32} />
                        )}
                        <div className="absolute inset-0 bg-[#1A1A1A]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm gap-2">
                          <Button onClick={() => handleGenerateImage(scene.id, 'first', scene.firstFrameIdea)} disabled={scene.isGeneratingFirstFrame} className="rounded-none bg-[#F5F2ED] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold">
                            {scene.isGeneratingFirstFrame ? 'Генерация...' : 'Сгенерировать'}
                          </Button>
                          {scene.firstFrameImage && (
                            <Button onClick={(e) => { e.stopPropagation(); downloadMedia(scene.firstFrameImage!, `first_frame_${scene.id}.jpg`); }} className="rounded-none bg-[#F5F2ED] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-2">
                              <Download size={14} />
                            </Button>
                          )}
                        </div>
                     </div>
                     <Textarea 
                       value={scene.firstFrameIdea}
                       onChange={e => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, firstFrameIdea: e.target.value } : s) }))}
                       className="text-[11px] font-serif italic leading-relaxed text-[#1A1A1A] min-h-[60px] resize-none bg-transparent border-[#1A1A1A]/20 rounded-none focus-visible:ring-0" 
                     />
                   </div>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">ПОСЛЕДНИЙ КАДР</div>
                       <Select onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, lastFrameIdea: (s.lastFrameIdea ? s.lastFrameIdea + ', ' : '') + val } : s) }))}>
                         <SelectTrigger className="h-6 text-[9px] bg-transparent border-[#1A1A1A]/20 rounded-none w-[150px]"><SelectValue placeholder="Шаблоны Nano Banana" /></SelectTrigger>
                         <SelectContent className="rounded-none text-[10px]">
                           {project.imagePromptsLibrary.map(p => <SelectItem key={p.id} value={p.prompt}>{p.title}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="h-40 bg-[#1A1A1A]/5 flex items-center justify-center border border-[#1A1A1A]/20 border-dashed group relative overflow-hidden">
                        {scene.lastFrameImage ? (
                          <img src={scene.lastFrameImage} alt="Last Frame" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-[#1A1A1A]/20" size={32} />
                        )}
                        <div className="absolute inset-0 bg-[#1A1A1A]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm gap-2">
                          <Button onClick={() => handleGenerateImage(scene.id, 'last', scene.lastFrameIdea)} disabled={scene.isGeneratingLastFrame} className="rounded-none bg-[#F5F2ED] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold">
                            {scene.isGeneratingLastFrame ? 'Генерация...' : 'Сгенерировать'}
                          </Button>
                          {scene.lastFrameImage && (
                            <Button onClick={(e) => { e.stopPropagation(); downloadMedia(scene.lastFrameImage!, `last_frame_${scene.id}.jpg`); }} className="rounded-none bg-[#F5F2ED] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-2">
                              <Download size={14} />
                            </Button>
                          )}
                        </div>
                     </div>
                     <Textarea 
                       value={scene.lastFrameIdea}
                       onChange={e => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, lastFrameIdea: e.target.value } : s) }))}
                       className="text-[11px] font-serif italic leading-relaxed text-[#1A1A1A] min-h-[60px] resize-none bg-transparent border-[#1A1A1A]/20 rounded-none focus-visible:ring-0" 
                     />
                   </div>
                </CardContent>
              </Card>
           ))}
           </div>
          {project.scenes.length === 0 && project.standaloneImages.length === 0 && <div className="text-[#1A1A1A]/60 text-center p-12 border border-[#1A1A1A]/10 bg-white/30 font-serif italic text-lg">Сцены не сгенерированы. Вы можете использовать свободную генерацию.</div>}
        </div>
      </ScrollArea>
    </div>
  );

  const renderVideoMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 05</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Движок Veo 3.1</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold bg-white/50" onClick={() => setIsVideoLibOpen(!isVideoLibOpen)}><Library size={14} className="mr-2" /> {isVideoLibOpen ? 'Скрыть библиотеку' : 'Библиотека промптов'}</Button>
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => downloadFile(JSON.stringify({ standaloneVideos: project.standaloneVideos, scenes: project.scenes.map(s => ({ id: s.id, prompt: s.veoPrompt })) }, null, 2), 'video_prompts.json', 'application/json')}>Экспорт видео-промптов</Button>
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={handleAddStandaloneVideo}>Свободная генерация</Button>
          <Button size="lg" onClick={() => setActiveMode('VIDEO_EDIT')} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-6 pb-12">
          {isVideoLibOpen && (
            <Card className="bg-white/50 border border-[#1A1A1A]/10 rounded-none shadow-none mb-8">
              <CardHeader className="p-4 border-b border-[#1A1A1A]/10 bg-black/5 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-serif text-lg italic">Библиотека промптов (Veo 3.1)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 border-b border-[#1A1A1A]/10">
                  {project.videoPromptsLibrary.map((item) => (
                    <div key={item.id} className="p-4 border-r border-b border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 group relative transition-colors">
                       <div className="font-bold text-[11px] uppercase tracking-widest text-[#1A1A1A]/80 mb-1">{item.title}</div>
                       <div className="text-[11px] font-mono whitespace-pre-wrap opacity-60 pr-8">{item.prompt}</div>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                         onClick={() => setProject(p => ({ ...p, videoPromptsLibrary: p.videoPromptsLibrary.filter(i => i.id !== item.id) }))}
                       >
                         <Trash2 size={12} />
                       </Button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-black/5 flex flex-col md:flex-row gap-4 items-start">
                   <div className="flex-1 space-y-2 w-full">
                     <Input placeholder="Название шаблона" className="h-8 text-[11px] rounded-none border-[#1A1A1A]/20 bg-white placeholder:text-[#1A1A1A]/40" value={newVideoPromptTitle} onChange={e => setNewVideoPromptTitle(e.target.value)} />
                     <Textarea placeholder="Текст промпта..." className="text-[11px] font-mono rounded-none border-[#1A1A1A]/20 min-h-[60px] bg-white resize-none placeholder:text-[#1A1A1A]/40" value={newVideoPromptText} onChange={e => setNewVideoPromptText(e.target.value)} />
                   </div>
                   <Button 
                     className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold h-8 flex-shrink-0"
                     disabled={!newVideoPromptTitle.trim() || !newVideoPromptText.trim()}
                     onClick={() => {
                        setProject(p => ({ ...p, videoPromptsLibrary: [...p.videoPromptsLibrary, { id: `vid-${Date.now()}`, title: newVideoPromptTitle.trim(), prompt: newVideoPromptText.trim() }] }));
                        setNewVideoPromptTitle('');
                        setNewVideoPromptText('');
                     }}
                   >
                     <Plus size={14} className="mr-2" /> Добавить
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {project.standaloneVideos.map((vid, i) => (
             <div key={vid.id} className="flex flex-col xl:flex-row space-y-6 xl:space-y-0 xl:space-x-8 p-6 bg-white/50 border border-[#1A1A1A]/10">
               <div className="aspect-video w-full xl:w-96 bg-[#1A1A1A]/5 flex items-center justify-center border border-[#1A1A1A]/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="text-[#1A1A1A]/20" size={48} />
                  </div>
               </div>
               <div className="flex-1 space-y-6">
                  <div>
                    <div className="font-serif text-lg italic mb-1">Свободная генерация {String(i+1).padStart(2, '0')}</div>
                  </div>
                  <div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 space-y-1 text-[9px] text-[#1A1A1A]/60 uppercase tracking-widest font-bold">
                        <div>First Frame</div>
                        <div className="h-16 w-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex items-center justify-center">
                          {vid.firstFrameImage ? <img src={vid.firstFrameImage} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="opacity-20" />}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1 text-[9px] text-[#1A1A1A]/60 uppercase tracking-widest font-bold">
                        <div>Last Frame</div>
                        <div className="h-16 w-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex items-center justify-center">
                          {vid.lastFrameImage ? <img src={vid.lastFrameImage} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="opacity-20" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[9px] font-bold text-[#1A1A1A]/40 uppercase tracking-widest">Инструкция для Veo</div>
                      <Select onValueChange={(val) => setProject(p => ({ ...p, standaloneVideos: p.standaloneVideos.map(v => v.id === vid.id ? { ...v, prompt: (v.prompt ? v.prompt + ', ' : '') + val } : v) }))}>
                         <SelectTrigger className="h-6 text-[9px] bg-transparent border-[#1A1A1A]/20 rounded-none w-[150px]"><SelectValue placeholder="Шаблоны Veo" /></SelectTrigger>
                         <SelectContent className="rounded-none text-[10px]">
                           {project.videoPromptsLibrary.map(p => <SelectItem key={p.id} value={p.prompt}>{p.title}</SelectItem>)}
                         </SelectContent>
                      </Select>
                    </div>
                    <Textarea 
                      value={vid.prompt}
                      onChange={e => setProject(p => ({ ...p, standaloneVideos: p.standaloneVideos.map(v => v.id === vid.id ? { ...v, prompt: e.target.value } : v) }))}
                      className="text-[11px] font-mono bg-[#1A1A1A] text-[#F5F2ED] p-3 leading-relaxed border-none focus-visible:ring-0 rounded-none w-full"
                      placeholder="Промпт для видео"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                      {progress[vid.id] !== undefined && progress[vid.id] < 100 && (
                        <div className="w-32 h-1 bg-[#1A1A1A]/10"><div className="h-full bg-[#1A1A1A]" style={{ width: `${progress[vid.id]}%` }}></div></div>
                      )}
                      {progress[vid.id] === 100 && (
                        <Button 
                          variant="outline"
                          onClick={() => downloadFile(vid.prompt, `standalone_video_${vid.id}.txt`)}
                          className="rounded-none border-[#1A1A1A]/20 text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-4 h-8"
                        >
                          <Download size={12} className="mr-2" /> Скачать MP4
                        </Button>
                      )}
                      <Button 
                        onClick={() => simulateProgress(vid.id, 2000)}
                        disabled={progress[vid.id] !== undefined && progress[vid.id] < 100}
                        className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold px-6 border-none h-8"
                      >
                        <FastForward size={14} className="mr-2" /> Рендер секвенции
                      </Button>
                  </div>
               </div>
             </div>
          ))}

          {project.scenes.map((scene, i) => (
             <div key={scene.id} className="flex flex-col xl:flex-row space-y-6 xl:space-y-0 xl:space-x-8 p-6 bg-white/50 border border-[#1A1A1A]/10">
               <div className="aspect-video w-full xl:w-96 bg-[#1A1A1A]/5 flex items-center justify-center border border-[#1A1A1A]/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="text-[#1A1A1A]/20" size={48} />
                  </div>
               </div>
               <div className="flex-1 space-y-6">
                  <div>
                    <div className="font-serif text-lg italic mb-1">Секвенция {String(i+1).padStart(2, '0')} <span className="ml-2 text-[10px] uppercase font-bold tracking-widest opacity-40 not-italic">{scene.duration} СЕК</span></div>
                    <div className="text-[13px] font-sans text-[#1A1A1A]/80 leading-relaxed">{scene.visualAction}</div>
                  </div>
                  <div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 space-y-1 text-[9px] text-[#1A1A1A]/60 uppercase tracking-widest font-bold">
                        <div>First Frame</div>
                        <div className="h-16 w-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex items-center justify-center">
                          {scene.firstFrameImage ? <img src={scene.firstFrameImage} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="opacity-20" />}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1 text-[9px] text-[#1A1A1A]/60 uppercase tracking-widest font-bold">
                        <div>Last Frame</div>
                        <div className="h-16 w-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex items-center justify-center">
                          {scene.lastFrameImage ? <img src={scene.lastFrameImage} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="opacity-20" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[9px] font-bold text-[#1A1A1A]/40 uppercase tracking-widest">Инструкция для Veo</div>
                      <div className="flex gap-2">
                        {scene.characterIds && scene.characterIds.length > 0 && (
                          <Badge variant="outline" className="text-[8px] bg-blue-100/50 border-blue-200 text-blue-700 rounded-none h-5">
                            Консистентность героев: ВКЛ
                          </Badge>
                        )}
                        <Select onValueChange={(val) => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, veoPrompt: (s.veoPrompt ? s.veoPrompt + ', ' : '') + val } : s) }))}>
                           <SelectTrigger className="h-6 text-[9px] bg-transparent border-[#1A1A1A]/20 rounded-none w-[150px]"><SelectValue placeholder="Шаблоны Veo" /></SelectTrigger>
                           <SelectContent className="rounded-none text-[10px]">
                             {project.videoPromptsLibrary.map(p => <SelectItem key={p.id} value={p.prompt}>{p.title}</SelectItem>)}
                           </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      value={scene.veoPrompt}
                      onChange={e => setProject(p => ({ ...p, scenes: p.scenes.map(s => s.id === scene.id ? { ...s, veoPrompt: e.target.value } : s) }))}
                      className="text-[11px] font-mono bg-[#1A1A1A] text-[#F5F2ED] p-3 leading-relaxed border-none focus-visible:ring-0 rounded-none w-full"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                      {progress[scene.id] !== undefined && progress[scene.id] < 100 && (
                        <div className="w-32 h-1 bg-[#1A1A1A]/10"><div className="h-full bg-[#1A1A1A]" style={{ width: `${progress[scene.id]}%` }}></div></div>
                      )}
                      {progress[scene.id] === 100 && (
                        <Button 
                          variant="outline"
                          onClick={() => downloadFile(scene.veoPrompt, `scene_video_${scene.id}.txt`)}
                          className="rounded-none border-[#1A1A1A]/20 text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-4 h-8"
                        >
                          <Download size={12} className="mr-2" /> Скачать MP4
                        </Button>
                      )}
                      <Button 
                        onClick={() => simulateProgress(scene.id, 2000)}
                        disabled={progress[scene.id] !== undefined && progress[scene.id] < 100}
                        className="rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold px-6 border-none h-8"
                      >
                        <FastForward size={14} className="mr-2" /> Рендер секвенции
                      </Button>
                  </div>
               </div>
             </div>
          ))}
          {project.scenes.length === 0 && project.standaloneVideos.length === 0 && <div className="text-[#1A1A1A]/60 text-center p-12 border border-[#1A1A1A]/10 bg-white/30 font-serif italic text-lg">Сцены не сгенерированы. Вы можете использовать свободную генерацию.</div>}
        </div>
      </ScrollArea>
    </div>
  );

  const renderVideoEditMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4 shrink-0">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 07</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Видеоредактор</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => downloadFile('{"timeline": "video", "tracks": ["V1", "A1", "A2"]}', 'video_timeline.edl', 'application/json')}>Экспорт EDL видео таймлайна</Button>
          <Button size="lg" onClick={() => setActiveMode('FINAL_EXPORT')} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать в проекте
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col xl:flex-row gap-6 mb-6">
          <div className="flex-1 grid grid-rows-[auto_auto] gap-6">
             <div className="border border-[#1A1A1A]/20 rounded-none bg-white/30 flex items-center justify-center relative overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full opacity-60 flex items-center justify-center bg-[radial-gradient(circle_at_center,_#333_0%,_#000_100%)] mix-blend-overlay" style={{
                      filter: `brightness(${100 + project.videoEditorConfig.brightness}%) contrast(${100 + project.videoEditorConfig.contrast}%) saturate(${100 + project.videoEditorConfig.saturation}%)`
                    }}>
                      {/* Logo Preview */}
                      {project.videoEditorConfig.logoUrl && (
                         <div className="absolute m-4" style={{ 
                           ...project.videoEditorConfig.logoPosition.includes('top') ? { top: 0 } : { bottom: 0 },
                           ...project.videoEditorConfig.logoPosition.includes('left') ? { left: 0 } : project.videoEditorConfig.logoPosition.includes('right') ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' },
                           opacity: project.videoEditorConfig.logoOpacity / 100
                         }}>
                            <img src={project.videoEditorConfig.logoUrl} alt="Logo" className="max-w-[100px] max-h-[100px]" />
                         </div>
                      )}
                    </div>
                </div>
                <div className="text-center z-10 text-[#1A1A1A]/80 pointer-events-none">
                  <Clapperboard size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="font-serif text-2xl italic">Превью</h3>
                </div>
             </div>
             <div className="border border-[#1A1A1A]/10 bg-white/50 p-6 flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Главный таймлайн</span>
                </div>
                <div className="space-y-3">
                   <div className="h-6 bg-[#1A1A1A] flex items-center px-4 text-[9px] font-bold text-[#F5F2ED] uppercase tracking-widest relative">
                     <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-[#F5F2ED]/20"></div>
                     V1: Основной видеоряд
                   </div>
                   <div className="h-6 border border-[#1A1A1A]/20 bg-[#1A1A1A]/5 flex items-center px-4 text-[9px] font-bold text-[#1A1A1A]/80 uppercase tracking-widest" style={{ transform: `translateX(${project.videoEditorConfig.audioSyncOffsetMs / 10}px)` }}>
                     A1: Диалоги
                   </div>
                   <div className="h-6 border border-[#1A1A1A]/20 bg-[#1A1A1A]/5 flex items-center px-4 text-[9px] font-bold text-[#1A1A1A]/80 uppercase tracking-widest">
                     A2: Саундтрек
                   </div>
                </div>
             </div>
          </div>
          
          <div className="xl:w-80 flex flex-col gap-6 shrink-0">
             <Card className="rounded-none border-[#1A1A1A]/10 shadow-none bg-white/50">
               <CardHeader className="p-4 border-b border-[#1A1A1A]/10">
                 <CardTitle className="text-xs uppercase tracking-widest font-bold">Логотип (Водяной знак)</CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4">
                 <div>
                   <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Изображение логотипа</span>
                   <Input 
                     type="file" 
                     accept="image/*" 
                     className="rounded-none border-[#1A1A1A]/20 text-xs" 
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const url = URL.createObjectURL(file);
                         setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, logoUrl: url } }));
                       }
                     }}
                   />
                 </div>
                 {project.videoEditorConfig.logoUrl && (
                   <>
                     <div>
                       <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Позиция</span>
                       <Select value={project.videoEditorConfig.logoPosition} onValueChange={(val: any) => setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, logoPosition: val } }))}>
                         <SelectTrigger className="rounded-none border-[#1A1A1A]/20 bg-transparent text-xs font-serif italic"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-none font-serif italic text-xs">
                           <SelectItem value="top-left">Сверху слева</SelectItem>
                           <SelectItem value="top-right">Сверху справа</SelectItem>
                           <SelectItem value="bottom-left">Снизу слева</SelectItem>
                           <SelectItem value="bottom-right">Снизу справа</SelectItem>
                           <SelectItem value="center">По центру</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Прозрачность</span>
                         <span className="font-mono text-xs">{project.videoEditorConfig.logoOpacity}%</span>
                       </div>
                       <Slider 
                         value={[project.videoEditorConfig.logoOpacity]} 
                         max={100} min={0} step={1} 
                         onValueChange={(val) => setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, logoOpacity: val[0] } }))}
                         className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                       />
                     </div>
                   </>
                 )}
               </CardContent>
             </Card>

             <Card className="rounded-none border-[#1A1A1A]/10 shadow-none bg-white/50">
               <CardHeader className="p-4 border-b border-[#1A1A1A]/10">
                 <CardTitle className="text-xs uppercase tracking-widest font-bold">Цветокоррекция</CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4">
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Яркость</span>
                     <span className="font-mono text-xs">{project.videoEditorConfig.brightness > 0 ? '+' : ''}{project.videoEditorConfig.brightness}</span>
                   </div>
                   <Slider 
                     value={[project.videoEditorConfig.brightness]} 
                     max={100} min={-100} step={1} 
                     onValueChange={(val) => setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, brightness: val[0] } }))}
                     className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                   />
                 </div>
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Контраст</span>
                     <span className="font-mono text-xs">{project.videoEditorConfig.contrast > 0 ? '+' : ''}{project.videoEditorConfig.contrast}</span>
                   </div>
                   <Slider 
                     value={[project.videoEditorConfig.contrast]} 
                     max={100} min={-100} step={1} 
                     onValueChange={(val) => setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, contrast: val[0] } }))}
                     className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                   />
                 </div>
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Насыщенность</span>
                     <span className="font-mono text-xs">{project.videoEditorConfig.saturation > 0 ? '+' : ''}{project.videoEditorConfig.saturation}</span>
                   </div>
                   <Slider 
                     value={[project.videoEditorConfig.saturation]} 
                     max={100} min={-100} step={1} 
                     onValueChange={(val) => setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, saturation: val[0] } }))}
                     className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                   />
                 </div>
               </CardContent>
             </Card>

             <Card className="rounded-none border-[#1A1A1A]/10 shadow-none bg-white/50">
               <CardHeader className="p-4 border-b border-[#1A1A1A]/10">
                 <CardTitle className="text-xs uppercase tracking-widest font-bold">Синхронизация Аудио</CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4">
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Смещение диалогов (мс)</span>
                     <span className="font-mono text-xs">{project.videoEditorConfig.audioSyncOffsetMs > 0 ? '+' : ''}{project.videoEditorConfig.audioSyncOffsetMs}</span>
                   </div>
                   <Slider 
                     value={[project.videoEditorConfig.audioSyncOffsetMs]} 
                     max={1000} min={-1000} step={10} 
                     onValueChange={(val) => setProject(p => ({ ...p, videoEditorConfig: { ...p.videoEditorConfig, audioSyncOffsetMs: val[0] } }))}
                     className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-none [&_[role=slider]]:border-[#1A1A1A]" 
                   />
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  const renderExportMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Этап 08</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Финальный экспорт</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white/50 rounded-none border border-[#1A1A1A]/10 shadow-none">
          <CardHeader className="border-b border-[#1A1A1A]/10 bg-black/5">
            <CardTitle className="font-serif italic text-xl">Параметры экспорта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                  <span className="font-bold uppercase tracking-widest">Формат</span>
                  <Select value={project.exportSettings.format} onValueChange={(val) => setProject(p => ({ ...p, exportSettings: { ...p.exportSettings, format: val } }))}>
                     <SelectTrigger className="w-[140px] h-6 text-xs bg-transparent border-none outline-none shadow-none text-right px-0 [&>svg]:hidden text-[#1A1A1A]/60 font-mono">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-none font-mono text-xs">
                        <SelectItem value="MP4 (H.264)">MP4 (H.264)</SelectItem>
                        <SelectItem value="MP4 (H.265)">MP4 (H.265)</SelectItem>
                        <SelectItem value="ProRes 422">ProRes 422</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                  <span className="font-bold uppercase tracking-widest">Разрешение</span>
                  <Select value={project.exportSettings.resolution} onValueChange={(val) => setProject(p => ({ ...p, exportSettings: { ...p.exportSettings, resolution: val } }))}>
                     <SelectTrigger className="w-[140px] h-6 text-xs bg-transparent border-none outline-none shadow-none text-right px-0 [&>svg]:hidden text-[#1A1A1A]/60 font-mono">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-none font-mono text-xs">
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="1440p">1440p</SelectItem>
                        <SelectItem value="4K">4K</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                  <span className="font-bold uppercase tracking-widest">Сотношение сторон</span>
                  <Select value={project.exportSettings.aspectRatio} onValueChange={(val) => setProject(p => ({ ...p, exportSettings: { ...p.exportSettings, aspectRatio: val } }))}>
                     <SelectTrigger className="w-[140px] h-6 text-xs bg-transparent border-none outline-none shadow-none text-right px-0 [&>svg]:hidden text-[#1A1A1A]/60 font-mono">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-none font-mono text-xs">
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                  <span className="font-bold uppercase tracking-widest">FPS</span>
                  <Select value={project.exportSettings.fps} onValueChange={(val) => setProject(p => ({ ...p, exportSettings: { ...p.exportSettings, fps: val } }))}>
                     <SelectTrigger className="w-[140px] h-6 text-xs bg-transparent border-none outline-none shadow-none text-right px-0 [&>svg]:hidden text-[#1A1A1A]/60 font-mono">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-none font-mono text-xs">
                        <SelectItem value="24">24 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
             </div>
             <Button onClick={() => downloadFile(JSON.stringify(project, null, 2), 'full_project.json', 'application/json')} className="w-full mt-8 rounded-none bg-[#1A1A1A] text-[#F5F2ED] text-[10px] uppercase tracking-widest font-bold py-6 px-4" size="lg">
               <Download className="mr-2" size={16} /> Начать сборку пакета (Скачать JSON)
             </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-transparent rounded-none border-none shadow-none">
          <CardHeader className="pl-0 pb-2">
            <CardTitle className="font-serif italic text-xl">Содержимое пакета</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold">Сгенерированные артефакты</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pt-4">
            <ul className="space-y-4 text-xs font-mono text-[#1A1A1A]/80 uppercase">
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none h-auto p-0 hover:bg-transparent group"
                  onClick={() => downloadFile(JSON.stringify(project.scenes, null, 2), 'Финальный_Сценарий.json', 'application/json')}
                >
                  <FileText size={14} className="mr-3 opacity-50 group-hover:opacity-100" /> 
                  <span className="group-hover:underline">Финальный_Сценарий.json</span>
                  <span className="ml-auto opacity-40">24KB</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none h-auto p-0 hover:bg-transparent group"
                  onClick={() => downloadFile(JSON.stringify(project.globalVoiceConfig, null, 2), 'Конфигурация_TTS.json', 'application/json')}
                >
                  <Mic size={14} className="mr-3 opacity-50 group-hover:opacity-100" /> 
                  <span className="group-hover:underline">Конфигурация_TTS.json</span>
                  <span className="ml-auto opacity-40">12KB</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none h-auto p-0 hover:bg-transparent group"
                  onClick={() => downloadFile('EDL CONTENT 1', 'Аудио_Таймлайн.edl')}
                >
                  <Music size={14} className="mr-3 opacity-50 group-hover:opacity-100" /> 
                  <span className="group-hover:underline">Аудио_Таймлайн.edl</span>
                  <span className="ml-auto opacity-40">8KB</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none h-auto p-0 hover:bg-transparent group"
                  onClick={() => downloadFile('EDL CONTENT 2', 'Видео_Таймлайн.edl')}
                >
                  <Clapperboard size={14} className="mr-3 opacity-50 group-hover:opacity-100" /> 
                  <span className="group-hover:underline">Видео_Таймлайн.edl</span>
                  <span className="ml-auto opacity-40">15KB</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-none h-auto p-0 hover:bg-transparent group"
                  onClick={() => downloadFile('<svg></svg>', 'План_логотипа.svg', 'image/svg+xml')}
                >
                  <ImageIcon size={14} className="mr-3 opacity-50 group-hover:opacity-100" /> 
                  <span className="group-hover:underline">План_логотипа.svg</span>
                  <span className="ml-auto opacity-40">3KB</span>
                </Button>
              </li>
              <li>
                <div className="flex items-center text-[#1A1A1A] font-bold border border-[#1A1A1A]/20 p-3 bg-white/50 mt-4">
                  <Play size={14} className="mr-3" /> 
                  <span>ФИНАЛЬНЫЙ_РЕНДЕР.MP4</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[10px] opacity-50 font-normal">Готов к сборке</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-none h-6 px-2 text-[8px] border-[#1A1A1A]"
                      onClick={() => downloadFile('MP4 DUMMY CONTENT', 'render.mp4', 'video/mp4')}
                    >
                      <Download size={10} className="mr-1" /> Скачать
                    </Button>
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCastMode = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-start border-b border-[#1A1A1A]/10 pb-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] font-bold uppercase tracking-widest mb-2">Настройка актеров</span>
          <h3 className="text-4xl font-serif leading-none tracking-tight italic">Персонажи (Cast)</h3>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none text-[10px] uppercase tracking-widest font-bold" onClick={() => setProject(p => ({ ...p, characters: [...p.characters, { id: `char-${Date.now()}`, name: 'Новый персонаж', role: '', age: '', gender: '', physicalDescription: '', personality: '', motivation: '', clothing: '', distinctiveFeatures: '', visualPrompt: '', consistencyReference: '', negativePrompt: '', scriptRelation: '', status: 'draft' }] }))}>
            <Plus size={14} className="mr-2" /> Добавить персонажа
          </Button>
          <Button size="lg" onClick={() => {
            setProject(p => ({ ...p, characters: p.characters.map(c => ({...c, status: 'selected'})) }));
            setActiveMode('SCRIPT');
          }} className="bg-[#1A1A1A] text-[#F5F2ED] px-8 py-6 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-600 transition-colors">
            Использовать всех персонажей в проекте
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {project.characters.map((char) => (
            <Card key={char.id} className="border border-[#1A1A1A]/10 rounded-none shadow-none bg-white/50">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10 bg-black/5 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl font-serif italic">
                  <Input 
                    value={char.name}
                    onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, name: e.target.value } : c) }))}
                    className="border-none bg-transparent p-0 text-xl font-serif italic focus-visible:ring-0 h-auto"
                  />
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-1 ${char.status === 'selected' ? 'bg-emerald-600 text-white' : 'bg-[#1A1A1A]/10'}`}>{char.status}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setProject(p => ({ ...p, characters: p.characters.filter(c => c.id !== char.id) }))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4 mb-4">
                  <div className="w-1/3 aspect-square bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 relative flex flex-col items-center justify-center overflow-hidden">
                    {char.imageUrl ? (
                       <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                    ) : char.isGeneratingImage ? (
                       <div className="text-[10px] uppercase tracking-widest py-4 text-center animate-pulse font-bold">Nano 2...</div>
                    ) : (
                       <ImageIcon className="w-8 h-8 opacity-20" />
                    )}
                  </div>
                  <div className="w-2/3 flex flex-col justify-start space-y-2">
                     <Button 
                        onClick={() => handleGenerateCharacterImage(char.id)} 
                        disabled={char.isGeneratingImage}
                        size="sm" 
                        className="rounded-none text-[9px] uppercase tracking-widest font-bold w-full bg-[#1A1A1A] text-[#F5F2ED] hover:bg-emerald-600 transition-colors"
                     >
                        {char.isGeneratingImage ? 'Генерация...' : 'Сгенерировать (Nano Bonano 2)'}
                     </Button>
                     <div className="flex items-center gap-2">
                       <Input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         id={`ref-img-${char.id}`}
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onloadend = () => {
                               setProject(p => ({
                                 ...p,
                                 characters: p.characters.map(c => c.id === char.id ? { ...c, referenceImageUrl: reader.result as string } : c)
                               }));
                             };
                             reader.readAsDataURL(file);
                           }
                         }}
                       />
                       <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-none text-[9px] uppercase tracking-widest font-bold w-full border-[#1A1A1A]/20"
                          onClick={() => document.getElementById(`ref-img-${char.id}`)?.click()}
                       >
                         {char.referenceImageUrl ? 'Заменить референс' : '+ Фото-референс'}
                       </Button>
                       {char.referenceImageUrl && (
                         <div className="w-8 h-8 shrink-0 relative overflow-hidden border border-[#1A1A1A]/20">
                           <img src={char.referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
                         </div>
                       )}
                     </div>
                     <div className="text-[8px] text-[#1A1A1A]/40 uppercase tracking-widest text-center mt-1 leading-tight">Можно сгенерировать только по тексту или добавить фото-референс</div>
                     <Button onClick={() => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, status: 'selected' } : c) }))} size="sm" variant="outline" className={`w-full rounded-none text-[10px] uppercase font-bold tracking-widest ${char.status === 'selected' ? 'border-emerald-600 text-emerald-600' : 'border-[#1A1A1A]/20 text-[#1A1A1A]'}`}>
                        Использовать в проекте
                     </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Роль в истории</label>
                    <Input value={char.role} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, role: e.target.value } : c) }))} className="bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Возраст / Пол</label>
                    <div className="flex gap-2">
                       <Input value={char.age} placeholder="Возраст" onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, age: e.target.value } : c) }))} className="bg-transparent border-[#1A1A1A]/10 rounded-none text-xs w-1/2" />
                       <Input value={char.gender} placeholder="Пол" onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, gender: e.target.value } : c) }))} className="bg-transparent border-[#1A1A1A]/10 rounded-none text-xs w-1/2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Внешность</label>
                  <Textarea 
                    value={char.physicalDescription}
                    onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, physicalDescription: e.target.value } : c) }))}
                    className="min-h-[40px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Стиль одежды</label>
                  <Textarea 
                    value={char.clothing}
                    onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, clothing: e.target.value } : c) }))}
                    className="min-h-[40px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Особые приметы</label>
                  <Textarea 
                    value={char.distinctiveFeatures}
                    onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, distinctiveFeatures: e.target.value } : c) }))}
                    className="min-h-[40px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Характер</label>
                    <Textarea value={char.personality} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, personality: e.target.value } : c) }))} className="min-h-[40px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Мотивация</label>
                    <Textarea value={char.motivation} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, motivation: e.target.value } : c) }))} className="min-h-[40px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Связь со сценарием</label>
                  <Input value={char.scriptRelation} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, scriptRelation: e.target.value } : c) }))} className="bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                </div>
                
                <div className="pt-2 border-t border-[#1A1A1A]/10 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Consistency Reference (Seed/URL)</label>
                    <Input value={char.consistencyReference} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, consistencyReference: e.target.value } : c) }))} className="bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Negative Prompt</label>
                    <Input value={char.negativePrompt} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, negativePrompt: e.target.value } : c) }))} className="bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold opacity-60 italic">Визуальный промт (отладка)</label>
                    <Textarea value={char.visualPrompt} onChange={(e) => setProject(p => ({ ...p, characters: p.characters.map(c => c.id === char.id ? { ...c, visualPrompt: e.target.value } : c) }))} className="min-h-[40px] bg-transparent border-[#1A1A1A]/10 rounded-none text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {project.characters.length === 0 && (
            <div className="col-span-full text-center p-12 text-[#1A1A1A]/60 font-serif italic text-lg border border-[#1A1A1A]/10 bg-white/30">
              Список персонажей пуст. Добавьте героев для поддержания визуальной консистентности.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderContent = () => {
    switch (activeMode) {
      case 'IDEA': return renderIdeaMode();
      case 'VIDEO_PLAN': return renderVideoPlanMode();
      case 'CAST': return renderCastMode();
      case 'SCRIPT': return renderScriptMode();
      case 'CHAPTER_SEGMENTATION': return renderChapterSegmentationMode();
      case 'TTS': return renderTTSMode();
      case 'AUDIO_EDIT': return renderAudioEditMode();
      case 'IMAGE': return renderImageMode();
      case 'VIDEO': return renderVideoMode();
      case 'VIDEO_EDIT': return renderVideoEditMode();
      case 'FINAL_EXPORT': return renderExportMode();
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Header: Authority & Context */}
      <header className="h-20 shrink-0 border-b border-[#1A1A1A]/10 px-8 flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-serif italic tracking-tighter uppercase font-black">Politic</h1>
          <span className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-50">AI-система производства / v3.1</span>
        </div>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-[11px] font-bold uppercase tracking-widest hidden md:inline">Режим: {activeMode.replace('_', ' ')}</span>
          </div>
          <div className="w-10 h-10 border border-[#1A1A1A] rounded-full flex items-center justify-center font-serif italic">P</div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Rail: Navigation */}
        <section className="w-64 border-r border-[#1A1A1A]/10 p-6 flex flex-col gap-6 shrink-0 bg-[#F5F2ED] z-10">
          <div className="flex justify-between items-end border-b border-[#1A1A1A] pb-2">
            <h2 className="font-serif text-xl italic">Модули</h2>
            <span className="text-[10px] uppercase font-bold opacity-40">Системный пайплайн</span>
          </div>
          <ScrollArea className="flex-1 flex flex-col gap-6">
            <div className="space-y-1">
              {modes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-all duration-200 border ${
                    activeMode === mode.id 
                      ? 'bg-[#1A1A1A] text-[#F5F2ED] border-[#1A1A1A]' 
                      : 'text-[#1A1A1A]/70 border-transparent hover:bg-[#1A1A1A]/5 hover:border-[#1A1A1A]/10'
                  }`}
                >
                  <div className={`flex items-center justify-center ${activeMode === mode.id ? 'opacity-100' : 'opacity-70'}`}>
                     {mode.icon}
                  </div>
                  <span className="uppercase tracking-wider text-[11px] font-bold">{mode.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
          
          <div className="pt-4 border-t border-[#1A1A1A]/10 mt-auto">
            <div className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 space-y-2">
              <div className="flex justify-between"><span>Движок:</span> <span className="font-bold text-[#1A1A1A]">Gemini 3.1 Pro</span></div>
              <div className="flex justify-between"><span>Изображения:</span> <span className="font-bold text-[#1A1A1A]">Nano Banana 2</span></div>
              <div className="flex justify-between"><span>Видео:</span> <span className="font-bold text-[#1A1A1A]">Veo 3.1</span></div>
            </div>
          </div>
        </section>

        {/* Right Rail: Main Viewport */}
        <section className="flex-1 p-8 flex flex-col bg-[#EAE7E2] overflow-hidden">
          <div className="flex-1 overflow-y-auto">
             {renderContent()}
          </div>
        </section>

        {/* Right Rail: Global Project Data */}
        <section className="w-72 border-l border-[#1A1A1A]/10 p-6 flex flex-col gap-6 shrink-0 bg-[#F5F2ED] overflow-hidden">
          <div className="flex justify-between items-end border-b border-[#1A1A1A] pb-2">
            <h2 className="font-serif text-xl italic">Данные проекта</h2>
          </div>
          <ScrollArea className="flex-1">
             <div className="space-y-6 text-sm pb-10">
                <div className="space-y-2">
                   <div className="text-[9px] uppercase font-bold tracking-widest opacity-40">Метаданные</div>
                   {project.genre ? <div className="text-[11px]">Жанр: <strong>{project.genre}</strong></div> : null}
                   {project.style ? <div className="text-[11px]">Стиль: <strong>{project.style}</strong></div> : null}
                   {project.targetAudience ? <div className="text-[11px]">ЦА: <strong>{project.targetAudience}</strong></div> : null}
                   <div className="text-[11px]">Идея: {project.idea ? <span className="text-emerald-600 font-bold">✓ Задана</span> : <span className="opacity-40">—</span>}</div>
                   <div className="text-[11px]">План: {project.videoPlan ? <span className="text-emerald-600 font-bold">✓ Сгенерирован</span> : <span className="opacity-40">—</span>}</div>
                   <div className="text-[11px]">Сценарий: {project.fullScript ? <span className="text-emerald-600 font-bold">✓ Написан</span> : <span className="opacity-40">—</span>}</div>
                </div>
                
                <div className="space-y-2">
                   <div className="text-[9px] uppercase font-bold tracking-widest opacity-40">Элементы</div>
                   <div className="text-[11px]">Главы/Сцены: <strong>{project.scenes.length}</strong></div>
                   
                   <div className="pt-2">
                      <div className="text-[9px] uppercase font-bold tracking-widest opacity-40 mb-1">Персонажи проекта</div>
                      <div className="text-[11px] mb-2">Выбрано: <strong>{project.characters.filter(c => c.status === 'selected' || c.status === 'used').length} / {project.characters.length}</strong></div>
                      <div className="flex gap-1 overflow-x-auto py-1">
                         {project.characters.filter(c => c.status === 'selected' || c.status === 'used').map((c, i) => (
                            <div key={i} className="w-8 h-8 shrink-0 rounded-full border border-emerald-600 overflow-hidden bg-[#1A1A1A]/5 flex items-center justify-center text-[8px] font-bold" title={c.name}>
                               {c.imageUrl || c.referenceImageUrl ? <img src={c.imageUrl || c.referenceImageUrl} alt={c.name} className="w-full h-full object-cover"/> : c.name.charAt(0)}
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="text-[9px] uppercase font-bold tracking-widest opacity-40">Медиа ассеты</div>
                   <div className="text-[11px]">Свободные аудио: <strong>{project.standaloneAudio.length}</strong></div>
                   <div className="text-[11px]">Озвучка сцен: <strong>{project.scenes.filter(s => s.voiceoverAudio).length}</strong></div>
                   <div className="text-[11px]">Свободные изображения: <strong>{project.standaloneImages.length}</strong></div>
                   <div className="text-[11px]">First/Last кадры: <strong>{project.scenes.filter(s => s.firstFrameImage || s.lastFrameImage).length}</strong></div>
                   <div className="text-[11px]">Свободные видео: <strong>{project.standaloneVideos.length}</strong></div>
                   <div className="text-[11px]">Видео сцены: <strong>{project.scenes.filter(s => s.videoFile).length}</strong></div>
                </div>

                <div className="space-y-2">
                   <div className="text-[9px] uppercase font-bold tracking-widest opacity-40">Статус монтажа</div>
                   <div className="text-[11px]">Аудио таймлайн: {project.audioTimelineGenerated ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-40">—</span>}</div>
                   <div className="text-[11px]">Видео таймлайн: {project.videoTimelineGenerated ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-40">—</span>}</div>
                </div>

             </div>
          </ScrollArea>
        </section>
      </main>

      {isImproveModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-[#F5F2ED] w-[900px] h-[80vh] flex flex-col border border-[#1A1A1A]/20 shadow-2xl relative">
            <div className="p-6 border-b border-[#1A1A1A]/10 flex justify-between items-center bg-white/50">
              <h2 className="text-2xl font-serif italic">AI-совет / Улучшить сценарий</h2>
              <Button variant="ghost" className="h-8 w-8 !p-0 opacity-50 hover:opacity-100" onClick={() => setIsImproveModalOpen(false)}>×</Button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
               <div className="w-1/3 border-r border-[#1A1A1A]/10 p-6 flex flex-col gap-6 bg-white/30">
                 <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Стиль улучшения</label>
                   <select 
                     className="w-full bg-transparent border border-[#1A1A1A]/20 p-2 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                     value={improveStyle}
                     onChange={(e) => setImproveStyle(e.target.value)}
                   >
                     <option value="Hollywood">Hollywood</option>
                     <option value="Netflix">Netflix</option>
                     <option value="YouTube">YouTube</option>
                     <option value="TikTok">TikTok</option>
                     <option value="political video">Political Video</option>
                     <option value="documentary">Documentary</option>
                     <option value="music video">Music Video</option>
                     <option value="cinematic">Cinematic</option>
                     <option value="dramatic">Dramatic</option>
                     <option value="comedy">Comedy</option>
                     <option value="thriller">Thriller</option>
                     <option value="рекламный ролик">Рекламный ролик</option>
                     <option value="образовательное видео">Образовательное видео</option>
                     <option value="новостной репортаж">Новостной репортаж</option>
                   </select>
                 </div>
                 
                 <Button onClick={handleRunImprovement} disabled={isImproving} className="bg-[#1A1A1A] text-[#F5F2ED] rounded-none py-6 uppercase tracking-widest text-[10px] font-bold hover:bg-emerald-600 transition-colors">
                   {isImproving ? 'Анализируем...' : 'Запросить улучшение'}
                 </Button>

                 {improveFeedback && (
                   <div className="flex-1 min-h-0 flex flex-col pt-4 border-t border-[#1A1A1A]/10">
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">Рекомендации AI:</span>
                     <ScrollArea className="flex-1 text-xs opacity-80 leading-relaxed font-sans pr-2">
                       {improveFeedback.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                     </ScrollArea>
                   </div>
                 )}
               </div>
               
               <div className="w-2/3 flex flex-col p-6 bg-white/50">
                 <div className="flex-1 min-h-0 flex flex-col">
                   <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">
                     {improveNewText ? 'Новый вариант сценария:' : 'Ожидание сгенерированного текста...'}
                   </span>
                   {improveNewText ? (
                     <Textarea 
                       value={improveNewText} 
                       onChange={(e) => setImproveNewText(e.target.value)}
                       className="flex-1 bg-[#F5F2ED] border border-[#1A1A1A]/20 p-4 font-serif leading-relaxed text-sm rounded-none focus-visible:ring-1 focus-visible:ring-[#1A1A1A] resize-none"
                     />
                   ) : (
                     <div className="flex-1 flex items-center justify-center border border-[#1A1A1A]/10 border-dashed text-[#1A1A1A]/30 italic font-serif">
                       Текст появится здесь после запроса улучшения
                     </div>
                   )}
                 </div>
                 
                 <div className="pt-6 flex justify-end gap-4 mt-auto border-t border-[#1A1A1A]/10 mt-6">
                   <Button variant="outline" onClick={() => setIsImproveModalOpen(false)} className="border-[#1A1A1A]/20 text-[#1A1A1A] rounded-none px-6 text-[10px] uppercase font-bold tracking-widest hover:bg-[#1A1A1A]/5">
                     Отменить
                   </Button>
                   <Button onClick={() => handleApplyImprovement('NEW_VERSION')} disabled={!improveNewText} className="border-[#1A1A1A] border text-[#1A1A1A] bg-transparent rounded-none px-6 text-[10px] uppercase font-bold tracking-widest hover:bg-[#1A1A1A]/5">
                     Сохранить как новую версию
                   </Button>
                   <Button onClick={() => handleApplyImprovement('REPLACE')} disabled={!improveNewText} className="bg-[#1A1A1A] text-[#F5F2ED] rounded-none px-6 text-[10px] uppercase font-bold tracking-widest hover:bg-emerald-600 transition-colors">
                     Заменить текущий сценарий
                   </Button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
