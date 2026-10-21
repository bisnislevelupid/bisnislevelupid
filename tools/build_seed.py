#!/usr/bin/env python3
"""Generate drizzle/seed_question_bank.sql from bank-soal/parsed JSON. Does NOT touch any DB.

Input (not committed): bank-soal/parsed/audit_1_2.json and the three sibling audits.
Output: drizzle/seed_question_bank.sql, plus refreshed JSON/CSV under bank-soal/parsed/.
"""
import json, os, csv, re, hashlib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "bank-soal", "parsed")
SEED = os.path.join(ROOT, "drizzle")
CODES = ['audit_1_2', 'audit_2_3', 'audit_3_4', 'audit_4_5']

SECTION_NAMES = {
 'audit_1_2': {'A':'Produksi / Operasi','B':'Sales & Marketing','C':'Keuangan & Akuntansi',
   'D':'Kepatuhan Dasar — Pajak, Legal, BPJS (2026, Bertahap)','E':'Sumber Daya Manusia','F':'Manajemen',
   'G':'R&D & Budaya Kerja','H':'Kepemimpinan, SDM & Syariah'},
 'audit_2_3': {'A':'Produksi / Operasi','B':'Marketing & Penjualan','C':'Keuangan & Akuntansi',
   'D':'Kepatuhan — Pajak, Ketenagakerjaan, BPJS (2026)','E':'Sumber Daya Manusia','F':'Manajemen & Sistem',
   'G':'Sistem Informasi & IT','H':'R&D / Inovasi & Budaya Kerja','I':'Kepemimpinan & Talent'},
 'audit_3_4': {'A':'Produksi / Operasi (Sistem Matang)','B':'Marketing & Penjualan','C':'Keuangan & Akuntansi (Cash Ready)',
   'D':'Kepatuhan 2026 (Korporat)','E':'Human Capital (People Ready)',
   'F':'Manajemen, Koordinasi & Tata Kelola (Inti Krisis Kontrol)','G':'Sistem Informasi & IT (System Ready)',
   'H':'Kepemimpinan & Talent','I':'R&D / Inovasi','J':'Syariah & Kepemimpinan Muslim'},
 'audit_4_5': {'A':'Lean Again — De-Birokratisasi (Jantung Fase Ini)','B':'Operasi & Mutu pada Skala (Siap Digandakan)',
   'C':'Keuangan — Ketahanan & Modal Ekspansi','D':'Kepatuhan 2026 (Ekspansi)','E':'Kepemimpinan Terdistribusi & Talent',
   'F':'Ekspansi & Aliansi','G':'Identitas & Nilai (Krisis Identitas — Jaga "Dua Warisan")',
   'H':'Sistem Informasi (Mendukung Desentralisasi)','I':'Syariah & Kepemimpinan Muslim'},
}
AUDIT_NAMES = {
 'audit_1_2': 'Audit Manajemen Fase 1 ke 2: Survival "Cari Makan" → Cash Growth "Cari Duit"',
 'audit_2_3': 'Audit Manajemen Fase 2 ke 3: Cash Growth "Cari Duit" → Systemize "Bangun Sistem"',
 'audit_3_4': 'Audit Manajemen Fase 3 ke 4: Systemize "Bangun Sistem" → Talent Building "Cari Talent"',
 'audit_4_5': 'Audit Manajemen Fase 4 ke 5: Talent Building "Cari Talent" → Expansion "Ekspansi"',
}
# Explicitly conditional items (text states the condition). Others with conditional wording are review-only.
CONDITIONAL = {
 ('audit_1_2', 47): 'Jika omzet ≤ Rp4,8 M & berbentuk orang pribadi/PT Perorangan',
 ('audit_1_2', 52): 'Begitu ada karyawan pertama',
 ('audit_2_3', 88): 'Wajib bila ≥10 pekerja',
 ('audit_2_3', 143): 'Jika tak punya R&D sendiri',
 ('audit_3_4', 19): 'Bila skala menuntut',
 ('audit_3_4', 24): 'Bila ada transaksi afiliasi/grup',
 ('audit_3_4', 32): 'Bila berizin via OSS',
 ('audit_4_5', 20): 'Bila pangsa/akuisisi menjadi besar',
}
REVIEW_CONDITIONAL = {
 ('audit_1_2', 2): 'Alternatif "jika disuplai/kerjasama" — bukan N/A, tapi dua pertanyaan dalam satu butir',
 ('audit_1_2', 82): 'Mengandaikan sudah ada SDM; owner solo di fase 1 tidak bisa menjawab',
 ('audit_2_3', 79): '★ — hanya relevan bagi PT dengan omzet >Rp4,8 M',
 ('audit_2_3', 80): 'Hanya relevan bila sudah PKP',
 ('audit_3_4', 21): '★ — hanya relevan bagi Wajib Pajak badan',
 ('audit_3_4', 22): 'Hanya relevan bila sudah PKP',
 ('audit_4_5', 18): 'Hanya relevan bila multi-entitas/holding',
 ('audit_4_5', 19): 'Hanya relevan bila memakai model waralaba/kemitraan',
 ('audit_4_5', 23): 'Hanya relevan bila ekspansi lintas daerah/negara',
}

