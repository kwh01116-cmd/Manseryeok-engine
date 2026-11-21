/** Preselection uses only the existing M1 and finite M2 tables. No E1 resolver import. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {loadServerApiOnlyDataPack} from '../server-data/load.mjs';
import {SERVER_API_ONLY_ACCEPTED_PIN} from '../server-data/constants.mjs';
import {createLocalChartProfile, MODERN_PROFILE_ID, MODERN_CLOCK_POLICY_ID} from '../kasi/local-chart.mjs';
import {STEM_NATURE} from '../../dist/domain/stems.js';
import {HIDDEN_STEMS_V1} from '../../dist/domain/hiddenStems.js';
import {fiveElementRelation} from '../../dist/domain/tenGods.js';

export const GRID_PATH = new URL('../../test/fixtures/e1-240-births-v1.txt', import.meta.url);
const TIMES = ['04:15','08:15','12:15','16:15','20:15','00:15'];
const ROLES = ['year','month','day','hour'];
const pad = value => String(value).padStart(2,'0');

export function supportSignature(pillars) {
  const master = pillars[2].stem;
  const nature = STEM_NATURE[master].element;
  // Four root positions: exact stem, other same-element, or absent. The surface
  // signature retains peer/resource at each of the three non-day positions.
  const roots = pillars.map(({branch}) => {
    const hidden = HIDDEN_STEMS_V1[branch];
    if (hidden.some(row => row.stem === master)) return 'E';
    if (hidden.some(row => STEM_NATURE[row.stem].element === nature)) return 'S';
    return '-';
  }).join('');
  const surface = [0,1,3].map(i => {
    const rel = fiveElementRelation(nature,STEM_NATURE[pillars[i].stem].element);
    return rel === 'SAME' ? 'P' : rel === 'TARGET_GENERATES_DAY_MASTER' ? 'R' : '-';
  }).join('');
  return roots + '/' + surface;
}

export async function selectGrid(dataDirectory) {
  const loaded = await loadServerApiOnlyDataPack({directory:dataDirectory});
  const profile = createLocalChartProfile(loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:SERVER_API_ONLY_ACCEPTED_PIN});
  const rows = [];
  for (let month = 1; month <= 12; month++) {
    const cells = new Map();
    for (let pass = 0; pass < 4 && [...cells.values()].filter(s => s.size === 2).length !== 10; pass++) {
      const year = 1990 + 2*(month-1) + pass;
      for (let day = 10; day <= 19; day++) {
        const date = year + '-' + pad(month) + '-' + pad(day);
        const time = TIMES[(month + day + 2*pass) % TIMES.length];
        const chart = profile.calculate({calendar:'GREGORIAN',date,time,policies:{clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'}});
        assert.equal(chart.status,'OK'); assert.equal(chart.chart.candidates.length,1);
        const pillars = ROLES.map(k => chart.chart.candidates[0][k]);
        const cell = pillars[2].stem + pillars[1].branch;
        const signature = supportSignature(pillars);
        if (!cells.has(cell)) cells.set(cell,new Set());
        const taken = cells.get(cell);
        if (taken.size === 2 || taken.has(signature)) continue;
        taken.add(signature);
        rows.push([date,time,cell,signature]);
      }
    }
    assert.equal(cells.size,10);
    assert.ok([...cells.values()].every(s => s.size === 2));
  }
  assert.equal(rows.length,240);
  return rows.map(r => r.join(' ')).join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const rows = await selectGrid(process.argv[2]);
  if (process.argv[3] === '--check') assert.equal((await readFile(GRID_PATH,'utf8')).replaceAll('\r\n','\n'),rows);
  else process.stdout.write(rows);
}
