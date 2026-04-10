export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aethernet_message_recipients: {
        Row: {
          aethernet_message_id: string
          delivered_at: string | null
          encrypted_payload: string | null
          id: string
          read_at: string | null
          recipient_id: string
          sender_key_id: string | null
          signature: string | null
          status: string
        }
        Insert: {
          aethernet_message_id: string
          delivered_at?: string | null
          encrypted_payload?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_key_id?: string | null
          signature?: string | null
          status?: string
        }
        Update: {
          aethernet_message_id?: string
          delivered_at?: string | null
          encrypted_payload?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_key_id?: string | null
          signature?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aethernet_message_recipients_aethernet_message_id_fkey"
            columns: ["aethernet_message_id"]
            isOneToOne: false
            referencedRelation: "aethernet_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aethernet_message_recipients_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      aethernet_messages: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aethernet_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_settings: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          settings: Json
          settings_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          settings?: Json
          settings_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          settings?: Json
          settings_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_id: string | null
          name: string
          parameters: Json | null
          system_prompt: string | null
          temperature: number | null
          tools: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_id?: string | null
          name: string
          parameters?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          tools?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_id?: string | null
          name?: string
          parameters?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          tools?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_results: {
        Row: {
          agent_id: string | null
          analysis_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          results: Json
          source_id: string
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          analysis_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          results: Json
          source_id: string
          source_type: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          agent_id?: string | null
          analysis_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          results?: Json
          source_id?: string
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          capabilities: Json | null
          cost_per_1k_tokens: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          model_id: string
          model_type: string
          name: string
          parameters: Json | null
          provider: string
          type: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          model_id: string
          model_type?: string
          name: string
          parameters?: Json | null
          provider: string
          type: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          model_id?: string
          model_type?: string
          name?: string
          parameters?: Json | null
          provider?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_workflow_runs: {
        Row: {
          created_at: string | null
          end_time: string | null
          error: string | null
          id: string
          results: Json | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          error?: string | null
          id?: string
          results?: Json | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          error?: string | null
          id?: string
          results?: Json | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps: Json
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      asset_agent_configs: {
        Row: {
          agent_id: string
          auto_insights: boolean | null
          created_at: string | null
          id: string
          notification_threshold: string
          target_assets: Json
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          auto_insights?: boolean | null
          created_at?: string | null
          id?: string
          notification_threshold?: string
          target_assets?: Json
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          auto_insights?: boolean | null
          created_at?: string | null
          id?: string
          notification_threshold?: string
          target_assets?: Json
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_agent_configs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_intelligence_agent_templates: {
        Row: {
          asset_types: string[]
          business_value: string | null
          capabilities: string[]
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          parameters: Json
          system_prompt: string
          template_id: string
          tools: string[]
          updated_at: string | null
          version: number
        }
        Insert: {
          asset_types?: string[]
          business_value?: string | null
          capabilities?: string[]
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          parameters?: Json
          system_prompt: string
          template_id: string
          tools?: string[]
          updated_at?: string | null
          version?: number
        }
        Update: {
          asset_types?: string[]
          business_value?: string | null
          capabilities?: string[]
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          parameters?: Json
          system_prompt?: string
          template_id?: string
          tools?: string[]
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      asset_intelligence_insights: {
        Row: {
          ai_agent_id: string | null
          asset_id: string
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          priority: string
          recommendations: Json | null
          status: string
          updated_at: string | null
          user_id: string
          workflow_run_id: string | null
        }
        Insert: {
          ai_agent_id?: string | null
          asset_id: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data: Json
          insight_type: string
          priority?: string
          recommendations?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
          workflow_run_id?: string | null
        }
        Update: {
          ai_agent_id?: string | null
          asset_id?: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          priority?: string
          recommendations?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_intelligence_insights_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_intelligence_template_categories: {
        Row: {
          category_name: string
          category_type: string
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          category_name: string
          category_type: string
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          category_name?: string
          category_type?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      asset_intelligence_template_usage: {
        Row: {
          average_execution_time: unknown | null
          created_at: string | null
          deployment_id: string | null
          feedback_comments: string | null
          feedback_rating: number | null
          id: string
          last_used_at: string | null
          success_rate: number | null
          template_id: string
          template_type: string
          updated_at: string | null
          usage_count: number
          user_id: string | null
        }
        Insert: {
          average_execution_time?: unknown | null
          created_at?: string | null
          deployment_id?: string | null
          feedback_comments?: string | null
          feedback_rating?: number | null
          id?: string
          last_used_at?: string | null
          success_rate?: number | null
          template_id: string
          template_type: string
          updated_at?: string | null
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          average_execution_time?: unknown | null
          created_at?: string | null
          deployment_id?: string | null
          feedback_comments?: string | null
          feedback_rating?: number | null
          id?: string
          last_used_at?: string | null
          success_rate?: number | null
          template_id?: string
          template_type?: string
          updated_at?: string | null
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      asset_intelligence_workflow_templates: {
        Row: {
          asset_types: string[]
          business_value: string | null
          category: string
          created_at: string | null
          description: string
          difficulty: string
          estimated_time: string
          icon: string
          id: string
          is_active: boolean
          name: string
          steps: Json
          tags: string[]
          template_id: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
          version: number
        }
        Insert: {
          asset_types?: string[]
          business_value?: string | null
          category: string
          created_at?: string | null
          description: string
          difficulty: string
          estimated_time: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          steps?: Json
          tags?: string[]
          template_id: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          asset_types?: string[]
          business_value?: string | null
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string
          estimated_time?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          tags?: string[]
          template_id?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      asset_lifecycle_events: {
        Row: {
          ai_analysis_id: string | null
          ai_insights: Json | null
          asset_id: string
          cost: number | null
          created_at: string | null
          description: string | null
          documentation: Json | null
          embedding_vector: string | null
          event_date: string
          event_status: string
          event_type: string
          id: string
          is_automated: boolean | null
          location: Json | null
          metadata: Json | null
          performed_by: string | null
          severity: string | null
          user_id: string
          workflow_execution_id: string | null
        }
        Insert: {
          ai_analysis_id?: string | null
          ai_insights?: Json | null
          asset_id: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          documentation?: Json | null
          embedding_vector?: string | null
          event_date?: string
          event_status?: string
          event_type: string
          id?: string
          is_automated?: boolean | null
          location?: Json | null
          metadata?: Json | null
          performed_by?: string | null
          severity?: string | null
          user_id: string
          workflow_execution_id?: string | null
        }
        Update: {
          ai_analysis_id?: string | null
          ai_insights?: Json | null
          asset_id?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          documentation?: Json | null
          embedding_vector?: string | null
          event_date?: string
          event_status?: string
          event_type?: string
          id?: string
          is_automated?: boolean | null
          location?: Json | null
          metadata?: Json | null
          performed_by?: string | null
          severity?: string | null
          user_id?: string
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_lifecycle_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_workflow_executions: {
        Row: {
          agent_decisions: Json | null
          autonomous_mode: boolean | null
          created_at: string | null
          end_time: string | null
          error_message: string | null
          id: string
          learning_insights: Json | null
          performance_metrics: Json | null
          run_id: string
          start_time: string | null
          status: string
          trigger_id: string | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          agent_decisions?: Json | null
          autonomous_mode?: boolean | null
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          learning_insights?: Json | null
          performance_metrics?: Json | null
          run_id: string
          start_time?: string | null
          status: string
          trigger_id?: string | null
          user_id: string
          workflow_id: string
        }
        Update: {
          agent_decisions?: Json | null
          autonomous_mode?: boolean | null
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          learning_insights?: Json | null
          performance_metrics?: Json | null
          run_id?: string
          start_time?: string | null
          status?: string
          trigger_id?: string | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: []
      }
      asset_workflow_triggers: {
        Row: {
          active: boolean | null
          auto_execute: boolean | null
          conditions: Json
          created_at: string | null
          created_by_agent: string | null
          description: string | null
          id: string
          name: string
          requires_approval: boolean | null
          trigger_type: string
          updated_at: string | null
          user_id: string
          workflow_template_id: string
        }
        Insert: {
          active?: boolean | null
          auto_execute?: boolean | null
          conditions?: Json
          created_at?: string | null
          created_by_agent?: string | null
          description?: string | null
          id?: string
          name: string
          requires_approval?: boolean | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
          workflow_template_id: string
        }
        Update: {
          active?: boolean | null
          auto_execute?: boolean | null
          conditions?: Json
          created_at?: string | null
          created_by_agent?: string | null
          description?: string | null
          id?: string
          name?: string
          requires_approval?: boolean | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
          workflow_template_id?: string
        }
        Relationships: []
      }
      asset_workflows: {
        Row: {
          asset_type: string | null
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          trigger_conditions: Json
          updated_at: string | null
          user_id: string
          workflow_steps: Json
        }
        Insert: {
          asset_type?: string | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_conditions: Json
          updated_at?: string | null
          user_id: string
          workflow_steps: Json
        }
        Update: {
          asset_type?: string | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_conditions?: Json
          updated_at?: string | null
          user_id?: string
          workflow_steps?: Json
        }
        Relationships: []
      }
      assets: {
        Row: {
          ai_agent_config: Json | null
          asset_id: string
          asset_type: string
          category: string | null
          compliance_data: Json | null
          created_at: string | null
          current_location: Json | null
          current_value: number | null
          depreciation_rate: number | null
          description: string | null
          embedding_vector: string | null
          esg_metrics: Json | null
          id: string
          iot_sensor_id: string | null
          location_id: string | null
          maintenance_schedule: Json | null
          metadata: Json | null
          name: string
          nfc_tag_id: string | null
          predictive_data: Json | null
          purchase_cost: number | null
          purchase_date: string | null
          qr_code: string | null
          risk_score: number | null
          specifications: Json | null
          status: string
          updated_at: string | null
          user_id: string
          workflow_settings: Json | null
        }
        Insert: {
          ai_agent_config?: Json | null
          asset_id: string
          asset_type: string
          category?: string | null
          compliance_data?: Json | null
          created_at?: string | null
          current_location?: Json | null
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          embedding_vector?: string | null
          esg_metrics?: Json | null
          id?: string
          iot_sensor_id?: string | null
          location_id?: string | null
          maintenance_schedule?: Json | null
          metadata?: Json | null
          name: string
          nfc_tag_id?: string | null
          predictive_data?: Json | null
          purchase_cost?: number | null
          purchase_date?: string | null
          qr_code?: string | null
          risk_score?: number | null
          specifications?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
          workflow_settings?: Json | null
        }
        Update: {
          ai_agent_config?: Json | null
          asset_id?: string
          asset_type?: string
          category?: string | null
          compliance_data?: Json | null
          created_at?: string | null
          current_location?: Json | null
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          embedding_vector?: string | null
          esg_metrics?: Json | null
          id?: string
          iot_sensor_id?: string | null
          location_id?: string | null
          maintenance_schedule?: Json | null
          metadata?: Json | null
          name?: string
          nfc_tag_id?: string | null
          predictive_data?: Json | null
          purchase_cost?: number | null
          purchase_date?: string | null
          qr_code?: string | null
          risk_score?: number | null
          specifications?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
          workflow_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_iot_sensor_id_fkey"
            columns: ["iot_sensor_id"]
            isOneToOne: false
            referencedRelation: "iot_sensors"
            referencedColumns: ["sensor_id"]
          },
        ]
      }
      business_cards: {
        Row: {
          created_at: string
          id: string
          name: string | null
          style: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          style?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          style?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat: {
        Row: {
          created_at: string
          id: number
          messages: string[] | null
          path: string | null
          profile_id: string
          sharepath: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          id?: number
          messages?: string[] | null
          path?: string | null
          profile_id: string
          sharepath?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          messages?: string[] | null
          path?: string | null
          profile_id?: string
          sharepath?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_given: boolean
          consent_type: string
          id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          consent_given: boolean
          consent_type: string
          id?: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          consent_given?: boolean
          consent_type?: string
          id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          continent: Database["public"]["Enums"]["continents"] | null
          id: number
          iso2: string
          iso3: string | null
          local_name: string | null
          name: string | null
        }
        Insert: {
          continent?: Database["public"]["Enums"]["continents"] | null
          id?: number
          iso2: string
          iso3?: string | null
          local_name?: string | null
          name?: string | null
        }
        Update: {
          continent?: Database["public"]["Enums"]["continents"] | null
          id?: number
          iso2?: string
          iso3?: string | null
          local_name?: string | null
          name?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          completed_date: string | null
          connection_id: string | null
          contact_id: string | null
          created_at: string | null
          custom_fields: Json | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          external_id: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          connection_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          external_id: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          type: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          completed_date?: string | null
          connection_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          external_id?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_connection"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_connections: {
        Row: {
          access_token: string | null
          api_key: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          instance_url: string | null
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          provider: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          api_key?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instance_url?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          provider: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          access_token?: string | null
          api_key?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instance_url?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          address: string | null
          company: string | null
          connection_id: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          external_id: string
          first_name: string | null
          id: string
          job_title: string | null
          last_contacted: string | null
          last_name: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          connection_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_id: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          connection_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_id?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_connection"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_data: {
        Row: {
          connection_id: string | null
          created_at: string | null
          data: Json
          external_id: string
          id: string
          last_updated: string | null
          record_type: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          data: Json
          external_id: string
          id?: string
          last_updated?: string | null
          record_type: string
          user_id?: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          data?: Json
          external_id?: string
          id?: string
          last_updated?: string | null
          record_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_data_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          amount: number | null
          close_date: string | null
          connection_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          custom_fields: Json | null
          description: string | null
          external_id: string
          id: string
          name: string
          probability: number | null
          stage: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          close_date?: string | null
          connection_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          external_id: string
          id?: string
          name: string
          probability?: number | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          amount?: number | null
          close_date?: string | null
          connection_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          external_id?: string
          id?: string
          name?: string
          probability?: number | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_connection"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      data_embeddings: {
        Row: {
          created_at: string | null
          description: string | null
          embedding_model: string
          id: string
          metadata: Json | null
          name: string
          source_id: string | null
          source_type: string
          updated_at: string | null
          user_id: string
          vector_data: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          embedding_model: string
          id?: string
          metadata?: Json | null
          name: string
          source_id?: string | null
          source_type: string
          updated_at?: string | null
          user_id?: string
          vector_data?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          embedding_model?: string
          id?: string
          metadata?: Json | null
          name?: string
          source_id?: string | null
          source_type?: string
          updated_at?: string | null
          user_id?: string
          vector_data?: string | null
        }
        Relationships: []
      }
      database_connections: {
        Row: {
          additional_params: Json | null
          connection_string: string | null
          connection_type: Database["public"]["Enums"]["database_connection_type"]
          created_at: string
          database_name: string | null
          description: string | null
          host: string | null
          id: string
          is_active: boolean
          last_test_error: string | null
          last_test_status:
            | Database["public"]["Enums"]["database_connection_status"]
            | null
          last_tested_at: string | null
          name: string
          password: string | null
          port: number | null
          ssl_mode: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          additional_params?: Json | null
          connection_string?: string | null
          connection_type: Database["public"]["Enums"]["database_connection_type"]
          created_at?: string
          database_name?: string | null
          description?: string | null
          host?: string | null
          id?: string
          is_active?: boolean
          last_test_error?: string | null
          last_test_status?:
            | Database["public"]["Enums"]["database_connection_status"]
            | null
          last_tested_at?: string | null
          name: string
          password?: string | null
          port?: number | null
          ssl_mode?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          additional_params?: Json | null
          connection_string?: string | null
          connection_type?: Database["public"]["Enums"]["database_connection_type"]
          created_at?: string
          database_name?: string | null
          description?: string | null
          host?: string | null
          id?: string
          is_active?: boolean
          last_test_error?: string | null
          last_test_status?:
            | Database["public"]["Enums"]["database_connection_status"]
            | null
          last_tested_at?: string | null
          name?: string
          password?: string | null
          port?: number | null
          ssl_mode?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      demo_inquiries: {
        Row: {
          asset_types_to_tokenize: string[] | null
          assigned_to: string | null
          blockchain_preference: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          inquiry_type: string
          ip_address: unknown | null
          last_reply_at: string | null
          message: string
          name: string
          phone: string | null
          priority: string | null
          referrer: string | null
          reply: string | null
          reply_count: number | null
          rwa_interests: string[] | null
          source: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          asset_types_to_tokenize?: string[] | null
          assigned_to?: string | null
          blockchain_preference?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          inquiry_type?: string
          ip_address?: unknown | null
          last_reply_at?: string | null
          message: string
          name: string
          phone?: string | null
          priority?: string | null
          referrer?: string | null
          reply?: string | null
          reply_count?: number | null
          rwa_interests?: string[] | null
          source?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          asset_types_to_tokenize?: string[] | null
          assigned_to?: string | null
          blockchain_preference?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          inquiry_type?: string
          ip_address?: unknown | null
          last_reply_at?: string | null
          message?: string
          name?: string
          phone?: string | null
          priority?: string | null
          referrer?: string | null
          reply?: string | null
          reply_count?: number | null
          rwa_interests?: string[] | null
          source?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      developer_tools: {
        Row: {
          configuration: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tool_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tool_type: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tool_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_type: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          sender_email: string
          sent_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          sender_email?: string
          sent_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          sender_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_template: string
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          text_template: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          text_template: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          text_template?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      embedding_files: {
        Row: {
          created_at: string | null
          embedding_id: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          embedding_id?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          embedding_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_files_embedding_id_fkey"
            columns: ["embedding_id"]
            isOneToOne: false
            referencedRelation: "data_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_jobs: {
        Row: {
          created_at: string | null
          embedding_id: string | null
          error: string | null
          estimated_completion_time: string | null
          file_ids: Json | null
          id: string
          job_type: string
          max_retries: number | null
          parameters: Json
          priority: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          progress: number | null
          result: Json | null
          retry_count: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          embedding_id?: string | null
          error?: string | null
          estimated_completion_time?: string | null
          file_ids?: Json | null
          id?: string
          job_type: string
          max_retries?: number | null
          parameters?: Json
          priority?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          progress?: number | null
          result?: Json | null
          retry_count?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          embedding_id?: string | null
          error?: string | null
          estimated_completion_time?: string | null
          file_ids?: Json | null
          id?: string
          job_type?: string
          max_retries?: number | null
          parameters?: Json
          priority?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          progress?: number | null
          result?: Json | null
          retry_count?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_jobs_embedding_id_fkey"
            columns: ["embedding_id"]
            isOneToOne: false
            referencedRelation: "data_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_usage: {
        Row: {
          agent_id: string | null
          created_at: string | null
          embedding_id: string
          id: string
          query: string | null
          similarity_score: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          embedding_id: string
          id?: string
          query?: string | null
          similarity_score?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          embedding_id?: string
          id?: string
          query?: string | null
          similarity_score?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_usage_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_usage_embedding_id_fkey"
            columns: ["embedding_id"]
            isOneToOne: false
            referencedRelation: "data_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          last_seen: string | null
          metadata: Json | null
          name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          last_seen?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          last_seen?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_capabilities: {
        Row: {
          capability: string
          created_at: string
          entity_id: string
          id: string
        }
        Insert: {
          capability: string
          created_at?: string
          entity_id: string
          id?: string
        }
        Update: {
          capability?: string
          created_at?: string
          entity_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_capabilities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_comm_keys: {
        Row: {
          created_at: string
          entity_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_id: string
          public_key_data: string
          public_key_format: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_id: string
          public_key_data: string
          public_key_format?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_id?: string
          public_key_data?: string
          public_key_format?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_comm_keys_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_public_wallets: {
        Row: {
          address: string
          created_at: string
          entity_id: string
          id: string
          network_id: string
        }
        Insert: {
          address: string
          created_at?: string
          entity_id: string
          id?: string
          network_id: string
        }
        Update: {
          address?: string
          created_at?: string
          entity_id?: string
          id?: string
          network_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_public_wallets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_web3_capabilities: {
        Row: {
          access_role: string
          capability_type: string
          created_at: string
          entity_id: string
          id: string
          protocol_or_network_id: string
          protocol_type: string | null
        }
        Insert: {
          access_role: string
          capability_type: string
          created_at?: string
          entity_id: string
          id?: string
          protocol_or_network_id: string
          protocol_type?: string | null
        }
        Update: {
          access_role?: string
          capability_type?: string
          created_at?: string
          entity_id?: string
          id?: string
          protocol_or_network_id?: string
          protocol_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_web3_capabilities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          created_at: string
          encrypted_access_token: string
          encrypted_refresh_token: string | null
          id: string
          last_sync_at: string | null
          provider: string
          provider_shop_id: string | null
          provider_site_id: string | null
          scopes: string[] | null
          status: string
          sync_error_message: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_access_token: string
          encrypted_refresh_token?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          provider_shop_id?: string | null
          provider_site_id?: string | null
          scopes?: string[] | null
          status?: string
          sync_error_message?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_access_token?: string
          encrypted_refresh_token?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          provider_shop_id?: string | null
          provider_site_id?: string | null
          scopes?: string[] | null
          status?: string
          sync_error_message?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_reports: {
        Row: {
          attachments: Json | null
          browser_info: Json | null
          created_at: string | null
          description: string
          id: string
          page_url: string | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          browser_info?: Json | null
          created_at?: string | null
          description: string
          id?: string
          page_url?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inqueries: {
        Row: {
          created_at: string
          email: string
          id: number
          message: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: number
          message: string
          name?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          message?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      iot_sensor_data: {
        Row: {
          battery_level: number | null
          created_at: string | null
          humidity: number | null
          id: string
          iot_sensor_id: string
          location: Json | null
          metadata: Json | null
          nfc_tag_id: string | null
          temperature: number | null
          timestamp: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          humidity?: number | null
          id?: string
          iot_sensor_id: string
          location?: Json | null
          metadata?: Json | null
          nfc_tag_id?: string | null
          temperature?: number | null
          timestamp?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          humidity?: number | null
          id?: string
          iot_sensor_id?: string
          location?: Json | null
          metadata?: Json | null
          nfc_tag_id?: string | null
          temperature?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      iot_sensors: {
        Row: {
          battery_level: number | null
          created_at: string | null
          device_type: string
          id: string
          last_reading: string | null
          location_data: Json | null
          metadata: Json | null
          sensor_id: string
          sensor_readings: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          device_type: string
          id?: string
          last_reading?: string | null
          location_data?: Json | null
          metadata?: Json | null
          sensor_id: string
          sensor_readings?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          device_type?: string
          id?: string
          last_reading?: string | null
          location_data?: Json | null
          metadata?: Json | null
          sensor_id?: string
          sensor_readings?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          meet_link: string
          start_time: string
          summary: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          meet_link: string
          start_time: string
          summary: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          meet_link?: string
          start_time?: string
          summary?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      members_table: {
        Row: {
          created_at: string
          email: string | null
          id: number
          member_id: string
          name: string | null
          password: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: number
          member_id: string
          name?: string | null
          password?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          member_id?: string
          name?: string | null
          password?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: unknown | null
          referrer: string | null
          source: string | null
          status: string | null
          subscribed_at: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          source?: string | null
          status?: string | null
          subscribed_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          source?: string | null
          status?: string | null
          subscribed_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      nfts: {
        Row: {
          card_id: string
          created_at: string
          id: string
          name: string | null
          token_id: string | null
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          name?: string | null
          token_id?: string | null
          tx_hash?: string | null
          user_id?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          name?: string | null
          token_id?: string | null
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          introductory_period_end: string | null
          is_introductory_pricing: boolean | null
          organization_id: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          introductory_period_end?: string | null
          is_introductory_pricing?: boolean | null
          organization_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          introductory_period_end?: string | null
          is_introductory_pricing?: boolean | null
          organization_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          company_size: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          name: string
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_order_items: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          has_iot_sensors: boolean | null
          id: string
          iot_sensor_count: number | null
          material_type: string
          order_id: string
          package_type: string
          quantity: number
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          has_iot_sensors?: boolean | null
          id?: string
          iot_sensor_count?: number | null
          material_type: string
          order_id: string
          package_type: string
          quantity: number
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          has_iot_sensors?: boolean | null
          id?: string
          iot_sensor_count?: number | null
          material_type?: string
          order_id?: string
          package_type?: string
          quantity?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "packaging_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_orders: {
        Row: {
          created_at: string | null
          design_data: Json | null
          design_files: Json[] | null
          dimensions: Json | null
          has_iot_sensors: boolean | null
          id: string
          iot_sensor_count: number | null
          material_type: string
          order_type: string
          profile_id: string | null
          quantity: number
          special_instructions: string | null
          status: string
          total_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          design_data?: Json | null
          design_files?: Json[] | null
          dimensions?: Json | null
          has_iot_sensors?: boolean | null
          id?: string
          iot_sensor_count?: number | null
          material_type: string
          order_type: string
          profile_id?: string | null
          quantity: number
          special_instructions?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          design_data?: Json | null
          design_files?: Json[] | null
          dimensions?: Json | null
          has_iot_sensors?: boolean | null
          id?: string
          iot_sensor_count?: number | null
          material_type?: string
          order_type?: string
          profile_id?: string | null
          quantity?: number
          special_instructions?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_table: {
        Row: {
          created_at: string
          id: number
          member_id: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: number
          member_id: string
          role: string
          status: string
        }
        Update: {
          created_at?: string
          id?: number
          member_id?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          card_style: Json | null
          company: string | null
          company_logo_url: string | null
          created_at: string | null
          email: string | null
          email_preferences: Json | null
          email_verified: boolean | null
          email_verified_at: string | null
          full_name: string | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          public_access: boolean
          public_id: string | null
          role: Database["public"]["Enums"]["app_role_enum"] | null
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          waddress: string | null
          website: string | null
          xhandle: string | null
        }
        Insert: {
          avatar_url?: string | null
          card_style?: Json | null
          company?: string | null
          company_logo_url?: string | null
          created_at?: string | null
          email?: string | null
          email_preferences?: Json | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          public_access?: boolean
          public_id?: string | null
          role?: Database["public"]["Enums"]["app_role_enum"] | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          waddress?: string | null
          website?: string | null
          xhandle?: string | null
        }
        Update: {
          avatar_url?: string | null
          card_style?: Json | null
          company?: string | null
          company_logo_url?: string | null
          created_at?: string | null
          email?: string | null
          email_preferences?: Json | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          public_access?: boolean
          public_id?: string | null
          role?: Database["public"]["Enums"]["app_role_enum"] | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          waddress?: string | null
          website?: string | null
          xhandle?: string | null
        }
        Relationships: []
      }
      reusable_packages: {
        Row: {
          created_at: string | null
          current_shipment_id: string | null
          description: string | null
          dimensions: Json
          expected_lifetime: number | null
          id: string
          iot_data: Json | null
          iot_enabled: boolean
          iot_sensor_id: string | null
          last_used: string | null
          location_id: string | null
          material: string | null
          metadata: Json | null
          name: string
          nfc_tag_id: string | null
          order_id: string | null
          package_id: string
          purchase_date: string | null
          reuse_count: number | null
          shipment_history: string[] | null
          status: string | null
          updated_at: string | null
          weight_capacity: number
        }
        Insert: {
          created_at?: string | null
          current_shipment_id?: string | null
          description?: string | null
          dimensions: Json
          expected_lifetime?: number | null
          id?: string
          iot_data?: Json | null
          iot_enabled?: boolean
          iot_sensor_id?: string | null
          last_used?: string | null
          location_id?: string | null
          material?: string | null
          metadata?: Json | null
          name: string
          nfc_tag_id?: string | null
          order_id?: string | null
          package_id: string
          purchase_date?: string | null
          reuse_count?: number | null
          shipment_history?: string[] | null
          status?: string | null
          updated_at?: string | null
          weight_capacity: number
        }
        Update: {
          created_at?: string | null
          current_shipment_id?: string | null
          description?: string | null
          dimensions?: Json
          expected_lifetime?: number | null
          id?: string
          iot_data?: Json | null
          iot_enabled?: boolean
          iot_sensor_id?: string | null
          last_used?: string | null
          location_id?: string | null
          material?: string | null
          metadata?: Json | null
          name?: string
          nfc_tag_id?: string | null
          order_id?: string | null
          package_id?: string
          purchase_date?: string | null
          reuse_count?: number | null
          shipment_history?: string[] | null
          status?: string | null
          updated_at?: string | null
          weight_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "reusable_packages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "packaging_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping: {
        Row: {
          actual_delivery: string | null
          carrier: string | null
          carrier_api_response: Json | null
          cost: number | null
          created_at: string | null
          current_location: Json | null
          destination_address: Json
          dimensions: Json | null
          estimated_delivery: string | null
          id: string
          iot_data: Json | null
          iot_sensor_id: string | null
          label_image_base64: string | null
          last_updated: string | null
          metadata: Json | null
          origin_address: Json
          package_ids: Json | null
          public_id: string | null
          shipping_date: string | null
          status: string | null
          tracking_number: string
          transit_events: Json[] | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          actual_delivery?: string | null
          carrier?: string | null
          carrier_api_response?: Json | null
          cost?: number | null
          created_at?: string | null
          current_location?: Json | null
          destination_address: Json
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          iot_data?: Json | null
          iot_sensor_id?: string | null
          label_image_base64?: string | null
          last_updated?: string | null
          metadata?: Json | null
          origin_address: Json
          package_ids?: Json | null
          public_id?: string | null
          shipping_date?: string | null
          status?: string | null
          tracking_number: string
          transit_events?: Json[] | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Update: {
          actual_delivery?: string | null
          carrier?: string | null
          carrier_api_response?: Json | null
          cost?: number | null
          created_at?: string | null
          current_location?: Json | null
          destination_address?: Json
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          iot_data?: Json | null
          iot_sensor_id?: string | null
          label_image_base64?: string | null
          last_updated?: string | null
          metadata?: Json | null
          origin_address?: Json
          package_ids?: Json | null
          public_id?: string | null
          shipping_date?: string | null
          status?: string | null
          tracking_number?: string
          transit_events?: Json[] | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          attrs: Json | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer: string | null
          id: string | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_requests_limit: number | null
          api_calls_limit: number | null
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          managed_assets_limit: number | null
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_monthly_standard: number | null
          price_yearly: number
          price_yearly_standard: number | null
          storage_limit_gb: number | null
          team_members_limit: number | null
          updated_at: string | null
        }
        Insert: {
          ai_requests_limit?: number | null
          api_calls_limit?: number | null
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          managed_assets_limit?: number | null
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_monthly_standard?: number | null
          price_yearly: number
          price_yearly_standard?: number | null
          storage_limit_gb?: number | null
          team_members_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_requests_limit?: number | null
          api_calls_limit?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          managed_assets_limit?: number | null
          name?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          price_monthly_standard?: number | null
          price_yearly?: number
          price_yearly_standard?: number | null
          storage_limit_gb?: number | null
          team_members_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      sui_nfts: {
        Row: {
          avatar_url: string
          blockchain: string
          content_url: string
          created_at: string | null
          domain_name: string
          id: string
          name: string
          tx_hash: string
          user_id: string
        }
        Insert: {
          avatar_url: string
          blockchain?: string
          content_url: string
          created_at?: string | null
          domain_name: string
          id?: string
          name: string
          tx_hash: string
          user_id?: string
        }
        Update: {
          avatar_url?: string
          blockchain?: string
          content_url?: string
          created_at?: string | null
          domain_name?: string
          id?: string
          name?: string
          tx_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      supply_chain_data: {
        Row: {
          created_at: string | null
          data: Json
          data_type: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          data_type: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          data_type?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_agent_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty: string | null
          estimated_setup_time: number | null
          icon: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          parameters: Json
          system_prompt: string
          tags: string[] | null
          template_id: string
          tools: Json
          updated_at: string | null
          use_cases: string[] | null
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          estimated_setup_time?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          parameters?: Json
          system_prompt: string
          tags?: string[] | null
          template_id: string
          tools?: Json
          updated_at?: string | null
          use_cases?: string[] | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          estimated_setup_time?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          parameters?: Json
          system_prompt?: string
          tags?: string[] | null
          template_id?: string
          tools?: Json
          updated_at?: string | null
          use_cases?: string[] | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_agent_templates_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["name"]
          },
        ]
      }
      system_workflow_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty: string | null
          estimated_time: number | null
          expected_outcomes: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          prerequisites: string[] | null
          steps: Json
          tags: string[] | null
          template_id: string
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          estimated_time?: number | null
          expected_outcomes?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          prerequisites?: string[] | null
          steps?: Json
          tags?: string[] | null
          template_id: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          estimated_time?: number | null
          expected_outcomes?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          prerequisites?: string[] | null
          steps?: Json
          tags?: string[] | null
          template_id?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_workflow_templates_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["name"]
          },
        ]
      }
      task_web3_actions: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          result: Json | null
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          result?: Json | null
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          result?: Json | null
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_web3_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          deadline: string | null
          details: Json | null
          id: string
          requester_id: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          deadline?: string | null
          details?: Json | null
          id?: string
          requester_id?: string | null
          status?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          deadline?: string | null
          details?: Json | null
          id?: string
          requester_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      template_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      template_usage_analytics: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          template_id: string
          template_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          template_id: string
          template_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          template_id?: string
          template_type?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          id: number
          inserted_at: string
          is_complete: boolean | null
          task: string | null
          user_id: string
        }
        Insert: {
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id?: string
        }
        Update: {
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          period_end: string
          period_start: string
          resource_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          period_end: string
          period_start: string
          resource_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          period_end?: string
          period_start?: string
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_managed_supabase_projects: {
        Row: {
          created_at: string
          db_host: string | null
          display_name: string
          encrypted_anon_key: string | null
          encrypted_service_role_key: string | null
          error_message: string | null
          id: string
          status: string
          supabase_plan: string
          supabase_project_id: string
          supabase_project_ref: string
          supabase_region: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          db_host?: string | null
          display_name: string
          encrypted_anon_key?: string | null
          encrypted_service_role_key?: string | null
          error_message?: string | null
          id?: string
          status?: string
          supabase_plan: string
          supabase_project_id: string
          supabase_project_ref: string
          supabase_region: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          db_host?: string | null
          display_name?: string
          encrypted_anon_key?: string | null
          encrypted_service_role_key?: string | null
          error_message?: string | null
          id?: string
          status?: string
          supabase_plan?: string
          supabase_project_id?: string
          supabase_project_ref?: string
          supabase_region?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json
          settings_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json
          settings_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json
          settings_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          created_at: string | null
          id: number
          refresh_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          refresh_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          refresh_token?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          agreed_to_updates: boolean | null
          asset_types_to_tokenize: string[] | null
          company: string
          converted_at: string | null
          created_at: string | null
          email: string
          estimated_users: string | null
          first_name: string
          id: string
          interested_in_tokenization: boolean | null
          interested_plan: string | null
          ip_address: unknown | null
          last_name: string
          notified_at: string | null
          preferred_blockchain: string | null
          priority: string | null
          referrer: string | null
          role: string
          source: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          agreed_to_updates?: boolean | null
          asset_types_to_tokenize?: string[] | null
          company: string
          converted_at?: string | null
          created_at?: string | null
          email: string
          estimated_users?: string | null
          first_name: string
          id?: string
          interested_in_tokenization?: boolean | null
          interested_plan?: string | null
          ip_address?: unknown | null
          last_name: string
          notified_at?: string | null
          preferred_blockchain?: string | null
          priority?: string | null
          referrer?: string | null
          role: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          agreed_to_updates?: boolean | null
          asset_types_to_tokenize?: string[] | null
          company?: string
          converted_at?: string | null
          created_at?: string | null
          email?: string
          estimated_users?: string | null
          first_name?: string
          id?: string
          interested_in_tokenization?: boolean | null
          interested_plan?: string | null
          ip_address?: unknown | null
          last_name?: string
          notified_at?: string | null
          preferred_blockchain?: string | null
          priority?: string | null
          referrer?: string | null
          role?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      workflow_learning_data: {
        Row: {
          created_at: string | null
          decision_outcomes: Json | null
          id: string
          optimization_suggestions: Json | null
          performance_metrics: Json | null
          run_id: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          decision_outcomes?: Json | null
          id?: string
          optimization_suggestions?: Json | null
          performance_metrics?: Json | null
          run_id: string
          user_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          decision_outcomes?: Json | null
          id?: string
          optimization_suggestions?: Json | null
          performance_metrics?: Json | null
          run_id?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      asset_analytics: {
        Row: {
          active_assets: number | null
          asset_type: string | null
          avg_asset_value: number | null
          iot_enabled_assets: number | null
          maintenance_assets: number | null
          total_asset_value: number | null
          total_assets: number | null
          total_insights: number | null
          total_lifecycle_events: number | null
          user_id: string | null
        }
        Relationships: []
      }
      embedding_job_stats: {
        Row: {
          avg_processing_time_seconds: number | null
          first_job_at: string | null
          job_count: number | null
          job_type: string | null
          last_job_at: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: []
      }
      iot_sensor_analytics: {
        Row: {
          avg_start_latitude: number | null
          avg_start_longitude: number | null
          impact_events: number | null
          low_battery_events: number | null
          refrigerated_shipments: number | null
          sensor_types: Json | null
          temperature_excursions: number | null
          total_iot_shipments: number | null
          user_id: string | null
        }
        Relationships: []
      }
      package_shipment_details: {
        Row: {
          carrier: string | null
          destination_address: Json | null
          estimated_delivery: string | null
          origin_address: Json | null
          package_id: string | null
          package_name: string | null
          reuse_count: number | null
          shipment_id: string | null
          shipment_status: string | null
          shipping_date: string | null
          status: string | null
          tracking_code: string | null
          tracking_number: string | null
        }
        Relationships: []
      }
      package_utilization: {
        Row: {
          created_at: string | null
          days_since_creation: number | null
          id: string | null
          last_used_date: string | null
          name: string | null
          package_id: string | null
          reuse_count: number | null
          reuses_per_day: number | null
          shipment_count: number | null
          status: string | null
        }
        Relationships: []
      }
      packaging_order_analytics: {
        Row: {
          material_type: string | null
          order_count: number | null
          order_month: string | null
          order_type: string | null
          orders_with_iot: number | null
          total_iot_sensors: number | null
          total_quantity: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      shipping_analytics: {
        Row: {
          avg_actual_delivery_days: number | null
          avg_cost: number | null
          avg_estimated_delivery_days: number | null
          avg_weight: number | null
          delayed_count: number | null
          delivered_count: number | null
          in_transit_count: number | null
          shipping_day: string | null
          total_cost: number | null
          total_shipments: number | null
          total_weight: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      complete_job: {
        Args: { job_id: string; job_result?: Json }
        Returns: undefined
      }
      fail_job: {
        Args: { error_message: string; job_id: string }
        Returns: undefined
      }
      get_refrigerated_shipment_stats: {
        Args: { user_id: string }
        Returns: {
          avg_max_temp: number
          avg_min_temp: number
          excursion_rate: number
          total_refrigerated_shipments: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_reuse_count: {
        Args: { p_id: number }
        Returns: number
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_email_send: {
        Args: {
          p_email_type: string
          p_message_id?: string
          p_metadata?: Json
          p_recipient_email: string
          p_subject: string
        }
        Returns: string
      }
      match_embeddings: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          user_id: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_shipments_by_iot_data: {
        Args: { search_query: string; user_id: string }
        Returns: {
          actual_delivery: string | null
          carrier: string | null
          carrier_api_response: Json | null
          cost: number | null
          created_at: string | null
          current_location: Json | null
          destination_address: Json
          dimensions: Json | null
          estimated_delivery: string | null
          id: string
          iot_data: Json | null
          iot_sensor_id: string | null
          label_image_base64: string | null
          last_updated: string | null
          metadata: Json | null
          origin_address: Json
          package_ids: Json | null
          public_id: string | null
          shipping_date: string | null
          status: string | null
          tracking_number: string
          transit_events: Json[] | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      start_job_processing: {
        Args: { job_id: string }
        Returns: undefined
      }
      update_ai_model_type: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_job_progress: {
        Args: { job_id: string; new_message?: string; new_progress: number }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role_enum: "admin" | "editor" | "viewer"
      continents:
        | "Africa"
        | "Antarctica"
        | "Asia"
        | "Europe"
        | "Oceania"
        | "North America"
        | "South America"
      database_connection_status: "pending_test" | "success" | "failed"
      database_connection_type:
        | "postgresql"
        | "mysql"
        | "sqlserver"
        | "bigquery"
        | "snowflake"
      integration_provider: "shopify" | "wix"
      integration_status: "active" | "revoked" | "error" | "pending"
      subscription_plan: "lite" | "starter" | "professional" | "enterprise"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      sync_status: "idle" | "syncing" | "completed" | "failed"
      user_role: "owner" | "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  realtime: {
    Tables: {
      messages: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_03: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_04: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_05: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_06: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_07: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_08: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_10_09: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          inserted_at: string | null
          version: number
        }
        Insert: {
          inserted_at?: string | null
          version: number
        }
        Update: {
          inserted_at?: string | null
          version?: number
        }
        Relationships: []
      }
      subscription: {
        Row: {
          claims: Json
          claims_role: unknown
          created_at: string
          entity: unknown
          filters: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
          id: number
          subscription_id: string
        }
        Insert: {
          claims: Json
          claims_role?: unknown
          created_at?: string
          entity: unknown
          filters?: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
          id?: never
          subscription_id: string
        }
        Update: {
          claims?: Json
          claims_role?: unknown
          created_at?: string
          entity?: unknown
          filters?: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
          id?: never
          subscription_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_rls: {
        Args: { max_record_bytes?: number; wal: Json }
        Returns: Database["realtime"]["CompositeTypes"]["wal_rls"][]
      }
      broadcast_changes: {
        Args: {
          event_name: string
          level?: string
          new: Record<string, unknown>
          old: Record<string, unknown>
          operation: string
          table_name: string
          table_schema: string
          topic_name: string
        }
        Returns: undefined
      }
      build_prepared_statement_sql: {
        Args: {
          columns: Database["realtime"]["CompositeTypes"]["wal_column"][]
          entity: unknown
          prepared_statement_name: string
        }
        Returns: string
      }
      cast: {
        Args: { type_: unknown; val: string }
        Returns: Json
      }
      check_equality_op: {
        Args: {
          op: Database["realtime"]["Enums"]["equality_op"]
          type_: unknown
          val_1: string
          val_2: string
        }
        Returns: boolean
      }
      is_visible_through_filters: {
        Args: {
          columns: Database["realtime"]["CompositeTypes"]["wal_column"][]
          filters: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
        }
        Returns: boolean
      }
      list_changes: {
        Args: {
          max_changes: number
          max_record_bytes: number
          publication: unknown
          slot_name: unknown
        }
        Returns: Database["realtime"]["CompositeTypes"]["wal_rls"][]
      }
      quote_wal2json: {
        Args: { entity: unknown }
        Returns: string
      }
      send: {
        Args: { event: string; payload: Json; private?: boolean; topic: string }
        Returns: undefined
      }
      to_regrole: {
        Args: { role_name: string }
        Returns: unknown
      }
      topic: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      action: "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "ERROR"
      equality_op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in"
    }
    CompositeTypes: {
      user_defined_filter: {
        column_name: string | null
        op: Database["realtime"]["Enums"]["equality_op"] | null
        value: string | null
      }
      wal_column: {
        name: string | null
        type_name: string | null
        type_oid: unknown | null
        value: Json | null
        is_pkey: boolean | null
        is_selectable: boolean | null
      }
      wal_rls: {
        wal: Json | null
        is_rls_enabled: boolean | null
        subscription_ids: string[] | null
        errors: string[] | null
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role_enum: ["admin", "editor", "viewer"],
      continents: [
        "Africa",
        "Antarctica",
        "Asia",
        "Europe",
        "Oceania",
        "North America",
        "South America",
      ],
      database_connection_status: ["pending_test", "success", "failed"],
      database_connection_type: [
        "postgresql",
        "mysql",
        "sqlserver",
        "bigquery",
        "snowflake",
      ],
      integration_provider: ["shopify", "wix"],
      integration_status: ["active", "revoked", "error", "pending"],
      subscription_plan: ["lite", "starter", "professional", "enterprise"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      sync_status: ["idle", "syncing", "completed", "failed"],
      user_role: ["owner", "admin", "member", "viewer"],
    },
  },
  realtime: {
    Enums: {
      action: ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "ERROR"],
      equality_op: ["eq", "neq", "lt", "lte", "gt", "gte", "in"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const
