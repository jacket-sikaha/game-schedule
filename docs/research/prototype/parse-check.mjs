/**
 * 用**独立的第三方解析器** node-ical 校验生成的 .ics
 * 这是可行性最有力的证据：如果真实客户端同族的解析器能正确解出事件，说明格式合法
 */
import ical from 'node-ical';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
ical.async
	.parseFile(file)
	.then((data) => {
		const events = Object.values(data).filter((v) => v.type === 'VEVENT');
		console.log('══════════ 第三方解析器(node-ical) 解析结果 ══════════');
		console.log(`解析成功       : ✅ 无异常`);
		console.log(`解出 VEVENT    : ${events.length}`);
		console.log(`日历名称       : ${data.vcalendar?.[0]?.params?.name ?? data['WR-CALNAME']?.val ?? '(未识别)'}`);
		console.log('');
		console.log('前 5 个事件（时间已还原为 UTC Date）：');
		events.slice(0, 5).forEach((e, i) => {
			console.log(`  ${i + 1}. ${e.summary}`);
			console.log(`     UID   : ${e.uid}`);
			console.log(`     开始  : ${e.start.toISOString()}`);
			console.log(`     结束  : ${e.end ? e.end.toISOString() : '(无)'}`);
			console.log(`     时长  : ${e.end ? ((e.end - e.start) / 3600000).toFixed(1) + ' 小时' : '-'}`);
			if (e.attach) console.log(`     图片  : ${typeof e.attach === 'string' ? e.attach : e.attach.val}`);
		});
		console.log('');
		// 校验中文标题是否被完整还原（折行没切断多字节）
		const broken = events.filter((e) => /\uFFFD/.test(e.summary));
		console.log(`含乱码(替换字符)的事件: ${broken.length === 0 ? '✅ 0 个，折行未破坏 UTF-8' : '❌ ' + broken.length + ' 个'}`);
		const dup = new Set();
		let dupCount = 0;
		for (const e of events) {
			if (dup.has(e.uid)) dupCount++;
			dup.add(e.uid);
		}
		console.log(`UID 重复事件           : ${dupCount === 0 ? '✅ 0' : '❌ ' + dupCount}`);
	})
	.catch((err) => {
		console.log('══════════ 第三方解析器(node-ical) 解析结果 ══════════');
		console.log(`❌ 解析失败: ${err.message}`);
		process.exit(1);
	});
