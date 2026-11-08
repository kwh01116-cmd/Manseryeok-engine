#!/usr/bin/env python3
"""Build a Windows x64 portable ZIP from a clean checkout and verified official Node ZIP."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runtime-zip', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True,
                        help='Official Node SHASUMS256.txt fetched with TLS verification.')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=root).strip():
        raise SystemExit('Commit reviewed source changes before packaging.')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    name = 'node-v22.23.3-win-x64.zip'
    expected = next(line.split()[0] for line in args.checksums.read_text().splitlines()
                    if len(line.split()) == 2 and line.split()[1] == name)
    actual = hashlib.sha256(args.runtime_zip.read_bytes()).hexdigest()
    if args.runtime_zip.name != name or actual != expected:
        raise SystemExit('Official Node archive/checksum mismatch.')
    prefix = 'Manseryeok-KASI-1950-2026/'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, 'x', zipfile.ZIP_DEFLATED) as out:
        def add(path, target=None):
            if path.suffix == '.node':
                raise SystemExit('Native dependency needs a separate Windows build.')
            out.write(path, prefix + (target or str(path.relative_to(root)).replace('\\', '/')))
        for entry in ['package.json', 'package-lock.json', 'start-kasi-collection.cmd',
                      'start-kasi-collection-daily.cmd', 'validate-kasi-collection.cmd', 'diagnose-kasi-cache.cmd']:
            add(root / entry)
        add(root / 'docs/KASI_LOCAL_1950_2026.md', 'README.md')
        compiled = list((root / '.kasi-build').glob('*.js'))
        if not (root / '.kasi-build/local.js').exists():
            raise SystemExit('Run npm ci and npm run kasi:build first.')
        for path in compiled:
            add(path)
        # web.js reads this relative to its compiled directory, if explicitly used.
        add(root / 'scripts/kasi/page.html')
        lock = json.loads((root / 'package-lock.json').read_text())
        included = set()
        for package, metadata in lock['packages'].items():
            if not package.startswith('node_modules/') or metadata.get('dev'):
                continue
            folder = root / package
            if not folder.is_dir():
                raise SystemExit('Run locked npm ci first; missing production dependency.')
            for path in sorted(folder.rglob('*')):
                if path.is_file() and path not in included:
                    if path.is_symlink():
                        raise SystemExit('Unexpected symlink in dependency tree.')
                    add(path)
                    included.add(path)
        with zipfile.ZipFile(args.runtime_zip) as runtime:
            for entry in ['node.exe', 'LICENSE']:
                out.writestr(prefix + 'runtime/' + entry, runtime.read('node-v22.23.3-win-x64/' + entry))
        out.writestr(prefix + 'BUILD_INFO.json', json.dumps({
            'source_commit': commit, 'runtime': 'Node 22.23.3 Windows x64',
            'runtime_archive_sha256': actual,
            'runtime_source': 'https://nodejs.org/dist/v22.23.3/' + name,
            'no_credentials_or_collected_data': True,
            'native_windows_execution': 'UNVERIFIED'}, indent=2) + '\n')
        out.writestr(prefix + 'START-HERE.txt',
                     '압축을 전부 해제한 뒤 실행하세요.\n'
                     '1. start-kasi-collection.cmd 더블클릭\n'
                     '2. 인증키 값만 붙여넣고 Enter (화면에는 안 보임)\n'
                     '3. 표본 완료 후 1950-2026 입력 → 전체 수집\n'
                     '4. 중단 후 같은 폴더에서 다시 실행 → 재개\n'
                     '설치 불필요 / Windows x64 전용 / 자세한 방법: README.md\n')
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    args.output.with_suffix('.zip.sha256').write_text(digest + '  ' + args.output.name + '\n')
    print(json.dumps({'artifact': str(args.output), 'sha256': digest, 'source_commit': commit}))


if __name__ == '__main__':
    main()
