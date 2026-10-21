-- verify_question_bank.sql — READ-ONLY checks to run after seeding (SELECT only).
-- 1) Totals per audit (expect 92/13, 161/18, 63/16, 46/9; sections 8/9/10/9)
SELECT a.code, a.total_questions, a.total_key_questions,
       count(q.id) FILTER (WHERE q.is_active)                 AS active_q,
       count(q.id) FILTER (WHERE q.is_active AND q.is_key)    AS active_key,
       count(q.id) FILTER (WHERE NOT q.is_active)             AS retired_q,
       (SELECT count(*) FROM test_sections s WHERE s.audit_transition_id = a.id) AS sections
FROM audit_transitions a LEFT JOIN test_questions q ON q.audit_transition_id = a.id
GROUP BY a.id ORDER BY a.sort_order;
-- 2) Per-section breakdown
SELECT a.code, s.code AS sec, s.name, count(q.id) AS n, count(q.id) FILTER (WHERE q.is_key) AS key_n,
       count(q.id) FILTER (WHERE NOT q.is_key) AS nonkey_n, min(q.question_number) AS first_no, max(q.question_number) AS last_no
FROM test_sections s JOIN audit_transitions a ON a.id = s.audit_transition_id
LEFT JOIN test_questions q ON q.section_id = s.id AND q.is_active
GROUP BY a.code, a.sort_order, s.code, s.name, s.sort_order ORDER BY a.sort_order, s.sort_order;
-- 3) Integrity: gaps / dup numbers / cross-audit section links (expect 0 rows each)
SELECT a.code, gs AS missing_no FROM audit_transitions a
CROSS JOIN LATERAL generate_series(1, a.total_questions) gs
WHERE NOT EXISTS (SELECT 1 FROM test_questions q WHERE q.audit_transition_id = a.id AND q.question_number = gs AND q.is_active);
SELECT audit_transition_id, question_number, count(*) FROM test_questions GROUP BY 1,2 HAVING count(*) > 1;
SELECT q.id FROM test_questions q JOIN test_sections s ON s.id = q.section_id WHERE s.audit_transition_id <> q.audit_transition_id;
-- 4) Conditional (N/A-able) items
SELECT a.code, q.question_number, q.is_key, q.condition_text FROM test_questions q
JOIN audit_transitions a ON a.id = q.audit_transition_id WHERE q.is_conditional ORDER BY a.sort_order, q.question_number;
-- 5) Sequences vs max(id)
SELECT 'test_questions' t, (SELECT max(id) FROM test_questions) max_id, (SELECT last_value FROM test_questions_id_seq) seq
UNION ALL SELECT 'test_sections', (SELECT max(id) FROM test_sections), (SELECT last_value FROM test_sections_id_seq)
UNION ALL SELECT 'audit_transitions', (SELECT max(id) FROM audit_transitions), (SELECT last_value FROM audit_transitions_id_seq);
