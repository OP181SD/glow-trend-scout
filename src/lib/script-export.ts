import type { ShootingScript } from "./types";

export function scriptToText(s: ShootingScript, title: string): string {
  const lines = [
    `SCRIPT DE TOURNAGE — ${title}`, "",
    `HOOK (${s.hook.seconds} s)`, `Action : ${s.hook.action}`, `À dire : ${s.hook.texte_oral}`, `À l'écran : ${s.hook.texte_ecran}`, "",
  ];
  for (const sc of s.scenes) {
    lines.push(`SCÈNE ${sc.numero} — ${sc.duree_s} s — ${sc.plan}`, `Action : ${sc.action}`, `À dire : ${sc.texte_oral}`, `À l'écran : ${sc.texte_ecran}`, "");
  }
  lines.push("CTA", `À dire : ${s.cta.texte_oral}`, `À l'écran : ${s.cta.texte_ecran}`, "");
  lines.push("MATÉRIEL", ...s.materiel.map((m) => `- ${m}`), "", "CONSEILS", ...s.conseils.map((c, i) => `${i + 1}. ${c}`));
  return lines.join("\n");
}

export async function scriptToPdf(s: ShootingScript, title: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, maxW = W - 2 * M;
  let y = M;
  const clean = (t: string) => t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, "-");
  const write = (text: string, size = 11, bold = false, gap = 1.5) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const rows = doc.splitTextToSize(clean(text), maxW) as string[];
    for (const r of rows) {
      if (y > 280) { doc.addPage(); y = M; }
      doc.text(r, M, y);
      y += size * 0.45;
    }
    y += gap;
  };
  write(`Script de tournage - ${title}`, 18, true, 4);
  write(`HOOK (${s.hook.seconds} s)`, 13, true);
  write(`Action : ${s.hook.action}`); write(`À dire : ${s.hook.texte_oral}`); write(`À l'écran : ${s.hook.texte_ecran}`, 11, false, 5);
  for (const sc of s.scenes) {
    write(`Scène ${sc.numero} - ${sc.duree_s} s - ${sc.plan}`, 13, true);
    write(`Action : ${sc.action}`); write(`À dire : ${sc.texte_oral}`); write(`À l'écran : ${sc.texte_ecran}`, 11, false, 5);
  }
  write("Appel à l'action", 13, true);
  write(`À dire : ${s.cta.texte_oral}`); write(`À l'écran : ${s.cta.texte_ecran}`, 11, false, 5);
  write("Matériel", 13, true); s.materiel.forEach((m) => write(`- ${m}`, 11, false, 0.5)); y += 4;
  write("Conseils", 13, true); s.conseils.forEach((c, i) => write(`${i + 1}. ${c}`, 11, false, 1));
  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
