import { createHash } from 'node:crypto';

// Chromium 154.0.8037.98 html.css uses images/time_icon.svg for input[type=time].
// Official source: https://raw.githubusercontent.com/chromium/chromium/154.0.8037.98/third_party/blink/renderer/core/html/resources/images/time_icon.svg
// Compare all 369 decoded bytes; do not permit arbitrary data: or SVG resources.
const NATIVE_TIME_ICON_SHA256='6f2cf0c99091af44641cb27eee6a0f32a56aa85f446f60a9482864f2ade413d4';
export function allowedSmokeRequest(request, origin) {
  if(request.url.startsWith(origin+'/')) return true;
  const prefix='data:image/svg+xml;base64,';
  if(request.type!=='Image' || request.initiator?.type!=='parser' || request.initiator.url!==origin+'/' || !request.url.startsWith(prefix) || request.url.length>1024) return false;
  const bytes=Buffer.from(request.url.slice(prefix.length),'base64');
  return bytes.length===369 && createHash('sha256').update(bytes).digest('hex')===NATIVE_TIME_ICON_SHA256;
}
