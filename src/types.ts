export interface SongProject {
  id: string;
  title: string;
  artist?: string;
  genre: string;
  tempo: string;
  mode: 'khmer' | 'english' | 'km';
  lyrics: string;
  producerNotes: string;
  visualAiPrompt: string;
  storyboard: string;
  createdAt: string;
  isFavorite: boolean;
}

export interface GenerateRequest {
  prompt: string;
  genre: string;
  tempo: string;
  mode: 'khmer' | 'english' | 'km';
  title?: string;
  artist?: string;
}

export interface DashboardStats {
  totalSongs: number;
  favoriteSongs: number;
  totalStoryboardScenes: number;
  averageWords: number;
}
