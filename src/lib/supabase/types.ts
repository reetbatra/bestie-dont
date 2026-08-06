export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          created_at: string;
          notif_opt_in: boolean;
          has_purchased: boolean;
          purchased_at: string | null;
          display_name: string | null;
          breakup_date: string | null;
          his_name_encrypted: string | null;
          his_name_iv: string | null;
        },
        {
          id: string;
          created_at?: string;
          notif_opt_in?: boolean;
          has_purchased?: boolean;
          purchased_at?: string | null;
          display_name?: string | null;
          breakup_date?: string | null;
          his_name_encrypted?: string | null;
          his_name_iv?: string | null;
        }
      >;
      streaks: Table<
        {
          id: string;
          user_id: string;
          start_date: string;
          is_active: boolean;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          start_date: string;
          is_active?: boolean;
          created_at?: string;
        }
      >;
      slip_events: Table<
        {
          id: string;
          streak_id: string;
          user_id: string;
          occurred_at: string;
          note_encrypted: string | null;
          note_iv: string | null;
          created_at: string;
          recovery_seen_at: string | null;
        },
        {
          id?: string;
          streak_id: string;
          user_id: string;
          occurred_at?: string;
          note_encrypted?: string | null;
          note_iv?: string | null;
          created_at?: string;
          recovery_seen_at?: string | null;
        }
      >;
      receipts: Table<
        {
          id: string;
          user_id: string;
          fact_encrypted: string;
          fact_iv: string;
          feeling_encrypted: string | null;
          feeling_iv: string | null;
          self_facing_encrypted: string | null;
          self_facing_iv: string | null;
          occurred_on: string;
          is_raw: boolean;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          fact_encrypted: string;
          fact_iv: string;
          feeling_encrypted?: string | null;
          feeling_iv?: string | null;
          self_facing_encrypted?: string | null;
          self_facing_iv?: string | null;
          occurred_on: string;
          is_raw?: boolean;
          created_at?: string;
        }
      >;
      vault_entries: Table<
        {
          id: string;
          user_id: string;
          content_encrypted: string;
          content_iv: string;
          created_at: string;
          resurfaced_at: string | null;
          still_feel_encrypted: string | null;
          still_feel_iv: string | null;
        },
        {
          id?: string;
          user_id: string;
          content_encrypted: string;
          content_iv: string;
          created_at?: string;
          resurfaced_at?: string | null;
          still_feel_encrypted?: string | null;
          still_feel_iv?: string | null;
        }
      >;
      identity_items: Table<
        {
          id: string;
          user_id: string;
          label: string;
          category: "hobby" | "friend" | "goal" | "trait";
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          label: string;
          category: "hobby" | "friend" | "goal" | "trait";
          created_at?: string;
        }
      >;
      journal_prompts: Table<
        {
          id: string;
          arc: "stabilize" | "pattern" | "rebuild";
          day_index: number;
          prompt_text: string;
        },
        {
          id?: string;
          arc: "stabilize" | "pattern" | "rebuild";
          day_index: number;
          prompt_text: string;
        }
      >;
      journal_entries: Table<
        {
          id: string;
          user_id: string;
          prompt_id: string | null;
          day_index: number;
          response_encrypted: string | null;
          response_iv: string | null;
          skipped: boolean;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          prompt_id?: string | null;
          day_index: number;
          response_encrypted?: string | null;
          response_iv?: string | null;
          skipped?: boolean;
          created_at?: string;
        }
      >;
      milestones_reached: Table<
        {
          id: string;
          user_id: string;
          day_number: number;
          celebrated_at: string;
        },
        {
          id?: string;
          user_id: string;
          day_number: number;
          celebrated_at?: string;
        }
      >;
      purchases: Table<
        {
          id: string;
          user_id: string;
          dodo_payment_id: string;
          amount: number;
          currency: string;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          dodo_payment_id: string;
          amount: number;
          currency: string;
          status: "pending" | "completed" | "failed" | "refunded";
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
