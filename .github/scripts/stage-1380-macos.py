"""Installer-only macOS repack. Never publishes the release or uploads sources."""
import hashlib,json,os,pathlib,plistlib,shutil,struct,subprocess,sys,tempfile,zipfile
R=pathlib.Path.cwd();repo=os.environ['GITHUB_REPOSITORY'];arch=os.environ['FARM_ARCH'];assert arch in ('x64','arm64')
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def api(path):return json.loads(subprocess.check_output(['gh','api',path]))
releases=api(f'repos/{repo}/releases?per_page=100');release=next(r for r in releases if r['tag_name']=='v1.38.0');assert release['draft'],'Only draft staging is allowed'
asset=next(a for a in release['assets'] if a['name']=='FarmClient-Setup-1.38.0-Windows-x64.exe')
with open('payload.exe','wb') as f:run('gh','api',f'repos/{repo}/releases/assets/{asset["id"]}','-H','Accept: application/octet-stream',stdout=f)
assert hashlib.sha256(pathlib.Path('payload.exe').read_bytes()).hexdigest()=='e2dbdefedf0b77ccaaf01c3471ea73b1b15bd7cab7aaded1fc1ea01405fe9240'
run('7zz','x','-y','payload.exe','-opayload',stdout=subprocess.DEVNULL)
resources=R/'payload/resources'
if not resources.exists():
 archives=list((R/'payload').rglob('*.7z'));assert len(archives)==1;run('7zz','x','-y',str(archives[0]),'-opayload/app',stdout=subprocess.DEVNULL);resources=R/'payload/app/resources'
assert resources.exists()
b=(resources/'app.asar').read_bytes();header=b[16:16+struct.unpack_from('<I',b,12)[0]];assert hashlib.sha256(header).hexdigest()=='c48687e883a9b885ef82ae6819b8f7aaa479ce9e491e4643ed85b593b4be58f1'
h=json.loads(header);entry=h['files']['package.json'];offset=int(entry['offset'])+8+struct.unpack_from('<I',b,4)[0];assert json.loads(b[offset:offset+entry['size']])['version']=='1.38.0'
manifest=json.loads((resources/'mods/manifest.json').read_text());jars=list((resources/'mods').glob('*.jar'));assert len(jars)==4
for p in jars:
 with zipfile.ZipFile(p) as z:meta=json.loads(z.read('fabric.mod.json'));assert meta['version'].startswith('1.38.0') and meta['id']=='farmclient'
base=api(f'repos/{repo}/releases/tags/v1.37.1');asset=next(a for a in base['assets'] if a['name']==f'FarmClient-1.37.1-macOS-{arch}.dmg')
with open('base.dmg','wb') as f:run('gh','api',f'repos/{repo}/releases/assets/{asset["id"]}','-H','Accept: application/octet-stream',stdout=f)
expected={'arm64':'8fc7d8d3ec41651a8e7278aa68cdac4a3b1cae926a3802e0ef511aaf973daf67','x64':'255b23ad38e48b81757ed49e3442e48ac1c9ca1726b51baeeb11c3d57a16332d'};assert hashlib.sha256(pathlib.Path('base.dmg').read_bytes()).hexdigest()==expected[arch]
mount=R/'mounted';mount.mkdir();run('hdiutil','attach','base.dmg','-readonly','-nobrowse','-mountpoint',str(mount),stdout=subprocess.DEVNULL)
stage=R/'stage';stage.mkdir()
try:
 apps=list(mount.glob('*.app'));assert len(apps)==1
 app=stage/apps[0].name;run('ditto',str(apps[0]),str(app))
finally:run('hdiutil','detach',str(mount),stdout=subprocess.DEVNULL)
info=app/'Contents/Info.plist';meta=plistlib.loads(info.read_bytes());oldid=meta['CFBundleIdentifier'];assert oldid.startswith('com.farmclient.')
meta['CFBundleVersion']='1.38.0';meta['CFBundleShortVersionString']='1.38.0';meta['ElectronAsarIntegrity']={'Resources/app.asar':{'algorithm':'SHA256','hash':hashlib.sha256(header).hexdigest()}}
info.write_bytes(plistlib.dumps(meta));dst=app/'Contents/Resources';shutil.copy2(resources/'app.asar',dst/'app.asar');shutil.rmtree(dst/'mods',ignore_errors=True);shutil.copytree(resources/'mods',dst/'mods')
exe=app/'Contents/MacOS'/meta['CFBundleExecutable'];native=subprocess.check_output(['lipo','-archs',str(exe)],text=True).strip();assert ('arm64' if arch=='arm64' else 'x86_64') in native.split()
run('codesign','--force','--deep','--sign','-',str(app));run('codesign','--verify','--deep','--strict',str(app));assert plistlib.loads(info.read_bytes())['CFBundleIdentifier']==oldid
os.symlink('/Applications',stage/'Applications');out=f'FarmClient-1.38.0-macOS-{arch}.dmg';run('hdiutil','create','-volname','Farm Client','-srcfolder',str(stage),'-ov','-format','UDZO',out,stdout=subprocess.DEVNULL);run('hdiutil','verify',out,stdout=subprocess.DEVNULL)
run('hdiutil','attach',out,'-readonly','-nobrowse','-mountpoint',str(mount),stdout=subprocess.DEVNULL)
try:
 checked=list(mount.glob('*.app'))[0];assert hashlib.sha256((checked/'Contents/Resources/app.asar').read_bytes()).digest()==hashlib.sha256(b).digest();assert len(list((checked/'Contents/Resources/mods').glob('*.jar')))==4;run('codesign','--verify','--deep','--strict',str(checked))
finally:run('hdiutil','detach',str(mount),stdout=subprocess.DEVNULL)
release=api(f'repos/{repo}/releases/{release["id"]}');assert release['draft'];run('gh','release','upload','v1.38.0',out,'--repo',repo)
print('PASS macOS installer',arch,oldid,native,hashlib.sha256(pathlib.Path(out).read_bytes()).hexdigest());print('Ad-hoc signed, NOT notarized. Packaging validation, NOT game/GPU testing.')
