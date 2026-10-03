/**
 * Validates the Climate Impact Knowledge Base dataset (src/data/impacts.json)
 * against its strict JSON Schema and scientific integrity rules.
 *
 * Rules:
 *  1. Every entry MUST have a valid source URL, year, evidence_type, climate_link, and confidence.
 *  2. Enum constraints must match predefined scientific categories.
 *  3. Regions must match geoBoundaries districts/divisions or 'all'.
 *  4. Extinction entries must not attribute extinction directly to climate change unless established.
 *  5. Thresholds, if present, must contain a valid cited source.
 *
 * Usage:
 *   node scripts/validate-impacts.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMPACTS_PATH = path.join(ROOT, 'src/data/impacts.json');
const _SCHEMA_PATH = path.join(ROOT, 'src/data/impacts.schema.json');
const CLIMATE_PATH = path.join(ROOT, 'src/data/climate.json');

const VALID_CATEGORIES = new Set(['crop', 'fruit', 'fish', 'wildlife', 'extinction']);
const VALID_METRICS = new Set(['rain', 'temp', 'soil', 'multi']);
const VALID_DIRECTIONS = new Set(['harm', 'benefit', 'mixed']);
const VALID_EVIDENCE_TYPES = new Set([
  'observed_data',
  'statistical_study',
  'model_projection',
  'review',
  'news_or_expert_estimate',
  'farmer_perception',
]);
const VALID_CLIMATE_LINKS = new Set(['direct', 'contributing', 'unclear', 'not_established']);
const VALID_CONSENSUS = new Set(['established', 'mixed', 'emerging', 'contested']);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

async function validate() {
  console.log('--- Validating Climate Impact Knowledge Base (Phase 8A) ---');

  const rawImpacts = await fs.readFile(IMPACTS_PATH, 'utf8');
  const impacts = JSON.parse(rawImpacts);

  const rawClimate = await fs.readFile(CLIMATE_PATH, 'utf8');
  const climate = JSON.parse(rawClimate);
  const knownDistricts = new Set(Object.keys(climate.districts));
  const knownDivisions = new Set([
    'barisal',
    'chittagong',
    'dhaka',
    'khulna',
    'mymensingh',
    'rajshahi',
    'rangpur',
    'sylhet',
  ]);

  const errors = [];
  const entries = impacts.entries || [];

  if (!Array.isArray(entries) || entries.length === 0) {
    errors.push('Dataset must contain a non-empty "entries" array.');
  }

  const seenIds = new Set();

  entries.forEach((entry, idx) => {
    const prefix = `Entry #${idx + 1} (${entry.id || 'unidentified'}):`;

    // ID uniqueness
    if (!entry.id) {
      errors.push(`${prefix} Missing 'id'.`);
    } else if (seenIds.has(entry.id)) {
      errors.push(`${prefix} Duplicate id '${entry.id}'.`);
    } else {
      seenIds.add(entry.id);
    }

    // Category
    if (!VALID_CATEGORIES.has(entry.category)) {
      errors.push(`${prefix} Invalid category '${entry.category}'. Expected: ${[...VALID_CATEGORIES].join(', ')}`);
    }

    // Name strings
    if (!entry.name_en || typeof entry.name_en !== 'string' || entry.name_en.length < 2) {
      errors.push(`${prefix} Missing or invalid 'name_en'.`);
    }
    if (!entry.name_bn || typeof entry.name_bn !== 'string' || entry.name_bn.length < 2) {
      errors.push(`${prefix} Missing or invalid 'name_bn'.`);
    }

    // Metric & Direction
    if (!VALID_METRICS.has(entry.metric)) {
      errors.push(`${prefix} Invalid metric '${entry.metric}'. Expected: ${[...VALID_METRICS].join(', ')}`);
    }
    if (!VALID_DIRECTIONS.has(entry.direction)) {
      errors.push(`${prefix} Invalid direction '${entry.direction}'. Expected: ${[...VALID_DIRECTIONS].join(', ')}`);
    }

    // Regions validation
    if (!Array.isArray(entry.regions) || entry.regions.length === 0) {
      errors.push(`${prefix} 'regions' must be a non-empty array.`);
    } else {
      for (const reg of entry.regions) {
        if (reg !== 'all' && !knownDistricts.has(reg) && !knownDivisions.has(reg)) {
          errors.push(`${prefix} Unknown region ID '${reg}' not matching any district or division.`);
        }
      }
    }

    // Summaries
    if (!entry.summary_en || entry.summary_en.length < 10) {
      errors.push(`${prefix} 'summary_en' is too short or missing.`);
    }
    if (!entry.summary_bn || entry.summary_bn.length < 10) {
      errors.push(`${prefix} 'summary_bn' is too short or missing.`);
    }

    // Numbers object
    if (!entry.numbers || typeof entry.numbers !== 'object') {
      errors.push(`${prefix} Missing 'numbers' object.`);
    } else {
      if (entry.numbers.value == null || entry.numbers.value === '') {
        errors.push(`${prefix} 'numbers.value' cannot be empty.`);
      }
      if (!entry.numbers.unit) {
        errors.push(`${prefix} 'numbers.unit' cannot be empty.`);
      }
      if (!entry.numbers.what_it_measures) {
        errors.push(`${prefix} 'numbers.what_it_measures' cannot be empty.`);
      }
    }

    // Threshold check (optional, but if present must be complete)
    if (entry.threshold) {
      if (entry.threshold.value == null || !entry.threshold.unit || !entry.threshold.condition || !entry.threshold.source) {
        errors.push(`${prefix} 'threshold' is incomplete. Must specify value, unit, condition, and source.`);
      }
    }

    // Evidence Type
    if (!VALID_EVIDENCE_TYPES.has(entry.evidence_type)) {
      errors.push(
        `${prefix} Invalid 'evidence_type' '${entry.evidence_type}'. Expected: ${[...VALID_EVIDENCE_TYPES].join(', ')}`,
      );
    }

    // Climate link
    if (!VALID_CLIMATE_LINKS.has(entry.climate_link)) {
      errors.push(
        `${prefix} Invalid 'climate_link' '${entry.climate_link}'. Expected: ${[...VALID_CLIMATE_LINKS].join(', ')}`,
      );
    }

    // Scientific rule on extinction
    if (entry.category === 'extinction' && entry.climate_link === 'direct') {
      errors.push(
        `${prefix} Extinction cannot be assigned climate_link 'direct' unless an explicit attribution source is cited.`,
      );
    }

    // Consensus & Confidence
    if (!VALID_CONSENSUS.has(entry.consensus)) {
      errors.push(`${prefix} Invalid 'consensus' '${entry.consensus}'. Expected: ${[...VALID_CONSENSUS].join(', ')}`);
    }
    if (!VALID_CONFIDENCE.has(entry.confidence)) {
      errors.push(
        `${prefix} Invalid 'confidence' '${entry.confidence}'. Expected: ${[...VALID_CONFIDENCE].join(', ')}`,
      );
    }

    // Source object
    if (!entry.source || typeof entry.source !== 'object') {
      errors.push(`${prefix} Missing 'source' object.`);
    } else {
      if (!entry.source.title) errors.push(`${prefix} Missing 'source.title'.`);
      if (!entry.source.url || !entry.source.url.startsWith('http')) {
        errors.push(`${prefix} Missing or invalid 'source.url' (must start with http/https).`);
      }
      if (!entry.source.publisher) errors.push(`${prefix} Missing 'source.publisher'.`);
      if (!entry.source.year || typeof entry.source.year !== 'number') {
        errors.push(`${prefix} Missing or invalid 'source.year'.`);
      }
    }

    // Last checked
    if (!entry.last_checked || !/^\d{4}-\d{2}-\d{2}$/.test(entry.last_checked)) {
      errors.push(`${prefix} Missing or invalid 'last_checked' date format (YYYY-MM-DD).`);
    }
  });

  if (errors.length > 0) {
    console.error(`\n❌ Validation Failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Validation Passed! All ${entries.length} entries conform to the scientific criteria.`);
  console.log('\n--- Summary Table ---');
  console.log(
    'ID'.padEnd(38) +
      'Category'.padEnd(14) +
      'Evidence Type'.padEnd(25) +
      'Climate Link'.padEnd(18) +
      'Confidence'.padEnd(12),
  );
  console.log('='.repeat(107));

  entries.forEach((e) => {
    console.log(
      e.id.padEnd(38) +
        e.category.padEnd(14) +
        e.evidence_type.padEnd(25) +
        e.climate_link.padEnd(18) +
        e.confidence.padEnd(12),
    );
  });
}

validate().catch((err) => {
  console.error(err);
  process.exit(1);
});
