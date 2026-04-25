const express = require("express");
const { executeOperationsQuery } = require("../db/operations");

const router = express.Router();

router.get("/tickets", async (req, res) => {
  try {
    const driverId = (req.query.driverId || "").trim();

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    const sql = `
      WITH resolution_cte AS (
          SELECT 
              t2.parent_id AS parent_task_id,
              STRING_AGG(r.name, ', ') AS resolution
          FROM tasks t2
          JOIN resolutions_tasks rt 
               ON rt.task_id = t2.id
          JOIN resolutions r 
               ON r.id = rt.resolution_id
          WHERE t2.type = 'Tasks::SelectResolution'
          GROUP BY t2.parent_id
      ),
      log_cte AS (
          SELECT DISTINCT ON (loggable_id)
              loggable_id,
              metadata::json ->> 'call_outcome' AS call_outcome,
              done_by,
              metadata::json ->> 'source' AS source,
              created_at + interval '330 minutes' AS logs_created_at
          FROM logs
          WHERE metadata::json ->> 'call_outcome' IS NOT NULL
          ORDER BY loggable_id, created_at DESC
      ),
      base_cte AS (
          SELECT DISTINCT
              t.slug                                   AS ticket_slug,
              t.complainant_id,
              ic.name                                  AS issue_category,
              i.name                                   AS issue,
              l.call_outcome,
              l.done_by,
              l.source,
              t.created_at + interval '330 minutes'    AS ticket_created_at,
              l.logs_created_at,
              ts.status,
              ts.assignee_employee_id,
              t.zone,
              rc.resolution
          FROM tickets t
          JOIN tasks ts 
               ON ts.id = t.task_id
              AND ts.status != 'created'
          LEFT JOIN resolution_cte rc
               ON rc.parent_task_id = ts.id
          LEFT JOIN log_cte l
               ON l.loggable_id = ts.id
          JOIN issues i 
               ON i.id = t.issue_id
          JOIN issue_categories ic 
               ON ic.id = i.issue_category_id
          JOIN issue_assignment_rules iar 
               ON iar.issue_id = t.issue_id
          JOIN tickets_assignment_rules_team_roles tatr 
               ON tatr.id = iar.assignment_rule_id
              AND iar.assignment_rule_type LIKE '%TeamRole%'
              AND (tatr.team LIKE '%Diag%' OR tatr.team LIKE '%F-Ops%')
          WHERE t.created_at >= now() - interval '60 days'
            AND t.complainant_id = $1
      ),
      repeat_cte AS (
          SELECT *,
              LEAD(ticket_created_at) OVER (
                  PARTITION BY complainant_id, issue
                  ORDER BY ticket_created_at
              ) AS next_ticket_date,
              LEAD(ticket_slug) OVER (
                  PARTITION BY complainant_id, issue
                  ORDER BY ticket_created_at
              ) AS next_ticket_slug
          FROM base_cte
      )
      SELECT 
          ticket_slug,
          complainant_id,
          issue_category,
          issue,
          call_outcome,
          done_by,
          source,
          ticket_created_at,
          logs_created_at,
          status,
          assignee_employee_id,
          zone,
          resolution,
          CASE 
              WHEN status IN ('completed','qc_passed','qc_failed') 
              THEN NULL
              WHEN status = 'assigned'
               AND (call_outcome IS NULL 
                    OR call_outcome IN ('NaN','unable_to_call_retry'))
              THEN 'Remote Diagnosis Team'
              ELSE 'Ground Team'
          END AS owner_of_pendency,
          CASE 
              WHEN (call_outcome IS NULL 
                    OR call_outcome IN ('NaN','unable_to_call_retry'))
               AND status IN ('completed','qc_passed','qc_failed')
              THEN 1
              ELSE 0
          END AS first_failure_remote_diag,
          CASE 
              WHEN status = 'assigned'
               AND (call_outcome IS NULL 
                    OR call_outcome IN ('NaN','unable_to_call_retry'))
              THEN 
                  CASE 
                      WHEN EXTRACT(EPOCH FROM (NOW() - ticket_created_at))/60 <= 30 THEN '0-30 Min'
                      WHEN EXTRACT(EPOCH FROM (NOW() - ticket_created_at))/60 <= 60 THEN '30-60 Min'
                      WHEN EXTRACT(EPOCH FROM (NOW() - ticket_created_at))/60 <= 120 THEN '60-120 Min'
                      WHEN EXTRACT(EPOCH FROM (NOW() - ticket_created_at))/60 <= 180 THEN '120-180 Min'
                      WHEN EXTRACT(EPOCH FROM (NOW() - ticket_created_at))/60 <= 240 THEN '180-240 Min'
                      ELSE '>240 Min'
                  END
              ELSE NULL
          END AS tat_bucket,
          CASE 
              WHEN status IN ('completed','qc_passed','qc_failed')
               AND next_ticket_date IS NOT NULL
               AND next_ticket_slug <> ticket_slug
               AND next_ticket_date <= ticket_created_at + interval '7 days'
              THEN 1
              ELSE 0
          END AS repeat_flag,
          CASE 
              WHEN status IN ('completed','qc_passed','qc_failed')
               AND next_ticket_date IS NOT NULL
               AND next_ticket_slug <> ticket_slug
               AND next_ticket_date <= ticket_created_at + interval '7 days'
              THEN next_ticket_slug
              ELSE NULL
          END AS repeat_ticket_slug
      FROM repeat_cte
      ORDER BY ticket_created_at DESC
    `;

    const rows = await executeOperationsQuery(sql, [driverId]);
    res.json({ data: rows });
  } catch (error) {
    console.error("tickets error:", error.message);
    res.status(500).json({
      error: "Failed to fetch tickets",
      details: error.message,
    });
  }
});

module.exports = router;