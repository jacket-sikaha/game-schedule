import crypto from 'crypto';

// 模拟三个游戏的 hash(gameKey + id + title) 输出
const makeUid = (gameKey, id, title) => {
  const normalize = (s) =>
    s.replace(/\s+/g, ' ').replace(/\u3000/g, ' ').trim().toLowerCase();
  return crypto.createHash('sha256').update(`${gameKey}:${id}:${normalize(title)}`).digest('hex').slice(0, 16);
};

// 候选默认值对比
const candidates = [
  '0',
  '',
  'null',
  'undefined',
  '-',
  'MISSING',
  'NO_ID',
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('候选默认值对 hash 输出的影响（战双 8 条缺失 entryId 的实测样本）');
console.log('═══════════════════════════════════════════════════════════════\n');

const pnsTitles = [
  '【远信回响】主线版本',
  '【远信回响】空滞轮旋之梦-联动剧情关卡',
  '【远信回响】溯时者逆洄-角色试玩关',
  '【远信回响】悍猎季风-BOSS挑战',
  '【远信回响】阿德莱德·破渊 新增特效涂装 | 禁隙摧厄',
  '【远信回响】涅缇娅·亡歌 新增特效涂装 | 旖梦逝影',
  '【远信回响】洁塔薇·破晓 新增涂装 | 烬色礼典',
  '【远信回响】「星屿述忆」涂装自选研发活动',
];

// 对每个候选，生成 8 条 hash，检查是否与有 entryId 的条目冲突
const realPnsEntryIds = ['1552007259471028736', '1552007307825524736', '1552007353333886976', '1552007397766821376', '1552007443794377216', '1552007489998699008'];
const realPnsTitlesWithEntryId = ['【远信回响】主线版本', '【远信回响】星屿述忆 角色试玩', '【远信回响】角色试玩', '【远信回响】BOSS挑战', '【远信回响】涂装', '【远信回响】涂装2'];

for (const def of candidates) {
  console.log(`\n--- 默认值: ${JSON.stringify(def)} (字符串长度 ${def.length}) ---`);
  const hashSet = new Set();
  let selfCollision = 0;
  for (const t of pnsTitles) {
    const h = makeUid('pns', def, t);
    if (hashSet.has(h)) selfCollision++;
    hashSet.add(h);
    console.log(`   ${h}  ${t.slice(0,30)}`);
  }
  console.log(`   自冲突: ${selfCollision} 条`);

  // 检查与真实 entryId 的条目是否冲突
  let crossCollision = 0;
  for (const [eid, et] of Object.entries(Object.fromEntries(realPnsEntryIds.map((id, i) => [id, realPnsTitlesWithEntryId[i]])))) {
    const h1 = makeUid('pns', eid, et);
    if (hashSet.has(h1)) crossCollision++;
  }
  console.log(`   与有 entryId 条目的交叉冲突: ${crossCollision}`);
}

// 关键测试：跨游戏是否会撞
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('跨游戏碰撞测试（同一 gameKey 前缀下）');
console.log('═══════════════════════════════════════════════════════════════\n');

// 战双缺失 entryId 用 0 的 hash
const pnsWithZero = makeUid('pns', '0', '【远信回响】主线版本');
// 如果鸣潮有 title="0【远信回响】主线版本" 的假想条目
const mcCheat = makeUid('mc', '1554479052247040000', '0【远信回响】主线版本');
console.log(`战双 (0, 【远信回响】主线版本): ${pnsWithZero}`);
console.log(`鸣潮 (entryId, "0【远信回响】主线版本"): ${mcCheat}`);
console.log(`→ 不同 gameKey 前缀，hash 前缀不同，不会撞`);

// 测试：鸣潮有 entryId=1554479052247040000 的重复组
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('鸣潮重复 ID 组（id=1554479052247040000）打散效果');
console.log('═══════════════════════════════════════════════════════════════\n');
const mcDupId = '1554479052247040000';
const mcDupTitles = ['回音盈域', '声弦涤荡'];
for (const t of mcDupTitles) {
  console.log(`   ${makeUid('mc', mcDupId, t)}  ${t}`);
}
console.log('→ 两条 hash 不同，自动打散 ✅');

// 测试：极端情况——两个不同游戏、同一 gameKey 前缀不会发生
// 但如果有人误用，看碰撞概率
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('边界测试：空字符串 vs 0 的实际区别');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`空字符串 id="": ${makeUid('pns', '', '测试标题')}`);
console.log(`数字 0 id=0:    ${makeUid('pns', '0', '测试标题')}`);
console.log(`数字 0 id="0": ${makeUid('pns', 0, '测试标题')}`);
console.log('→ 字符串 "0" 和数字 0 经过模板字符串都变成 "0"，等价');
