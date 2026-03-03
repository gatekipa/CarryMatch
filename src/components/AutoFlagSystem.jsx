import { base44 } from "@/api/base44Client";

/**
 * Auto-flag system to monitor and restrict users based on violations
 * Runs periodically to check for users with multiple issues
 */
export const checkAndFlagUsers = async () => {
  try {
    // Get all users
    const users = await base44.entities.User.list();
    
    for (const user of users) {
      // Skip already restricted users
      if (user.is_restricted) continue;
      
      let shouldFlag = false;
      let flagReasons = [];
      
      // Check for multiple PIN violations (2+ = auto-flag)
      if (user.pin_violations >= 2) {
        shouldFlag = true;
        flagReasons.push(`${user.pin_violations} delivery PIN violations`);
      }
      
      // Check for multiple unresolved disputes (3+ = auto-flag)
      if (user.unresolved_dispute_count >= 3) {
        shouldFlag = true;
        flagReasons.push(`${user.unresolved_dispute_count} unresolved disputes`);
      }
      
      // Check trust score (below 25 = auto-flag)
      if (user.trust_score && user.trust_score < 25) {
        shouldFlag = true;
        flagReasons.push(`Low trust score (${user.trust_score}/100)`);
      }
      
      if (shouldFlag && !user.auto_flagged) {
        const flagReason = flagReasons.join(", ");
        
        // Update user with auto-flag
        await base44.entities.User.update(user.id, {
          auto_flagged: true,
          auto_flag_reason: flagReason,
          admin_flags: [...(user.admin_flags || []), "auto-flagged"]
        });
        
        // Notify admins
        const admins = await base44.entities.User.filter({ role: "admin" });
        for (const admin of admins) {
          await base44.entities.Notification.create({
            user_email: admin.email,
            type: "system",
            title: "⚠️ User Auto-Flagged",
            message: `User ${user.email} was automatically flagged: ${flagReason}`,
            priority: "high",
            related_id: user.id,
            related_entity_type: "user"
          });
        }
        
        // Notify the user
        await base44.entities.Notification.create({
          user_email: user.email,
          type: "system",
          title: "⚠️ Account Under Review",
          message: `Your account has been flagged for review due to: ${flagReason}. Our team will review your account shortly.`,
          priority: "high",
          related_entity_type: "user"
        });
        
      }
    }
  } catch (error) {
    console.error("Error in auto-flag system:", error);
  }
};

/**
 * Calculate and update trust scores for all users
 * Based on: completed transactions, ratings, disputes, violations
 */
export const updateTrustScores = async () => {
  try {
    const users = await base44.entities.User.list();
    
    for (const user of users) {
      let score = 50; // Base score
      
      // Positive factors
      if (user.is_verified) score += 15;
      if (user.average_rating >= 4.5) score += 15;
      else if (user.average_rating >= 4.0) score += 10;
      else if (user.average_rating >= 3.5) score += 5;
      
      // Activity bonuses
      const totalActivity = (user.total_trips || 0) + (user.total_shipments || 0);
      if (totalActivity >= 20) score += 10;
      else if (totalActivity >= 10) score += 7;
      else if (totalActivity >= 5) score += 5;
      else if (totalActivity >= 1) score += 2;
      
      // Negative factors
      score -= (user.pin_violations || 0) * 10;
      score -= (user.unresolved_dispute_count || 0) * 8;
      score -= (user.dispute_count || 0) * 3;
      
      // Auto-flagged penalty
      if (user.auto_flagged) score -= 15;
      
      // Restricted users get minimum score
      if (user.is_restricted) score = 0;
      
      // Clamp between 0 and 100
      score = Math.max(0, Math.min(100, score));
      
      // Update user's trust score
      await base44.entities.User.update(user.id, {
        trust_score: score
      });
    }
  } catch (error) {
    console.error("Error updating trust scores:", error);
  }
};

export default {
  checkAndFlagUsers,
  updateTrustScores
};