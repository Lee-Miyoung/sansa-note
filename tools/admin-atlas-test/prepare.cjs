#!/usr/bin/env node
// Build a new standalone folder; never edits or deploys an existing site.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validateConfig}=require('./safety.js');
const repo=path.resolve(__dirname,'../..');
function build(configFile,output){
 const source=fs.readFileSync(path.join(repo,'index.html'),'utf8');
 const match=source.match(/(?:const|let|var)\s+FIREBASE_CONFIG\s*=\s*(\{[\s\S]*?\});/);
 if(!match)throw Error('Production denylist could not be extracted');
 // Public config only: extract literals, never evaluate application source.
 const blocked={};for(const key of ['projectId','apiKey','authDomain','databaseURL','appId','messagingSenderId']){const m=match[1].match(new RegExp(key+':\\s*["\u0027]([^"\u0027]+)["\u0027]'));if(!m)throw Error('Missing denylist '+key);blocked[key]=m[1];}
 const config=validateConfig(JSON.parse(fs.readFileSync(configFile,'utf8')),blocked);
 const parent=fs.realpathSync(path.dirname(path.resolve(output))),dest=path.join(parent,path.basename(output));
 if(dest===repo||dest.startsWith(repo+path.sep)||repo.startsWith(dest+path.sep)||fs.existsSync(dest))throw Error('Choose a NEW output folder outside the repository');
 fs.mkdirSync(dest);fs.mkdirSync(path.join(dest,'public'));
 for(const file of ['index.html','style.css','safety.js','bootstrap.js'])fs.copyFileSync(path.join(__dirname,file),path.join(dest,'public',file));
 fs.copyFileSync(path.join(repo,'scripts/secret-atlas/store.js'),path.join(dest,'public/store.js'));
 fs.writeFileSync(path.join(dest,'public/stage-config.json'),JSON.stringify({config,blocked,adminEmail:'song4mi12@gmail.com'},null,2));
 fs.copyFileSync(path.join(repo,'firebase/production-with-secret-atlas.rules.json'),path.join(dest,'database.rules.json'));
 fs.writeFileSync(path.join(dest,'firebase.json'),JSON.stringify({database:{rules:'database.rules.json'},hosting:{public:'public',ignore:['firebase.json','**/.*','**/node_modules/**'],headers:[{source:'**',headers:[{key:'Cache-Control',value:'no-store'},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'}]}]}},null,2));
 fs.writeFileSync(path.join(dest,'.firebaserc'),JSON.stringify({projects:{default:config.projectId}},null,2));
 const hashes={};for(const file of ['database.rules.json','public/store.js'])hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(dest,file))).digest('hex');
 fs.writeFileSync(path.join(dest,'build-manifest.json'),JSON.stringify({projectId:config.projectId,hashes},null,2));
 return dest;
}
module.exports={build};if(require.main===module){try{if(process.argv.length!==4)throw Error('Usage: node tools/admin-atlas-test/prepare.cjs PUBLIC_CONFIG.json NEW_OUTPUT_FOLDER');console.log(build(process.argv[2],process.argv[3]));}catch(e){console.error(e.message);process.exitCode=1;}}
