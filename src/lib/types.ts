export type Socials = Record<string, string>;

export type ProfileTemplate = "classic" | "editorial" | "minimal";

export type ProfileLink = { label: string; url: string };

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  job_title: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  socials: Socials | null;
  avatar_url: string | null;
  template: ProfileTemplate;
  tagline: string | null;
  bio: string | null;
  cta_label: string | null;
  cta_url: string | null;
  links: ProfileLink[];
  updated_at: string;
  // Owner's privacy toggles for the public card + vCard (0022).
  show_email: boolean;
  show_phone: boolean;
};

// What anyone tapping a card may see — returned by get_public_profile()
// (0022). No user_id; email/phone already blanked if the owner hid them.
export type PublicProfile = Omit<Profile, "user_id" | "show_email" | "show_phone">;

export type PortfolioItem = {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  tech: string | null;
  sort_order: number;
  created_at: string;
};

export type FeedbackCategory = "bug" | "feature" | "general";
export type FeedbackStatus = "new" | "reviewed" | "resolved";

export type Feedback = {
  id: string;
  user_id: string | null;
  category: FeedbackCategory;
  message: string;
  rating: number | null;
  screenshot_url: string | null;
  page_path: string | null;
  status: FeedbackStatus;
  created_at: string;
};

export type CardOrderStatus =
  | "new"
  | "contacted"
  | "fulfilled"
  | "cancelled"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered";
export type PaymentMethod = "cod" | "gcash" | "cash";
// How the money actually arrived (0021).
export type PaidVia = "cash" | "gcash" | "bank" | "courier";
// See supabase/migrations/0020_payments.sql for the lifecycle.
export type PaymentStatus = "unpaid" | "proof_submitted" | "with_courier" | "paid" | "refunded";

export type CardOrder = {
  id: string;
  finish: "obsidian" | "frost" | "titanium" | "linen" | "aurora";
  quantity: number;
  full_name: string;
  phone: string;
  email: string | null;
  address: string;
  payment_method: PaymentMethod;
  notes: string | null;
  status: CardOrderStatus;
  user_id: string | null;
  courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  activation_reminder_sent_at: string | null;
  created_at: string;
  amount_due_php: number | null;
  discount_pct: number | null;
  payment_status: PaymentStatus;
  amount_received_php: number | null;
  paid_at: string | null;
  paid_confirmed_by: string | null;
  paid_via: PaidVia | null;
  gcash_reference: string | null;
  payment_proof_path: string | null;
  proof_submitted_at: string | null;
  payment_note: string | null;
};

export type LandingTestimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  rating: number;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type ProfileTestimonial = {
  id: string;
  profile_id: string;
  author_name: string | null;
  rating: number;
  message: string;
  approved: boolean;
  created_at: string;
};

export type Tag = {
  tag_id: string;
  claimed: boolean;
  enabled: boolean;
  profile_id: string | null;
  claimed_at: string | null;
  created_at: string;
  order_id: string | null;
  tag_uid: string | null;
  written_at: string | null;
  shipped_at: string | null;
  activated_at: string | null;
};

export type TagBatch = {
  id: string;
  count: number;
  note: string | null;
  created_at: string;
};

export type KeychainOrderStatus =
  | "pending"
  | "social_links_submitted"
  | "links_verified"
  | "ready_for_programming"
  | "programming"
  | "nfc_programmed"
  | "nfc_tested"
  | "qc_passed"
  | "ready_for_handover"
  | "handed_over"
  | "completed";

export type KeychainPlatform = "facebook" | "instagram" | "tiktok";

export type KeychainNfcStatus =
  | "pending_programming"
  | "programming"
  | "programmed"
  | "tested"
  | "failed";

export type KeychainOrder = {
  id: string;
  customer_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  status: KeychainOrderStatus;
  handed_over_at: string | null;
  handed_over_by: string | null;
  created_at: string;
};

export type KeychainItem = {
  id: string;
  order_id: string;
  platform: KeychainPlatform;
  account_label: string | null;
  profile_url: string;
  nfc_status: KeychainNfcStatus;
  tag_uid: string | null;
  programmed_at: string | null;
  programmed_by: string | null;
  tested_at: string | null;
  qc_passed: boolean;
  qc_passed_at: string | null;
  qc_passed_by: string | null;
  created_at: string;
};

// Admin-only money tracking (0023).
export type BillCategory = "ktlo" | "dev" | "marketing" | "other";
export type ExpenseCategory = BillCategory | "cogs" | "fees";

export type FinanceBill = {
  id: string;
  vendor: string;
  category: BillCategory;
  currency: "USD" | "PHP";
  amount: number;
  billing_interval: "monthly" | "yearly";
  active: boolean;
  note: string | null;
  created_at: string;
};

export type FinanceExpense = {
  id: string;
  bill_id: string | null;
  category: ExpenseCategory;
  description: string;
  amount_php: number;
  paid_on: string; // YYYY-MM-DD, Manila
  created_by: string | null;
  created_at: string;
};

