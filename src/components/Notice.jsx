import { CheckCircle2, X } from "lucide-react";

export default function Notice({ message, onClose }) {
  if (!message) return null;

  return (
    <button className="notice" type="button" onClick={onClose}>
      <CheckCircle2 size={18} />
      <span>{message}</span>
      <X size={16} />
    </button>
  );
}
