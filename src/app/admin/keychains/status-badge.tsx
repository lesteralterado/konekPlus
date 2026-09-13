import type { KeychainNfcStatus, KeychainOrderStatus } from "@/lib/types";

const ORDER_STATUS_LABEL: Record<KeychainOrderStatus, string> = {
  pending: "Pending",
  social_links_submitted: "Links submitted",
  links_verified: "Links verified",
  ready_for_programming: "Ready for programming",
  programming: "Programming",
  nfc_programmed: "NFC programmed",
  nfc_tested: "NFC tested",
  qc_passed: "QC passed",
  ready_for_handover: "Ready for handover",
  handed_over: "Handed over",
  completed: "Completed",
};

const ORDER_STATUS_CLASS: Record<KeychainOrderStatus, string> = {
  pending: "bg-slate-100 text-slate-500",
  social_links_submitted: "bg-slate-100 text-slate-500",
  links_verified: "bg-brand-50 text-brand-700",
  ready_for_programming: "bg-brand-50 text-brand-700",
  programming: "bg-amber-50 text-amber-700",
  nfc_programmed: "bg-amber-50 text-amber-700",
  nfc_tested: "bg-amber-50 text-amber-700",
  qc_passed: "bg-amber-50 text-amber-700",
  ready_for_handover: "bg-amber-50 text-amber-700",
  handed_over: "bg-brand-50 text-brand-700",
  completed: "bg-brand-50 text-brand-700",
};

export function OrderStatusBadge({ status }: { status: KeychainOrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_CLASS[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

const NFC_STATUS_LABEL: Record<KeychainNfcStatus, string> = {
  pending_programming: "Pending programming",
  programming: "Programming",
  programmed: "Programmed",
  tested: "Tested",
  failed: "Failed",
};

const NFC_STATUS_CLASS: Record<KeychainNfcStatus, string> = {
  pending_programming: "bg-slate-100 text-slate-500",
  programming: "bg-amber-50 text-amber-700",
  programmed: "bg-brand-50 text-brand-700",
  tested: "bg-brand-50 text-brand-700",
  failed: "bg-red-50 text-red-600",
};

export function NfcStatusBadge({ status }: { status: KeychainNfcStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${NFC_STATUS_CLASS[status]}`}
    >
      {NFC_STATUS_LABEL[status]}
    </span>
  );
}
