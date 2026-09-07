/** Shape returned by `crm.api.session.me` on the Frappe backend. */
export interface CurrentUser {
  /** Frappe user id (the login email). */
  user: string;
  email: string;
  full_name: string;
  /** Absolute or site-relative avatar URL, or null when unset. */
  user_image: string | null;
  roles: string[];
  /** Canonical CRM profile slug, e.g. "sales" / "admissions_director". */
  crm_profile: string | null;
  /** Human-readable CRM role label. */
  crm_role: string | null;
  crm_capabilities: string[];
  /** Session-bound token required by Frappe for authenticated write requests. */
  csrf_token: string | null;
}

export interface SessionUser {
  name: string;
  email: string;
  full_name: string;
  roles: string[];
  crm_profile: string | null;
}

/** Raw `frappe.whitelist` envelope: the payload sits under `message`. */
export interface FrappeMessage<T> {
  message?: T;
}
