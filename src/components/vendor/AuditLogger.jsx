import { base44 } from "@/api/base44Client";

export async function logAudit({
  entity_type,
  entity_id,
  action,
  changed_fields = [],
  old_values = {},
  new_values = {},
  vendor_id = null,
  branch_id = null,
  metadata = {}
}) {
  try {
    const user = await base44.auth.me();
    
    await base44.entities.AuditLog.create({
      entity_type,
      entity_id,
      action,
      changed_fields,
      old_values,
      new_values,
      user_id: user.id,
      user_email: user.email,
      vendor_id,
      branch_id,
      ip_address: null, // Browser doesn't expose client IP
      user_agent: navigator.userAgent,
      metadata
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

export function getChangedFields(oldObj, newObj) {
  const changed = [];
  const oldValues = {};
  const newValues = {};
  
  Object.keys(newObj).forEach(key => {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changed.push(key);
      oldValues[key] = oldObj[key];
      newValues[key] = newObj[key];
    }
  });
  
  return { changed_fields: changed, old_values: oldValues, new_values: newValues };
}