def q(s):
    if s is None: return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"
def b(x): return 'true' if x else 'false'

def build():
    audits = {c: json.load(open(os.path.join(P, f'{c}.json'))) for c in CODES}
    sec_rows, q_rows, totals = [], [], {}
    for c in CODES:
        d = audits[c]
        qs = d['questions']
        totals[c] = (len(qs), sum(x['is_key'] for x in qs))
        for i, s in enumerate(d['sections'], 1):
            sq = [x for x in qs if x['section_code'] == s['code']]
            name = SECTION_NAMES[c][s['code']]
            assert len(name) <= 100, name
            subs = s['subsections']
            sub_name = None; desc_parts = []
            if len(subs) == 1 and subs[0]['name'].lower() != name.lower():
                sub_name = subs[0]['name']
            elif len(subs) > 1:
                parts = []
                for sb in subs:
                    nums = [x['question_number'] for x in sq if x['subsection_code'] == sb['code'] and x['subsection_name'] == sb['name']]
                    parts.append(f"{sb['code']}. {sb['name']} (butir {nums[0]}–{nums[-1]})" if len(nums) > 1 else f"{sb['code']}. {sb['name']} (butir {nums[0]})")
                desc_parts.append('Sub-seksi: ' + ' · '.join(parts))
            for n in s['notes']:
                desc_parts.append(n['text'])
            assert sub_name is None or len(sub_name) <= 100
            s.update(db_name=name, db_sub_name=sub_name, db_description='\n'.join(desc_parts) or None, db_sort_order=i,
                     n_questions=len(sq), n_key=sum(x['is_key'] for x in sq))
            sec_rows.append((c, s['code'], name, sub_name, s['db_description'], i))
        for x in qs:
            k = (c, x['question_number'])
            cond = CONDITIONAL.get(k)
            x.update(is_conditional=bool(cond), condition_text=cond, has_not_applicable=bool(cond),
                     review_conditional=REVIEW_CONDITIONAL.get(k), weight=1.00, sort_order=x['question_number'])
            assert cond is None or len(cond) <= 255
            q_rows.append(x)
        json.dump(d, open(os.path.join(P, f'{c}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        cols = ['audit_code','section_code','section_name','subsection_code','subsection_name','question_number','question_text',
                'is_key','is_added','is_conditional','condition_text','has_not_applicable','review_conditional','guidance_text','row','cell_ref']
        secname = {s['code']: s['db_name'] for s in d['sections']}
        with open(os.path.join(P, f'{c}.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore'); w.writeheader()
            for x in qs: w.writerow({**x, 'section_name': secname[x['section_code']]})
    # combined
    allq = [x for c in CODES for x in audits[c]['questions']]
    json.dump({'audits': [{k: audits[c][k] for k in ('code','file','from_phase','to_phase','title','gate_text','gate_cell','scoring_text','scoring_cell','header_fields')}
                          | {'name': AUDIT_NAMES[c], 'total_questions': totals[c][0], 'total_key_questions': totals[c][1],
                             'sections': [{k: s[k] for k in ('code','cell','title_raw','db_name','db_sub_name','db_description','db_sort_order','n_questions','n_key','subsections','notes')} for s in audits[c]['sections']]}
                          for c in CODES],
               'questions': allq}, open(os.path.join(P, 'question_bank_all.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    L = []
    w = L.append
    src = ', '.join(f"{c}={audits[c]['file']}" for c in CODES)
    w('-- ============================================================================')
    w('-- seed_question_bank.sql — BisnisLevelUp.id audit question bank (362 butir)')
    w('-- GENERATED by tools/build_seed.py from bank-soal/parsed/*.json. Do not hand-edit; regenerate.')
    w(f'-- Sources: {src}')
    w('-- Idempotent: INSERT ... ON CONFLICT DO UPDATE on natural keys:')
    w('--   phases(phase_number) · audit_transitions(code) · test_sections(audit_transition_id, code)')
    w('--   test_questions(audit_transition_id, question_number)  <-- needs unique index from')
    w('--   drizzle/0002_test_questions_natural_key.sql (run that migration first; guard below aborts otherwise).')
    w('-- Does NOT touch recommendation_library / recommendation_triggers (xlsx has no recommendation data).')
    w('-- Run: npm run db:seed:questions')
    w('--      or: npx tsx scripts/db.ts drizzle/seed_question_bank.sql')
    w('--      or: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/seed_question_bank.sql')
    w('-- Whole file runs in one transaction; any failed check rolls everything back.')
    w('-- ============================================================================')
    w('BEGIN;')
    w('')
    w('-- 0. Guard: natural-key unique index on test_questions must exist')
    w("DO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM pg_index i\n    JOIN pg_class t ON t.oid = i.indrelid AND t.relname = 'test_questions'\n    JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'\n    WHERE i.indisunique\n      AND (SELECT array_agg(a.attname::text ORDER BY a.attname::text) FROM pg_attribute a\n           WHERE a.attrelid = t.oid AND a.attnum = ANY(i.indkey)) = ARRAY['audit_transition_id','question_number']\n  ) THEN\n    RAISE EXCEPTION 'Missing UNIQUE (audit_transition_id, question_number) on test_questions. Run drizzle/0002_test_questions_natural_key.sql first.';\n  END IF;\nEND $$;")
    w('')
    w('-- 1. phases (canonical fields updated; descriptive text only set on first insert)')
    phases = [
     (1,'SURVIVAL','Survival','Cari Makan','Krisis Kepemimpinan','Owner mengerjakan hampir semuanya sendiri.','Fase paling awal. Buktikan model bisnis berulang dan pisahkan keuangan pribadi.','seedling','#EF4444'),
     (2,'CASH_GROWTH','Cash Growth','Cari Duit','Krisis Otonomi','Kendali owner mulai mencekik orang yang lebih ahli.','Omset berulang. Delegasikan dan tumbuhkan profit.','trending-up','#F97316'),
     (3,'SYSTEMIZE','Systemize','Bangun Sistem','Krisis Kontrol','Delegasi melahirkan silo.','SOP dan dashboard menjadi prioritas.','cog','#EAB308'),
     (4,'TALENT_BUILDING','Talent Building','Cari Talent','Krisis Birokrasi','Sistem berubah jadi birokrasi.','Bangun pipeline talent.','users','#3B82F6'),
     (5,'EXPANSION','Expansion','Ekspansi','Krisis Identitas','Nilai inti bisa tergerus saat skala bertambah.','Gandakan bisnis tanpa kehilangan identitas.','globe','#8B5CF6')]
    w('INSERT INTO phases (phase_number, code, name_short, name_label, crisis_title, crisis_desc, description, icon_key, color_hex, sort_order) VALUES')
    w(',\n'.join(f"  ({p[0]}, {q(p[1])}, {q(p[2])}, {q(p[3])}, {q(p[4])}, {q(p[5])}, {q(p[6])}, {q(p[7])}, {q(p[8])}, {p[0]})" for p in phases))
    w('ON CONFLICT (phase_number) DO UPDATE SET\n  code = EXCLUDED.code, name_short = EXCLUDED.name_short, name_label = EXCLUDED.name_label,\n  crisis_title = EXCLUDED.crisis_title, sort_order = EXCLUDED.sort_order;')
    w('')
    w('-- 2. audit_transitions (gate_desc = ⚑ gate row of each sheet; totals recomputed in step 6)')
    w('INSERT INTO audit_transitions (code, from_phase_id, to_phase_id, name, gate_desc, total_questions, total_key_questions, passing_score, is_active, sort_order)')
    w('SELECT v.code, fp.id, tp.id, v.name, v.gate_desc, v.total_q, v.total_k, 80.00, true, v.sort_order\nFROM (VALUES')
    vals = []
    for i, c in enumerate(CODES, 1):
        d = audits[c]
        gate = re.sub(r'^⚑\s*', '', d['gate_text'])
        vals.append(f"  ({q(c)}, {d['from_phase']}, {d['to_phase']}, {q(AUDIT_NAMES[c])},\n   {q(gate)},\n   {totals[c][0]}, {totals[c][1]}, {i})")
    w(',\n'.join(vals))
    w(') AS v(code, from_n, to_n, name, gate_desc, total_q, total_k, sort_order)\nJOIN phases fp ON fp.phase_number = v.from_n\nJOIN phases tp ON tp.phase_number = v.to_n')
    w('ON CONFLICT (code) DO UPDATE SET\n  from_phase_id = EXCLUDED.from_phase_id, to_phase_id = EXCLUDED.to_phase_id, name = EXCLUDED.name,\n  gate_desc = EXCLUDED.gate_desc, total_questions = EXCLUDED.total_questions,\n  total_key_questions = EXCLUDED.total_key_questions, passing_score = EXCLUDED.passing_score,\n  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;')
    w('')
    w(f'-- 3. test_sections ({len(sec_rows)} rows)')
    w('INSERT INTO test_sections (audit_transition_id, code, name, sub_name, description, sort_order)')
    w('SELECT a.id, v.code, v.name, v.sub_name, v.description, v.sort_order\nFROM (VALUES')
    w(',\n'.join(f"  ({q(r[0])}, {q(r[1])}, {q(r[2])}, {q(r[3])}{'::varchar' if r[3] is None else ''}, {q(r[4])}{'::text' if r[4] is None else ''}, {r[5]})" for r in sec_rows))
    w(') AS v(audit_code, code, name, sub_name, description, sort_order)\nJOIN audit_transitions a ON a.code = v.audit_code')
    w('ON CONFLICT (audit_transition_id, code) DO UPDATE SET\n  name = EXCLUDED.name, sub_name = EXCLUDED.sub_name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;')
    w('')
    w(f'-- 4. test_questions ({len(q_rows)} rows). Columns: audit, section, no, text, guidance, is_key, is_conditional, condition_text, has_not_applicable, is_added, weight, sort_order')
    w('INSERT INTO test_questions (audit_transition_id, section_id, question_number, question_text, guidance_text, is_key,\n  is_conditional, condition_text, has_not_applicable, is_added, weight, sort_order, is_active)')
    w('SELECT a.id, s.id, v.question_number, v.question_text, v.guidance_text, v.is_key,\n  v.is_conditional, v.condition_text, v.has_not_applicable, v.is_added, v.weight, v.sort_order, true\nFROM (VALUES')
    rows = []
    for i, x in enumerate(q_rows):
        cast = (i == 0)
        g = q(x['guidance_text']) + ('::text' if cast else '')
        ct = q(x['condition_text']) + ('::varchar' if cast else '')
        rows.append(f"  ({q(x['audit_code'])}, {q(x['section_code'])}, {x['question_number']}{'::smallint' if cast else ''}, {q(x['question_text'])}, {g}, {b(x['is_key'])}, {b(x['is_conditional'])}, {ct}, {b(x['has_not_applicable'])}, {b(x['is_added'])}, 1.00{'::numeric' if cast else ''}, {x['sort_order']}{'::smallint' if cast else ''})")
    w(',\n'.join(rows))
    w(') AS v(audit_code, section_code, question_number, question_text, guidance_text, is_key, is_conditional, condition_text, has_not_applicable, is_added, weight, sort_order)\nJOIN audit_transitions a ON a.code = v.audit_code\nJOIN test_sections s ON s.audit_transition_id = a.id AND s.code = v.section_code')
    w('ON CONFLICT (audit_transition_id, question_number) DO UPDATE SET\n  section_id = EXCLUDED.section_id, question_text = EXCLUDED.question_text, guidance_text = EXCLUDED.guidance_text,\n  is_key = EXCLUDED.is_key, is_conditional = EXCLUDED.is_conditional, condition_text = EXCLUDED.condition_text,\n  has_not_applicable = EXCLUDED.has_not_applicable, is_added = EXCLUDED.is_added, weight = EXCLUDED.weight,\n  sort_order = EXCLUDED.sort_order, is_active = true;')
    w('')
    w('-- 5. Retire rows not in the xlsx (soft: is_active=false; never DELETE — test_answers FK is RESTRICT)')
    keys = ', '.join(f"({q(c)}, {n})" for c in CODES for n in range(1, totals[c][0] + 1))
    w("UPDATE test_questions tq SET is_active = false\nFROM audit_transitions a\nWHERE tq.audit_transition_id = a.id\n  AND a.code IN ('audit_1_2','audit_2_3','audit_3_4','audit_4_5')\n  AND tq.is_active\n  AND (a.code, tq.question_number) NOT IN (SELECT * FROM (VALUES " + keys + ") AS k(code, n));")
    w('-- Sections not present in xlsx are left as-is but reported by the checks below (none expected).')
    w('')
    w('-- 6. Recompute audit_transitions totals from active rows')
    w('UPDATE audit_transitions a SET\n  total_questions     = c.n,\n  total_key_questions = c.k\nFROM (SELECT audit_transition_id, count(*)::smallint AS n, count(*) FILTER (WHERE is_key)::smallint AS k\n      FROM test_questions WHERE is_active GROUP BY audit_transition_id) c\nWHERE c.audit_transition_id = a.id;')
    w('')
    w('-- 7. Post-conditions (abort + rollback on any mismatch)')
    exp = ' UNION ALL '.join(f"SELECT {q(c)} AS code, {totals[c][0]} AS n, {totals[c][1]} AS k, {len(audits[c]['sections'])} AS s" for c in CODES)
    w("DO $$\nDECLARE r record;\nBEGIN\n  FOR r IN\n    WITH exp AS (" + exp + ")\n    SELECT e.code, e.n, e.k, e.s,\n      (SELECT count(*) FROM test_questions tq WHERE tq.audit_transition_id = a.id AND tq.is_active) AS got_n,\n      (SELECT count(*) FROM test_questions tq WHERE tq.audit_transition_id = a.id AND tq.is_active AND tq.is_key) AS got_k,\n      (SELECT count(*) FROM test_sections ts WHERE ts.audit_transition_id = a.id) AS got_s,\n      (SELECT count(*) FROM test_questions tq JOIN test_sections ts ON ts.id = tq.section_id\n        WHERE tq.audit_transition_id = a.id AND ts.audit_transition_id <> a.id) AS cross_links\n    FROM exp e LEFT JOIN audit_transitions a ON a.code = e.code\n  LOOP\n    IF r.got_n <> r.n OR r.got_k <> r.k OR r.got_s <> r.s OR r.cross_links <> 0 THEN\n      RAISE EXCEPTION 'Seed check failed for %: questions %/% key %/% sections %/% cross-links %',\n        r.code, r.got_n, r.n, r.got_k, r.k, r.got_s, r.s, r.cross_links;\n    END IF;\n  END LOOP;\nEND $$;")
    w('')
    w('-- 8. Sequence reset (ERD Catatan Implementasi §1; COALESCE-safe for empty tables)')
    for t in ['phases', 'audit_transitions', 'test_sections', 'test_questions']:
        w(f"SELECT setval('{t}_id_seq', COALESCE((SELECT MAX(id) FROM {t}), 1), (SELECT MAX(id) FROM {t}) IS NOT NULL);")
    w('')
    w('COMMIT;')
    sql = '\n'.join(L) + '\n'
    open(os.path.join(SEED, 'seed_question_bank.sql'), 'w', encoding='utf-8').write(sql)
    print('wrote seed', len(sql), 'bytes; sections', len(sec_rows), 'questions', len(q_rows), 'totals', totals,
          'sha256', hashlib.sha256(sql.encode()).hexdigest()[:16])

if __name__ == '__main__':
    build()
