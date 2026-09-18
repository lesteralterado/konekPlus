export type Socials = Record<string, string>;

export type ProfileTemplate = "classic" | "editorial" | "minimal";

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
  updated_at: string;
};

export type Tag = {
  tag_id: string;
  claimed: boolean;
  enabled: boolean;
  profile_id: string | null;
  claimed_at: string | null;
  created_at: string;
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

export type Database = {
  public: {
    Tables: {
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
        Args: { p_tag_id: string };
        Returns: boolean;
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
