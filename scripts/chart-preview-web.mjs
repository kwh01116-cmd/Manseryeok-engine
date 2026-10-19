/** Local-only, read-only V0 chart preview. No persistence of birth inputs. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { isDirectModuleRun } from './web-entrypoint.mjs';
import { resolveTrustedKoreanLabPreview, verifyTrustedKoreanLabPreview,
  STEM_NATURE, BRANCH_NATURE } from '../dist/index.js';
import { parseKoreanChartCliArgs } from './chart-preview-cli-args.mjs';
import { projectKoreanV0Story } from '../dist/story/v0StoryProjection.js';
import { deriveHiddenStemChapter, HIDDEN_STEM_KOREAN, TEN_GOD_KOREAN } from '../dist/story/hiddenStemChapter.js';
import { HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE, HIDDEN_STEMS_V1 } from '../dist/domain/hiddenStems.js';
import { BRANCH_TEN_GOD_RULE_ID } from '../dist/domain/branchTenGods.js';

const allowed = ['calendar', 'date', 'time', 'timeBasis', 'dayRollover', 'hourStemReference', 'leap', 'hiddenStemPolicyId'];
const required = ['calendar', 'date', 'time', 'timeBasis', 'dayRollover', 'hourStemReference'];

/** Reuse the tested CLI parser to avoid a second calendar or policy validator. */
export function parseWebBirthInput(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new RangeError('Invalid request');
  if (Object.keys(data).some(key => !allowed.includes(key)) ||
      required.some(key => typeof data[key] !== 'string')) throw new RangeError('Invalid request');
  if (Object.hasOwn(data,'hiddenStemPolicyId') && data.hiddenStemPolicyId !== HIDDEN_STEM_POLICY_V1)
    throw new RangeError('Invalid request');
  if (data.calendar === 'KOREAN_LUNAR') {
    if (typeof data.leap !== 'boolean') throw new RangeError('Invalid request');
  } else if ('leap' in data) throw new RangeError('Invalid request');
  const args = [
    '--calendar=' + data.calendar, '--date=' + data.date, '--time=' + data.time,
    '--time-basis=' + data.timeBasis, '--day-rollover=' + data.dayRollover,
    '--hour-stem-reference=' + data.hourStemReference,
    ...(data.calendar === 'KOREAN_LUNAR' ? ['--leap=' + data.leap] : []),
  ];
  return { ...parseKoreanChartCliArgs(args),
    ...(Object.hasOwn(data,'hiddenStemPolicyId') ? { hiddenStemPolicyId:data.hiddenStemPolicyId } : {}) };
}
const common = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
function json(res, code, value) {
  res.writeHead(code, { ...common, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new RangeError('Invalid request');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 8192) throw new RangeError('Invalid request');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RangeError('Invalid request'); }
}
export function makeChartPreviewServer() {
  return createServer(async (req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      try {
        const template = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
        // Public static metadata, independent of birth input. One source of classification
        // for server projection and client validation; no new API or persisted records.
        const lookups = JSON.stringify({ stems: STEM_NATURE, branches: BRANCH_NATURE }).replace(/</g, '\\u003c');
        const ep4Rules=JSON.stringify({rule:HIDDEN_STEM_RULE,members:HIDDEN_STEMS_V1,
          branchRuleId:BRANCH_TEN_GOD_RULE_ID,stemNames:HIDDEN_STEM_KOREAN,tenGodNames:TEN_GOD_KOREAN}).replace(/</g,'\\u003c');
        const html = template.replace('<!-- NATURE_LOOKUPS -->',
          '<script id="nature-lookups" type="application/json">' + lookups + '</script>')
          .replace('<!-- EP4_RULES -->','<script id="ep4-rules" type="application/json">'+ep4Rules+'</script>');
        res.writeHead(200, { ...common, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch { json(res, 500, { status: 'ERROR', message: 'Unable to load preview page' }); }
      return;
    }
    if (req.method === 'POST' && req.url === '/api/preview') {
      try {
        const { input, clock, policies, hiddenStemPolicyId } = parseWebBirthInput(await readJson(req));
        const receipt = resolveTrustedKoreanLabPreview(input, clock, policies);
        const output = verifyTrustedKoreanLabPreview(receipt, receipt.result);
        // Additive, source-addressable U0 factual beats. The M1 chart remains
        // the sole calendar calculation; errors keep their original contract.
        if (output.status === 'OK') {
          json(res, 200, { ...output, story: projectKoreanV0Story(output),
            ...(hiddenStemPolicyId ? { ep4:deriveHiddenStemChapter(output,hiddenStemPolicyId) } : {}) });
        } else {
          json(res, 422, output);
        }
      } catch (error) {
        const invalid = error instanceof RangeError || error instanceof TypeError;
        json(res, invalid ? 422 : 500, {
          status: 'ERROR',
          code: invalid ? 'INVALID_OR_UNSUPPORTED_INPUT' : 'INTERNAL_ERROR',
          message: invalid ? 'Invalid request' : 'Unable to calculate chart',
        });
      }
      return;
    }
    json(res, 404, { status: 'ERROR', message: 'Not found' });
  });
}
if (isDirectModuleRun(import.meta.url, process.argv[1])) {
  const port = Number(process.env.PORT ?? '4173');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid PORT');
  makeChartPreviewServer().listen(port, '127.0.0.1', function () {
    process.stdout.write('V0 chart preview: http://127.0.0.1:' + this.address().port + '\n');
  });
}
