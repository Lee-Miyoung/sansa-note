"""Sansa Note original procedural bell and wooden-percussion composition.
No sampled recordings, speech, or imitated performer. Deterministic synthesis.
Requires numpy and ffmpeg. Run from repository root.
"""
import hashlib,json,subprocess,wave
from pathlib import Path
import numpy as np
RATE=44100; DURATION=28; rng=np.random.default_rng(108)
x=np.zeros((RATE*DURATION,2),dtype=np.float64)
def place(y,start,pan=0):
 i=int(start*RATE);n=min(len(y),len(x)-i)
 if n>0:x[i:i+n,0]+=y[:n]*np.sqrt((1-pan)/2);x[i:i+n,1]+=y[:n]*np.sqrt((1+pan)/2)
def bell(at,f=196,level=.3):
 t=np.arange(11*RATE)/RATE; y=np.zeros_like(t)
 for ratio,gain,decay in [(1,1,5),(2.01,.35,3.4),(2.76,.2,2.6),(4.08,.12,1.5),(5.43,.055,.9)]:
  y+=gain*np.sin(2*np.pi*f*ratio*t)*np.exp(-t/decay)
 y*=level*(1-np.exp(-t/.004));place(y,at,-.1)
def wood(at,level=.085):
 t=np.arange(int(.45*RATE))/RATE
 y=(np.sin(2*np.pi*740*t)*np.exp(-t/.09)+.45*np.sin(2*np.pi*1260*t)*np.exp(-t/.04)+.18*rng.normal(size=len(t))*np.exp(-t/.012))*level
 y*=1-np.exp(-t/.001);place(y,at,.12)
bell(.35)
for at in [7.8,9.6,11.4,15.5,17.3,19.1]:wood(at)
bell(20.5,196,.22)
# Quiet early reflections; no long echo or repeated track loop.
base=x.copy()
for delay,gain in [(.043,.065),(.071,.04),(.113,.025)]:
 n=int(delay*RATE);x[n:]+=base[:-n,::-1]*gain
x*=np.minimum(1,np.arange(len(x))/int(.025*RATE))[:,None]
x[-RATE*3:]*=np.linspace(1,0,RATE*3)[:,None]
x/=max(1,np.abs(x).max()/0.7)
wav=Path('/tmp/sansa-original-opening.wav')
with wave.open(str(wav),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((x*32767).astype('<i2').tobytes())
out=Path('audio/dharma-hall/original-opening.mp3')
analysis=subprocess.run(['ffmpeg','-hide_banner','-i',str(wav),'-af','loudnorm=I=-25:TP=-2:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
measured=json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])[0]
gain=min(-25-float(measured['input_i']),-2-float(measured['input_tp']))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',f'volume={gain}dB','-ar','44100','-b:a','128k',str(out)],check=True)
meta=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(out)]))['format']
p=Path('audio/dharma-hall/catalog.json');rows=json.loads(p.read_text());rows=[r for r in rows if r['id']!='opening-ritual']
rows.append({'id':'opening-ritual','title':'마음을 여는 종 · 산사노트 창작','kind':'bell','src':'./audio/dharma-hall/original-opening.mp3','creator':'산사노트','source':'https://sansanote.com/audio/dharma-hall/ORIGINAL.md','originalMedia':'https://sansanote.com/audio/dharma-hall/original-opening.mp3','license':'CC BY 4.0','licenseURL':'https://creativecommons.org/licenses/by/4.0/','changes':'산사노트 전용 절차적 합성 원곡 · 종과 나무 타격음 · 음성/현장 녹음 아님 · -25 LUFS 목표 MP3 변환','description':'입장할 때 마음을 모으는 창작 종·목탁 계열 타격음. 실제 사찰 의식이나 스님의 염불 녹음이 아닙니다.','duration':float(meta['duration']),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'verified':True,'gain':.8,'allowedHalls':['daewung','geungnak','gwanum','munsu','yaksa','jijang']})
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
p=Path('data/online-sansa.json');d=json.loads(p.read_text())
for h in d['halls']:
 if 'opening-ritual'not in h['tracks']:h['tracks'].append('opening-ritual')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Created',out,meta['duration'],'seconds;',out.stat().st_size,'bytes')
