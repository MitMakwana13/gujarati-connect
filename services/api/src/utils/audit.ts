/**
 * utils/audit.ts — Audit log helper
 *
 * Every admin/moderation action MUST call auditLog.
 * Audit log is INSERT-only (the DB role has no UPDATE/DELETE).
 * Never log PII in plain text. User IDs are fine. Emails, names, content are not.
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { UserRoleLiteral, TargetTypeLiteral } from '@gujarati-global/types';

export interface AuditLogParams {
  actorId: string;
  actorRole: UserRoleLiteral;
  action: string;
  targetType?: TargetTypeLiteral;
  targetId?: string;
  metadata?: Record<string, unknown>;
  req?: FastifyRequest;
}

export async function auditLog(
  app: FastifyInstance,
  params: AuditLogParams,
): Promise<void> {
  try {
    await app.db.query(
      `INSERT INTO audit_log (actor_id, actor_role, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.actorId,
        params.actorRole,
        params.action,
        params.targetType ?? null,
        params.targetId ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.req?.ip ?? null,
      ],
    );
  } catch (err) {
    // Audit log failure is logged but does NOT fail the request.
    // The application must still function even if audit log write fails.
    // Alert on sustained audit log failures via monitoring.
    app.log.error({ err, action: params.action }, '[audit] FAILED to write audit log entry');
  }
}
