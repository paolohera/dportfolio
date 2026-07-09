export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  const dots = "•".repeat(Math.min(Math.max(local.length - 2, 2), 6));
  return `${visible}${dots}@${domain}`;
}