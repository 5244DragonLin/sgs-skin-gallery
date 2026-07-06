import fs from 'fs';

const d = JSON.parse(fs.readFileSync('public/skin-data.json', 'utf8'));
const g = d.generals;
let totalSkins = 0;
for (const gen of g) totalSkins += gen.skins.length;
console.log('Generals:', g.length, 'Total skins:', totalSkins);

const bwiki = 'D:/BaiduSyncdisk/其他/三国杀皮肤/BWIKI';
let missing = 0, exist = 0, noStatic = 0;
for (const gen of g) {
  for (const sk of gen.skins) {
    if (sk.static) {
      const p = bwiki + '/' + sk.static.replace(/\\/g, '/');
      if (fs.existsSync(p)) exist++;
      else { missing++; if (missing <= 3) console.log('MISSING:', sk.static); }
    } else {
      noStatic++;
    }
  }
}
console.log('Exist:', exist, 'Missing:', missing, 'No static field:', noStatic);

const stats = {};
for (const gen of g) {
  for (const sk of gen.skins) {
    const q = sk.quality || 'none';
    stats[q] = (stats[q] || 0) + 1;
  }
}
console.log('Quality stats:', JSON.stringify(stats, null, 2));

// Check how many generals have large images existing
let largeExist = 0, largeMissing = 0, dynExist = 0, dynMissing = 0;
for (const gen of g) {
  for (const sk of gen.skins) {
    if (sk.large) {
      const p = bwiki + '/' + sk.large.replace(/\\/g, '/');
      if (fs.existsSync(p)) largeExist++; else largeMissing++;
    }
    if (sk.dynamic) {
      const p = bwiki + '/' + sk.dynamic.replace(/\\/g, '/');
      if (fs.existsSync(p)) dynExist++; else dynMissing++;
    }
  }
}
console.log('Large exist:', largeExist, 'missing:', largeMissing);
console.log('Dynamic exist:', dynExist, 'missing:', dynMissing);
