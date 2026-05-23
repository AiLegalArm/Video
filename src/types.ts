export type CharacterStatus = 'draft' | 'selected' | 'used';

export interface Character {
  id: string;
  name: string;
  role: string;
  age: string;
  gender: string;
  physicalDescription: string;
  personality: string;
  motivation: string;
  clothing: string;
  distinctiveFeatures: string;
  visualPrompt: string;
  consistencyReference: string;
  negativePrompt: string;
  scriptRelation: string;
  status: CharacterStatus;
  imageUrl?: string;
  referenceImageUrl?: string;
  isGeneratingImage?: boolean;
}

export type SceneStatus = 'draft' | 'selected' | 'used';

export interface Scene {
  id: string; // internal id
  chapterNumber?: number;
  title?: string;
  meaning: string; // legacy support or short meaning
  shortDescription?: string;
  dramaticFunction?: string;
  scenesList?: string[];
  charactersInvolved?: string[];
  locations?: string[];
  keyEvents?: string;
  visualStyle?: string;
  mood?: string;
  musicAndSoundCues?: string;
  status?: SceneStatus;
  voiceover: string;
  visualAction: string;
  emotion: string;
  duration: number;
  firstFrameIdea: string;
  lastFrameIdea: string;
  veoPrompt: string;
  firstFrameImage?: string;
  lastFrameImage?: string;
  isGeneratingFirstFrame?: boolean;
  isGeneratingLastFrame?: boolean;
  voiceConfig?: Partial<VoiceConfig>;
  characterIds?: string[];
}

export interface VoiceConfig {
  language: string;
  gender: string;
  age: string;
  tone: string;
  speed: number;
  pitch?: number;
  style?: string;
}

export interface ExportSettings {
  format: string;
  resolution: string;
  aspectRatio: string;
  fps: string;
}

export interface VideoEditorSettings {
  logoUrl: string | null;
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  logoOpacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  audioSyncOffsetMs: number;
}

export type PipelineMode = 'IDEA' | 'VIDEO_PLAN' | 'CAST' | 'SCRIPT' | 'CHAPTER_SEGMENTATION' | 'TTS' | 'AUDIO_EDIT' | 'IMAGE' | 'VIDEO' | 'VIDEO_EDIT' | 'FINAL_EXPORT';

export interface StandaloneImage {
  id: string;
  prompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface StandaloneAudio {
  id: string;
  text: string;
  audioUrl?: string;
  isGenerating?: boolean;
  voiceConfig?: Partial<VoiceConfig>;
}

export interface StandaloneVideo {
  id: string;
  prompt: string;
  videoUrl?: string;
  isGenerating?: boolean;
  firstFrameImage?: string;
  lastFrameImage?: string;
}

export interface PromptLibraryItem {
  id: string;
  title: string;
  prompt: string;
}

export interface ProjectState {
  idea: string;
  videoPlan: string;
  fullScript: string;
  style: string;
  genre: string;
  targetAudience: string;
  scenes: Scene[];
  characters: Character[];
  globalVoiceConfig: VoiceConfig;
  exportSettings: ExportSettings;
  videoEditorConfig: VideoEditorSettings;
  standaloneImages: StandaloneImage[];
  standaloneAudio: StandaloneAudio[];
  standaloneVideos: StandaloneVideo[];
  audioTimelineGenerated: boolean;
  videoTimelineGenerated: boolean;
  imagePromptsLibrary: PromptLibraryItem[];
  videoPromptsLibrary: PromptLibraryItem[];
}
