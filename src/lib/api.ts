const API_BASE_URL = "https://cinova-api.onrender.com";

export type EmotionScene = {
  start: number;
  end: number;
  energy: string;
  valence: string;
  depth: string;
  emotion: string;
  intensity: number;
  silence: boolean;
  is_pivotal: boolean;
  environment: string;
  environment_intensity: number;
  transition_out: string;
  transition_duration: number;
  emotion_group?: string;
};

export type AnalyzeResult = {
  success: boolean;
  novel_id: string;
  title: string;
  author: string;
  emotions: EmotionScene[];
};

export async function analyzeNovelText(text: string, language: string = "en"): Promise<AnalyzeResult | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    if (!response.ok) {
      console.error("Analyze failed:", await response.text());
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error("Analyze request error:", err);
    return null;
  }
}

export type MatchedMusic = {
  success: boolean;
  matched_song: {
    song_id: string;
    emotion: string;
    emotion_group?: string;
    title: string;
    file: string;
    composer: string;
    start_sec: number;
    end_sec: number;
    sub_emotion: string;
    sub_intensity: number;
    storage_path: string | null;
  };
  transition_out: string;
  transition_duration: number;
  emotion_group?: string;
  match_score: number;
  same_song?: boolean;
  emotion_distance?: number;
};

export async function matchMusicForScene(
  scene: Partial<EmotionScene>,
  currentSongId?: string,
  currentEmotion?: string,
): Promise<MatchedMusic | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/match-music`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...scene, current_song_id: currentSongId, current_emotion: currentEmotion }),
    });
    if (!response.ok) {
      console.error("Match-music failed:", await response.text());
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error("Match-music request error:", err);
    return null;
  }
}
