// API client for Note Ninjas - Uses Next.js API routes

const API_BASE_URL = ''; // Empty string for Next.js API routes (same origin)

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Case {
  id: string;
  user_id: string;
  name: string;
  input_json: any;
  output_json: any;
  created_at: string;
  updated_at?: string;
}

export interface CaseListItem {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FeedbackSubmit {
  case_id?: string;
  feedback_type: string;
  exercise_name?: string;
  cue_type?: string;
  cpt_code?: string;
  example_number?: number;
  rating?: string;
  comments?: string;
  context_json?: any;
}

export interface RecommendationRequest {
  user_input: {
    patient_condition: string;
    desired_outcome: string;
    treatment_progression?: string;
    input_mode: string;
  };
  session_id: string;
  rag_manifest?: {
    source_boosts?: {
      note_ninjas?: number;
      cpg?: number;
      textbook?: number;
    };
  };
  feedback_state?: any;
}

export interface Source {
  type: 'note_ninjas' | 'cpg' | 'textbook';
  id: string;
  section?: string;
  page?: string;
  quote: string;
  file_path?: string;
}

export interface Exercise {
  title: string;
  description: string;
  cues: string[];
  documentation?: string;
  cpt?: string | null;
  rationale?: string;
  contraindications?: string;
  progression_options?: string;
  dosage_specifics?: string;
  timeline_phase?: string;
  monitoring_measures?: string;
  home_program_integration?: string;
  customization_notes?: string;
  expected_milestones?: string;
  notes?: string | null;
  sources: Source[];
}

export interface Subsection {
  title: string;
  rationale?: string | null;
  exercises: Exercise[];
}

export interface Alternative {
  when: string;
  instead_try: string;
  sources: Source[];
}

export interface RecommendationResponse {
  high_level: string[];
  subsections: Subsection[];
  suggested_alternatives: Alternative[];
  confidence: 'high' | 'medium' | 'low';
}

// Token Manager
export class TokenManager {
  private static TOKEN_KEY = 'note_ninjas_token';
  private static USER_KEY = 'note_ninjas_user';

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  static removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
  }
}

// API Client
class NoteNinjasAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = TokenManager.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        TokenManager.removeToken();
        TokenManager.removeUser();
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        
        throw new Error('Unauthorized - Please login again');
      }
      
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(name: string, email: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
    
    TokenManager.setToken(response.token);
    TokenManager.setUser(response.user);
    
    return response;
  }

  async logout(): Promise<void> {
    TokenManager.removeToken();
    TokenManager.removeUser();
  }

  async getMe(): Promise<User> {
    const user = TokenManager.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    return user;
  }

  async updateProfile(name: string, email: string): Promise<User> {
    // Update locally for now - can be extended to update in DB
    const user = TokenManager.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    const updatedUser = { ...user, name, email };
    TokenManager.setUser(updatedUser);
    return updatedUser;
  }

  // Recommendations
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    return this.request<RecommendationResponse>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateRecommendations(
    userInputStr: string,
    ragManifest: any = {},
    sessionId: string = `session_${Date.now()}`
  ): Promise<RecommendationResponse> {
    // Parse the userInputStr to extract desired_outcome and treatment_progression if present
    let patientCondition = userInputStr;
    let desiredOutcome = '';
    let treatmentProgression = '';

    // Try to extract desired outcome from the string
    const outcomeMatch = userInputStr.match(/Desired outcome:\s*(.+?)(?:\.|$)/i);
    if (outcomeMatch) {
      desiredOutcome = outcomeMatch[1].trim();
      patientCondition = userInputStr.replace(/Desired outcome:.+/i, '').trim();
    }

    const request: RecommendationRequest = {
      user_input: {
        patient_condition: patientCondition,
        desired_outcome: desiredOutcome,
        treatment_progression: treatmentProgression,
        input_mode: 'simple',
      },
      session_id: sessionId,
      rag_manifest: ragManifest,
    };

    return this.getRecommendations(request);
  }

  async generateRecommendationsStream(
    userInputStr: string,
    ragManifest: any = {},
    sessionId: string = `session_${Date.now()}`,
    onSubsection: (subsection: any, index: number) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Parse the userInputStr to extract desired_outcome and treatment_progression if present
      let patientCondition = userInputStr;
      let desiredOutcome = '';
      let treatmentProgression = '';

      // Try to extract desired outcome from the string
      const outcomeMatch = userInputStr.match(/Desired outcome:\s*(.+?)(?:\.|$)/i);
      if (outcomeMatch) {
        desiredOutcome = outcomeMatch[1].trim();
        patientCondition = userInputStr.replace(/Desired outcome:.+/i, '').trim();
      }

      const request: RecommendationRequest = {
        user_input: {
          patient_condition: patientCondition,
          desired_outcome: desiredOutcome,
          treatment_progression: treatmentProgression,
          input_mode: 'simple',
        },
        session_id: sessionId,
        rag_manifest: ragManifest,
      };

      const token = TokenManager.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/recommendations/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let subsectionIndex = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                onComplete();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                // Backend sends different message types
                if (parsed.type === 'subsection' && parsed.data) {
                  // Extract the actual subsection data from the wrapper
                  onSubsection(parsed.data, parsed.index ?? subsectionIndex);
                  subsectionIndex++;
                } else if (parsed.type === 'skeleton' && parsed.data) {
                  // Handle skeleton/loading cards  
                  onSubsection(parsed.data, parsed.index ?? subsectionIndex);
                  subsectionIndex++;
                } else if (parsed.type === 'complete') {
                  onComplete();
                  return;
                }
                // Skip other message types
              } catch (e) {
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
        
        onComplete();
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Stream error:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Case Management
  async createCase(input_json: any, output_json: any): Promise<Case> {
    return this.request<Case>('/api/cases', {
      method: 'POST',
      body: JSON.stringify({ input_json, output_json }),
    });
  }

  async getCases(): Promise<CaseListItem[]> {
    return this.request<CaseListItem[]>('/api/cases');
  }

  async getCase(caseId: string): Promise<Case> {
    return this.request<Case>(`/api/cases/${caseId}`);
  }

  async updateCaseName(caseId: string, name: string): Promise<Case> {
    return this.request<Case>(`/api/cases/${caseId}/name`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteCase(caseId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/cases/${caseId}`, {
      method: 'DELETE',
    });
  }

  // Feedback
  async submitFeedback(data: FeedbackSubmit): Promise<any> {
    return this.request('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request('/health');
  }

  // Sources
  async getSources(): Promise<{
    total_chunks: number;
    source_counts: Record<string, number>;
    sources_by_type: Record<string, string[]>;
  }> {
    return this.request('/sources');
  }
}

export const noteNinjasAPI = new NoteNinjasAPI();
