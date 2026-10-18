"""Cache official header logos; run manually when refreshing provider branding."""
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
LOGOS = {
    'abn-overseas': ('https://www.abneducation.com/', 'https://www.abneducation.com/wp-content/uploads/2023/02/cropped-cropped-ABN-LOGO-2022-02.jpg'),
    'fes-consultants': ('https://www.fespak.com/', 'https://www.fespak.com/images/logo/FES.png'),
    'edwise-education': ('https://edwise.pk/', 'https://edwise.pk/wp-content/uploads/2025/01/1-Education-Consultants-in-Karachi-2-1.png'),
    'dignosco': ('https://dignosco.org/', 'https://dignosco.org/wp-content/uploads/2017/03/logodignosco.png'),
    'iec-consultancy': ('https://iecconsultancy.com/', 'https://iecconsultancy.com/wp-content/uploads/2021/01/e224ddb9-b62b-4ac2-ad01-c8623ae657ba.jpg'),
}
manifest_path = ROOT / 'research/consultant-icons.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for slug, (website, source) in LOGOS.items():
    request = Request(source, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=30) as response:
        data = response.read()
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        extension = '.png'
    elif data.startswith(b'\xff\xd8'):
        extension = '.jpg'
    else:
        raise ValueError(f'Unexpected logo format: {slug}')
    file = f'assets/consultant-icons/{slug}{extension}'
    (ROOT / file).write_bytes(data)
    manifest[slug] = dict(file=file, website=website, source=source,
                          checked='2026-10-18', kind='Official website header logo')
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Cached {slug}: {len(data)} bytes', flush=True)
