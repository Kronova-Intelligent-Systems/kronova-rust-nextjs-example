export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "admin" | "user" | "viewer"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "user" | "viewer"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "user" | "viewer"
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          name: string
          type: string
          status: "active" | "inactive" | "maintenance"
          location: string | null
          value: number | null
          description: string | null
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          status?: "active" | "inactive" | "maintenance"
          location?: string | null
          value?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: "active" | "inactive" | "maintenance"
          location?: string | null
          value?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
          owner_id?: string
        }
      }
      ai_agents: {
        Row: {
          id: string
          name: string
          type: string
          status: "active" | "inactive" | "training"
          configuration: any
          performance_metrics: any
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          status?: "active" | "inactive" | "training"
          configuration?: any
          performance_metrics?: any
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: "active" | "inactive" | "training"
          configuration?: any
          performance_metrics?: any
          created_at?: string
          updated_at?: string
          owner_id?: string
        }
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          status: "active" | "inactive" | "draft"
          steps: any
          triggers: any
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: "active" | "inactive" | "draft"
          steps?: any
          triggers?: any
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: "active" | "inactive" | "draft"
          steps?: any
          triggers?: any
          created_at?: string
          updated_at?: string
          owner_id?: string
        }
      }
      ai_agent_runs: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          status: "pending" | "running" | "completed" | "failed" | "cancelled"
          input_data: any
          output_data: any
          error_message: string | null
          execution_time_ms: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          user_id: string
          status?: "pending" | "running" | "completed" | "failed" | "cancelled"
          input_data?: any
          output_data?: any
          error_message?: string | null
          execution_time_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          user_id?: string
          status?: "pending" | "running" | "completed" | "failed" | "cancelled"
          input_data?: any
          output_data?: any
          error_message?: string | null
          execution_time_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_runs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
  }
}
