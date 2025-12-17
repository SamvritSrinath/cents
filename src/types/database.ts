/**
 * @fileoverview TypeScript type definitions for the Supabase database schema.
 * Generated from the PostgreSQL schema with convenience type exports.
 * 
 * @module types/database
 */

/**
 * JSON type for PostgreSQL JSONB columns.
 * Represents any valid JSON value.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          default_currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          default_currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          default_currency?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          is_default: boolean
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color?: string
          is_default?: boolean
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          is_default?: boolean
          parent_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          category_id: string | null
          merchant: string | null
          description: string | null
          receipt_url: string | null
          expense_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          category_id?: string | null
          merchant?: string | null
          description?: string | null
          receipt_url?: string | null
          expense_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          category_id?: string | null
          merchant?: string | null
          description?: string | null
          receipt_url?: string | null
          expense_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          period: 'weekly' | 'monthly' | 'yearly'
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          period?: 'weekly' | 'monthly' | 'yearly'
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          period?: 'weekly' | 'monthly' | 'yearly'
          start_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_spending_by_category: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          category_id: string
          category_name: string
          category_icon: string
          category_color: string
          total_amount: number
          expense_count: number
        }[]
      }
      get_monthly_spending: {
        Args: {
          p_user_id: string
          p_months?: number
        }
        Returns: {
          month: string
          total_amount: number
          expense_count: number
        }[]
      }
      get_budget_progress: {
        Args: {
          p_user_id: string
        }
        Returns: {
          budget_id: string
          category_id: string
          category_name: string
          category_icon: string
          category_color: string
          budget_amount: number
          spent_amount: number
          remaining_amount: number
          percentage_used: number
          period: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Convenience Type Exports
// ============================================================================

/** User profile data (linked to auth.users) */
export type Profile = Database['public']['Tables']['profiles']['Row']

/** Expense category with icon and color */
export type Category = Database['public']['Tables']['categories']['Row']

/** Individual expense transaction */
export type Expense = Database['public']['Tables']['expenses']['Row']

/** Monthly budget allocation per category */
export type Budget = Database['public']['Tables']['budgets']['Row']

/** Data required to create a new expense */
export type NewExpense = Database['public']['Tables']['expenses']['Insert']

/** Data required to create a new category */
export type NewCategory = Database['public']['Tables']['categories']['Insert']

/** Data required to create a new budget */
export type NewBudget = Database['public']['Tables']['budgets']['Insert']

/** Return type for spending by category aggregation */
export type SpendingByCategory = Database['public']['Functions']['get_spending_by_category']['Returns'][number]

/** Return type for monthly spending trend data */
export type MonthlySpending = Database['public']['Functions']['get_monthly_spending']['Returns'][number]

/** Return type for budget progress with percentage used */
export type BudgetProgress = Database['public']['Functions']['get_budget_progress']['Returns'][number]