export type FinanceSettings = {
  id: boolean;
  usd_php_rate: number;
  reserve_balance_php: number;
  reserve_per_card_php: number;
  reserve_target_months: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      finance_bills: {
        Row: FinanceBill;
        Insert: Pick<FinanceBill, "vendor" | "category" | "amount"> & Partial<FinanceBill>;
        Update: Partial<FinanceBill>;
        Relationships: [];
      };
      finance_expenses: {
        Row: FinanceExpense;
        Insert: Pick<FinanceExpense, "category" | "description" | "amount_php"> &
          Partial<FinanceExpense>;
        Update: Partial<FinanceExpense>;
        Relationships: [];
      };
      finance_settings: {
        Row: FinanceSettings;
        Insert: Partial<FinanceSettings>;
        Update: Partial<FinanceSettings>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { user_id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      tags: {
        Row: Tag;
        Insert: Pick<Tag, "tag_id"> & Partial<Tag>;
        Update: Partial<Tag>;
        Relationships: [];
      };
      tag_batches: {
        Row: TagBatch;
        Insert: Pick<TagBatch, "count"> & Partial<TagBatch>;
        Update: Partial<TagBatch>;
        Relationships: [];
      };
      keychain_orders: {
        Row: KeychainOrder;
        Insert: Pick<KeychainOrder, "customer_name"> & Partial<KeychainOrder>;
        Update: Partial<KeychainOrder>;
        Relationships: [];
      };
      keychain_items: {
        Row: KeychainItem;
        Insert: Pick<KeychainItem, "order_id" | "platform" | "profile_url"> &
          Partial<KeychainItem>;
        Update: Partial<KeychainItem>;
        Relationships: [];
      };
      portfolio_items: {
        Row: PortfolioItem;
        Insert: Pick<PortfolioItem, "profile_id" | "title"> & Partial<PortfolioItem>;
        Update: Partial<PortfolioItem>;
        Relationships: [];
      };
      feedback: {
        Row: Feedback;
        Insert: Pick<Feedback, "category" | "message"> & Partial<Feedback>;
        Update: Partial<Feedback>;
        Relationships: [];
      };
      card_orders: {
        Row: CardOrder;
        Insert: Omit<
          CardOrder,
          | "id"
          | "status"
          | "created_at"
          | "user_id"
          | "courier"
          | "tracking_number"
          | "shipped_at"
          | "delivered_at"
          | "activation_reminder_sent_at"
          | "amount_due_php"
          | "discount_pct"
          | "payment_status"
          | "amount_received_php"
          | "paid_at"
          | "paid_confirmed_by"
          | "paid_via"
          | "gcash_reference"
          | "payment_proof_path"
          | "proof_submitted_at"
          | "payment_note"
        > & { id?: string };
        Update: Partial<CardOrder>;
        Relationships: [];
      };
      landing_testimonials: {
        Row: LandingTestimonial;
        Insert: Pick<LandingTestimonial, "author_name" | "quote"> & Partial<LandingTestimonial>;
        Update: Partial<LandingTestimonial>;
        Relationships: [];
      };
      profile_testimonials: {
        Row: ProfileTestimonial;
        Insert: Pick<ProfileTestimonial, "profile_id" | "rating" | "message"> &
          Partial<ProfileTestimonial>;
        Update: Partial<ProfileTestimonial>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      tag_status: {
        Args: { p_tag_id: string };
        Returns: "unclaimed" | "disabled" | "active" | null;
      };
      get_tag_profile: {
        Args: { p_tag_id: string };
        Returns: string | null;
      };
      claim_tag: {
        Args: { p_tag_id: string; p_pin?: string | null };
        Returns: boolean;
      };
      verify_tag_pin: {
        Args: { p_tag_id: string; p_pin: string };
        Returns: { full_name: string | null; email: string | null; phone: string | null }[];
      };
      tag_needs_pin: {
        Args: { p_tag_id: string };
        Returns: boolean | null;
      };
      assign_tags_to_order: {
        Args: { p_order_id: string; p_count: number };
        Returns: { tag_id: string; pin: string }[];
      };
      lookup_order: {
        Args: { p_reference: string; p_phone: string };
        Returns: {
          status: string;
          finish: string;
          quantity: number;
          courier: string | null;
          tracking_number: string | null;
          created_at: string;
          shipped_at: string | null;
          delivered_at: string | null;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          amount_due_php: number | null;
          payment_note: string | null;
        }[];
      };
      reset_tag_pin: {
        Args: { p_tag_id: string };
        Returns: string;
      };
      tag_pin_state: {
        Args: { p_tag_id: string };
        Returns: {
          state: "claimed" | "no_pin" | "locked" | "ok";
          attempts_left: number;
          locked_minutes: number;
        }[];
      };
      get_public_profile: {
        Args: { p_tag_id: string };
        Returns: PublicProfile[];
      };
      get_public_portfolio: {
        Args: { p_tag_id: string };
        Returns: PortfolioItem[];
      };
      get_public_testimonials: {
        Args: { p_tag_id: string };
        Returns: ProfileTestimonial[];
      };
      rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number };
        Returns: boolean;
      };
      purge_old_data: {
        Args: Record<string, never>;
        Returns: { bucket: string; path: string }[];
      };
      submit_payment_proof: {
        Args: { p_reference: string; p_phone: string; p_gcash_ref: string; p_proof_path: string | null };
        Returns: string | null;
      };
      set_tag_enabled: {
        Args: { p_tag_id: string; p_enabled: boolean };
        Returns: boolean;
      };
      claimed_tag_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      record_tag_view: {
        Args: { p_tag_id: string };
        Returns: undefined;
      };
      recent_tag_view_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      average_feedback_rating: {
        Args: Record<string, never>;
        Returns: number | null;
      };
      feedback_rating_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      is_device_trusted: {
        Args: { p_device_id: string };
        Returns: boolean;
      };
      store_login_pin: {
        Args: Record<string, never>;
        Returns: string;
      };
      verify_login_pin: {
        Args: { p_device_id: string; p_pin: string };
        Returns: boolean;
      };
      submit_keychain_order: {
        Args: {
          p_customer_name: string;
          p_contact_phone: string | null;
          p_contact_email: string | null;
          p_items: { platform: KeychainPlatform; profile_url: string; account_label?: string }[];
        };
        Returns: string;
      };
    };
  };
};
