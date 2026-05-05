// src/models/types.ts
export type DashboardTab = 'plan' | 'script' | 'observations' | 'findings' | 'reports';
export type PlanStatus = 'Borrador' | 'Activo' | 'Completado';
export type Severity = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type Priority = 'Baja' | 'Media' | 'Alta';
export type SuccessStatus = 'Sí' | 'No' | 'Con ayuda';
export type TaskStatus = 'Pendiente' | 'En progreso' | 'Resuelto';

export interface TestTask {
  id?: string;
  test_plan_id?: string;
  task_index: string;
  scenario: string;
  expected_result: string;
  main_metric: string;
  success_criteria: string;
  script_task_text?: string;
  script_follow_up?: string;
  script_expected_success?: string;
}

export interface ClosingQuestion {
  question: string;
  answer: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  updated_at: string;
}

export interface TestPlan {
  id?: string;
  profile_id?: string;
  product: string;
  module: string;
  objective: string;
  user_profile: string;
  method: string;
  duration: string;
  test_date: string;
  location_channel: string;
  moderator: string;
  observer: string;
  tools: string;
  link: string;
  status?: PlanStatus;
  moderator_notes: string;
  closing_questions?: ClosingQuestion[];
  created_at?: string;
}

export interface Observation {
  id?: string;
  test_plan_id?: string;
  participant: string;
  profile: string;
  task_ref: string;
  success_level: SuccessStatus;
  time_seconds: number;
  errors: number;
  comments: string;
  problem: string;
  severity: Severity;
  proposal: string;
}

export interface Finding {
  id?: string;
  test_plan_id?: string;
  problem: string;
  evidence: string;
  frequency: string;
  severity: Severity;
  recommendation: string;
  priority: Priority;
  status: TaskStatus;
  is_favorite?: boolean;
}