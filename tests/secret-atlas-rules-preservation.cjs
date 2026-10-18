/* Structural preservation only; does not replace Firebase's rule evaluator. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const read=name=>JSON.parse(fs.readFileSync(path.resolve(__dirname,'../firebase',name),'utf8'));
const provided=read('provided-production.rules.json'),merged=read('production-with-secret-atlas.rules.json'),fragment=read('secret-atlas.rules.fragment.json');
assert.deepEqual(merged.rules.users.$uid.secretAtlas,fragment.rules.users.$uid.secretAtlas);
delete merged.rules.users.$uid.secretAtlas;assert.deepEqual(merged,provided,'all original rules and leaderboard index must remain exactly unchanged');
console.log('PASS structural preservation: only secretAtlas validation subtree added; all supplied legacy rules and administrator read grants unchanged. Firebase execution not tested by this check.');
