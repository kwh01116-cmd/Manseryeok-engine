/** Separate loader keeps XML parsing/extension acquisition out of the v1 artifact closure. */
import {loadCandidate} from './candidate.mjs';
import {createLocalChartProfile,EXTENDED_SOLAR_PROFILE_ID,HISTORICAL_PROFILE_ID,MODERN_PROFILE_ID,BASELINE_MANIFEST_SHA256,ANNUAL_SOLAR_ACCEPTED_SHA256,ACCEPTED_BOUNDARY_SUPPLEMENT_SHA256,LocalChartError} from './local-chart.mjs';
import {loadExisting2027AnnualSolarExtension,verifyExisting2027AnnualSolarExtension,ANNUAL_SOLAR_EXTENSION_POLICY_ID} from './annual-solar-extension.mjs';
export async function loadExtendedLocalChartProfile(options){
  if(![EXTENDED_SOLAR_PROFILE_ID,HISTORICAL_PROFILE_ID,MODERN_PROFILE_ID].includes(options?.profileId))throw new LocalChartError('EXPLICIT_SUPPORTED_EXTENDED_PROFILE_REQUIRED');
  if(options.expectedManifestSha256!==BASELINE_MANIFEST_SHA256)throw new LocalChartError('EXTENDED_BASELINE_PIN_REQUIRED');
  const loaded=await loadCandidate(options.directory,options.expectedManifestSha256);
  let annualSolarExtension;
  if(options.profileId===EXTENDED_SOLAR_PROFILE_ID){
    if(typeof options.annualSolarDirectory!=='string'||!options.annualSolarDirectory)throw new LocalChartError('EXPLICIT_ANNUAL_SOLAR_DIRECTORY_REQUIRED');
    annualSolarExtension=await loadExisting2027AnnualSolarExtension({directory:options.annualSolarDirectory,expectedSupplementSha256:ACCEPTED_BOUNDARY_SUPPLEMENT_SHA256,expectedBaseManifestSha256:BASELINE_MANIFEST_SHA256,expectedAnnualSha256:ANNUAL_SOLAR_ACCEPTED_SHA256,policyId:ANNUAL_SOLAR_EXTENSION_POLICY_ID});
    verifyExisting2027AnnualSolarExtension(annualSolarExtension,{baseManifestSha256:BASELINE_MANIFEST_SHA256});
  }else if(options.annualSolarDirectory!==undefined)throw new LocalChartError('UNSELECTED_ANNUAL_SOLAR_DIRECTORY');
  return createLocalChartProfile(loaded,{profileId:options.profileId,expectedManifestSha256:options.expectedManifestSha256,...(annualSolarExtension?{annualSolarExtension}:{})});
}
