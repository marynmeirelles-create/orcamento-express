const OrcamentoWhatsApp = {
  normalize(value) {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (raw.startsWith("+")) return "+" + digits;
    if (digits.length === 10 || digits.length === 11) return "+55" + digits;
    return "+" + digits;
  },
  open(text, phone) {
    const digits = this.normalize(phone).replace(/\D/g, "");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
};
