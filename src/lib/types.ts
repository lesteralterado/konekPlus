export type Socials = Record<string, string>;

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
    };
  };
};
