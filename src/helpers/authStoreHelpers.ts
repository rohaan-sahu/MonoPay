
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (phone.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function createHandle(name: string) {
  return `@${name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "user"}`;
}

function normalizeTag(tag?: string) {
  const cleaned = tag?.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");

  if (!cleaned) {
    return undefined;
  }

  return `@${cleaned}`;
}

export {
    createHandle,
    isValidEmail,
    normalizeEmail,
    normalizePhone,
    normalizeTag
}