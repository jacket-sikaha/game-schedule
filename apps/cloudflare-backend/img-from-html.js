const jsdom = require('jsdom');
const { JSDOM } = jsdom;
// nodejs环境下处理html文本
let s = `<p class="p">
			<img src="//i0.hdslb.com/bfs/game/e0dece0d867b9dd83e9030d289a6ddae1a9590f7.png" alt="" />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/4eda66d6f82b88c2903ff8a660cecac077c0821a.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/646d58b443193dd98e95b9452749b893a3335a93.png" alt="" />
		</p>
		<p class="p">
			【纪念8周年的特别活动！】
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■「★5（SSR）救世主梣（雨之魔女梣）」全新登场！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■救世主梣（雨之魔女梣）的体验关卡限时开放！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■「8周年纪念限定从者每日替换推荐召唤」开放！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■在各职阶选择的9骑★5（SSR）从者中必定可以召唤1骑的「Destiny Order召唤」开放！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■使用15个付费圣晶石可以进行召唤的限时卡池「8周年纪念福袋召唤（5周年之后 男女×登场顺序 12分割）」开放！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■御主任务中限时追加庆典&amp;主线关卡进度&amp;职阶星图分值星座解放任务！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■【常驻】追加可以获得圣晶石的特殊任务！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■强化大成功·极大成功率限时提升&amp;全部每日任务关卡AP消耗量限时降为1/2开放&amp;白纸化地球上的自由关卡的AP消耗量限时降为1/2！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■【常驻】第2部 第7章（后篇）为止的主线关卡AP消耗量降为1/2!此外，作为8周年纪念灵脉石限时再度登场！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■【常驻】从者和概念礼装的所持数·保管库数扩大&amp;指令纹章的所持数扩大！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■「从者强化任务 第16弹～8th Anniversary～特别篇」开放！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■【常驻】关卡通关时先发成员的牵绊点数获得量提升20%！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<br />
		</p>
		<p class="p" style="margin-left:0pt;">
			【在登录奖励中获得道具！】
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■8周年纪念特别次数登录奖励举办！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			【充实达·芬奇工房！】
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■【常驻】达·芬奇工房中追加过去的7种限时概念礼装&amp;通关特定章节后追加交换对象！此外，进行圣晶石召唤时追加魔力棱镜作为圣晶石消耗奖励！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■达·芬奇工房的「魔力棱镜交换」和「稀有魔力棱镜交换」中限时追加道具！</span>
		</p>
		<p class="p" style="margin-left:0pt;">
			<span style="color:#003399;">■【常驻】达·芬奇工房的「稀有魔力棱镜交换」中部分道具在通关特定章节后免费！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/d8d25b05b6166a04aed92a95b81c60f4ed1beb37.png" alt="" />
		</p>
		<p class="p">
			为了纪念「Fate/Grand Order」8周年，<span style="color:#E53333;">「</span><span style="color:#E53333;">★5（SSR）救世主梣（雨之魔女梣）」</span>全新登场！
		</p>
		<p class="p">
			新登场从者在开放中的<span style="color:#E53333;">「</span><span style="color:#E53333;">8周年纪念 救世主梣（雨之魔女梣）推荐召唤」</span>中被推荐召唤！
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/34afadaae5c856f84eb808181cddf2a110500900.png" alt="" />
		</p>
		<p class="p">
			※以上的「★5（SSR）救世主梣（雨之魔女梣）」的立绘为灵基再临第2阶段。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span><span style="color:#E53333;">「</span><span style="color:#E53333;">★5（SSR）救世主梣（雨之魔女梣）」相关的注意事项</span><span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※关于「★5（SSR）救世主梣（雨之魔女梣）」，「雨之魔女梣」完成灵基再临第2阶段后名称变为「救世主梣」。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/cababb5c5fde6af76f8ffc4963a7a10c7e002158.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「8周年纪念 救世主梣（雨之魔女梣）推荐召唤」<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			时间：2024年7月25日（周四）维护后~8月8日（周四）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			作为「Fate/Grand Order」8周年纪念，<span style="color:#E53333;">新登场从者「</span><span style="color:#E53333;">★5（SSR）救世主梣（雨之魔女梣）」和3种限时概念礼装被推荐召唤！</span>
		</p>
		<p class="p">
			日后将在剧情卡池中追加的概念礼装「★5（SSR）奥尔良之羊」和「★4（SR）八叉之血脉」将先行登场！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			「8周年纪念 救世主梣（雨之魔女梣）推荐召唤」的详情请参考对应公告。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/15306dcea07c11d8d59abc91b27996e07acb8d82.png" alt="" />
		</p>
		<p class="p">
			限时开放救世主梣（雨之魔女梣）的体验关卡！
		</p>
		<p class="p">
			御主可将「★5（SSR）救世主梣（雨之魔女梣）」作为助战从者加入编队挑战限时关卡！
		</p>
		<p class="p">
			抓住这个机会体验从者的技能和宝具吧！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			※救世主梣（雨之魔女梣）的体验关卡没有剧情，敬请注意。
		</p>
		<p class="p">
			※本关卡中的NPC从者不适用职阶星图分值效果。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>救世主梣（雨之魔女梣）体验关卡开放时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月8日（周四）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>开放条件<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">满足以下条件的御主即可参加</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">·通关「特异点F 燃烧污染都市 冬木」</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>关卡通关奖励<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">呼符</span><span style="color:#E53333;">&nbsp;1张</span>
		</p>
		<p class="p">
			<span style="color:#E53333;"><img src="//i0.hdslb.com/bfs/game/08f752c5e9cb693eff07766bdb4c9d5ec7d9e1d4.png" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/42ec42c498a8cdf83231f06808a650afb48bbf89.png" alt="" />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/226245dac532b6f977f7921f19ce73e489e70ce7.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「8周年纪念限定从者每日替换推荐召唤」<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			时间：2024年7月27日（周六）17:00~8月5日（周一）18:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			纪念8周年的「8周年纪念限定从者每日替换推荐召唤」将在7月27日（周六）17:00后开放！
		</p>
		<p class="p">
			除了<span style="color:#E53333;">限定从者中的</span><span style="color:#E53333;">14骑将被推荐召唤</span>之外，<span style="color:#E53333;">3种限时概念礼装</span>将在所有召唤卡池中被推荐召唤！
		</p>
		<p class="p">
			此外，日后将在剧情卡池中追加的概念礼装「★5（SSR）奥尔良之羊」和「★4（SR）八叉之血脉」将先行登场！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			「8周年纪念限定从者每日替换推荐召唤」的详情请参考对应公告。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/891461007749288352ed3219e5a78eb3312a94e5.png" alt="" />
		</p>
		<p class="p">
			为了纪念8周年，我们将实施<span style="color:#E53333;">特别登录奖励</span>。
		</p>
		<p class="p">
			<span style="color:#E53333;">在活动时间内登录</span><span style="color:#E53333;">10次（1天计1次）</span>，可以获得包含1张英灵结晶·流星之芙芙ALL阶★4（HP）、1张英灵结晶·日轮之芙芙ALL阶★4（ATK）、10个占星茶壶、<span style="color:#E53333;">10张呼符、1个迦勒底梦火、1个稀有魔力棱镜、1个传承结晶</span>在内的奖励！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间（为期2周）<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月26日（周五）4:00~8月9日（周五）3:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>奖励对象<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">2024年8月8日（周四）3:59之前通关「特异点F 燃烧污染都市 冬木」的御主</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※需要在上述时间前完成通关，通关后章节横幅处会出现「-完成-」字样，敬请注意。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「占星茶壶」使用期限<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月28日（周日）4:00~8月29日（周四）23:59为止
		</p>
		<p class="p">
			※「占星茶壶」有使用期限，在使用期限结束后「占星茶壶」将被删除，敬请注意。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			【特别<span style="color:#B8D100;">次数</span>登录奖励】
		</p>
		<img src="//i0.hdslb.com/bfs/game/6e8d52f92c4f4da092616f3bd27c220f82c1b72f.jpg" alt="" /><br />
		<p class="p">
			<span style="color:#E53333;">※登录奖励将于每日4:00发放</span>
		</p>
		<p class="p">
			※最多可领取10次奖励，但是根据成为活动对象的时间不同，可领取次数会发生变化。
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/3983b1e8e6aa544c78a6e121b9f584c6011d1ad0.png" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/7fd916629738ab8080084a6a076d6e95f222d5f2.png" alt="" />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/3c23f900b1d6a5dda0276282244c16381c3f0ed0.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「Destiny Order召唤」<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			时间：2024年7月25日（周四）维护后~8月8日（周四）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			纪念「Fate/Grand Order」8周年的「Destiny Order召唤」开放！
		</p>
		<p class="p">
			在「Fate/Grand Order」中，在所有的★5（SSR）从者中不同职阶各选1骑，在选择的9骑中<span style="color:#E53333;">必定可以获得1骑★5（SSR）从者！</span>
		</p>
		<p class="p">
			不要错过召唤中意从者的好机会！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#E53333;">※「Destiny Order召唤」仅可使用30个付费圣晶石进行召唤，无法使用免费圣晶石进行召唤，敬请注意。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※有关EXTRA职阶，从「Ruler、Avenger、MoonCancer」中选择1骑，从「Alterego、Foreigner、Pretender、Beast」中选择1骑。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※新登场从者「★5（SSR）救世主梣（雨之魔女梣）」不在选择对象之内，敬请注意。</span>
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/b5db54fdc9eb74557f8d1c129ecd30644570dbf2.png" alt="" />
		</p>
		<p class="p">
			「Destiny Order召唤」的详情请参考对应公告。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/c2877367384040d792a97a02580a622233a94cd7.png" alt="" />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/0ec083848c533167bf922116eca7d250d0fcdb71.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「8周年纪念福袋召唤（5周年之后 男女×登场顺序 12分割）」<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			时间：2024年7月25日（周四）维护后~8月8日（周四）13:59为止
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/2d4f388677f67222611e2989574dad8986ebcd71.png" alt="" />
		</p>
		<p class="p">
			「8周年纪念福袋召唤（5周年之后 男女×登场顺序 12分割）」的详情请参考对应公告。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/ab4ec857ba8318ce71d8d7d1830148c25897e4c5.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>纪念8周年的庆典任务限时开放！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			在以下时间段内，「御主任务」的「限定」一栏内将限时追加「8周年限时庆典任务」！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			完成所有任务，可以获得<span style="color:#E53333;">20个圣晶石！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>领取时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月18日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>8周年限时庆典任务<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/2c5c9badb4e15a1a7223cc8fada51850e3111d79.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			※活动时间与奖励领取时间不同，敬请注意。
		</p>
		<p class="p">
			※完成「【8周年限时庆典任务】」不会增加周常任务进度。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>御主任务中限时追加主线关卡进度任务！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			在以下时间段内，「御主任务」的「限定」一栏内将限时追加「主线关卡进度」相关任务！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			完成所有任务，可以获得<span style="color:#E53333;">30个圣晶石、3000万量子！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>领取时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月18日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>主线关卡进度任务<span style="color:#003399;">◆</span>
		</p>
		<img src="//i0.hdslb.com/bfs/game/fb1367c814aeb2ca09cb2e51d27cf7016197e25b.jpg" alt="" /><br />
		<p class="p">
			※活动时间与奖励领取时间不同，敬请注意。
		</p>
		<p class="p">
			※完成「【8周年纪念】任务」不会增加周常任务进度。
		</p>
		<p class="p">
			※已经通关所有主线关卡的情况下，任务将自动完成。
		</p>
		<p class="p">
			<span style="color:#E53333;">※主线关卡第2部 第5.5章、第2部 第6.5章、亚种特异点（I至Ⅳ为止）、主线物语不在任务对象内，敬请注意。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>御主任务中限时追加职阶星图分值星座解放任务！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			在以下时间段内，「御主任务」的「限定」一栏内将限时追加「职阶星图分值星座解放」相关任务！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>领取时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月18日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>职阶星图分值星座解放任务<span style="color:#003399;">◆</span>
		</p>
		<img src="//i0.hdslb.com/bfs/game/1a257f88d7fc02cf61e247fc5aed6110b3098ef8.jpg" alt="" /><br />
		<p class="p">
			※活动时间与奖励领取时间不同，敬请注意。
		</p>
		<p class="p">
			※完成本次任务不会增加周常任务进度。
		</p>
		<p class="p">
			※已经解放1个或更多星座的情况下，任务将自动完成。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>完成报酬的领取方法<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			御主任务界面中显示的「限定」一栏内将显示相关任务，请点击已经完成的任务领取完成奖励。
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/e71143ef9449cf398f2644460637d34f3685ad79.png" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/f9059c373e3a6ce2865b89d6b0df4798e5cfbed8.png" alt="" />
		</p>
		<p class="p">
			御主任务（特殊任务）中，将追加主线关卡第2部 第7章（包含第2部 第6.5章「死想显现界域 Traum」）的通关和「强化任务关卡」「幕间物语」「主线剧情地图的自由关卡」各自的达成通关次数的全新任务。
		</p>
		<p class="p">
			此外，也将追加解放职阶星图分值星座即可完成的任务。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			完成所有任务，最多可以获得<span style="color:#E53333;">284个圣晶石！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#E53333;">※已经达成各任务条件的御主同样可以领取完成报酬。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>更新时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/d34cb5e7cfa7659df9cd132eb37f18988cfed424.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>主线剧情通关任务<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/1441508776ea8f7c47cb9e19c78afa98cad85102.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※『Lostbelt No.7（前篇）』为第1节~第10节，『Lostbelt No.7（后篇）』为第11节及之后的章节。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>强化任务关卡通关任务<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/8a57ce1e8eccddc5e7d176e3f5543e9d495af966.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			※「通关280个强化任务关卡」和「通关290个强化任务关卡」也包含「从者强化任务 第16弹～8th Anniversary～特别篇」中日后开放的强化任务关卡。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>幕间物语通关任务<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/6a11ad46c96a4a5268da505de0e7dc0f9265d7dd.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>自由关卡通关任务<span style="color:#003399;">◆</span>
		</p>
		<img src="//i0.hdslb.com/bfs/game/7fdc74af8ca8cd089b418808b3cf3e3b17419692.jpg" alt="" /><br />
		<p class="p">
			※「通关主线剧情地图的自由关卡」的任务对象也包含「白纸化地球上的自由关卡」。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>进阶关卡通关任务<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/deafcd4775ea0c58f5610061b0ca7752789ad03a.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>职阶星图分值星座解放任务<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/92869b6b08023755014afa2e79c44f2fd68c354e.jpg" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>完成报酬的领取方法<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			御主任务界面中显示的「特殊」一栏内将显示相关任务，请点击已经完成的任务领取完成奖励。
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/8f9ee1dc5a6079f353539a2224018bd4ab0c1a91.png" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/847a2a15d3040abcf2ff79ac2e4dcdeb05de8b47.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>从者&amp;概念礼装强化大成功·极大成功率限时提升为<span style="color:#E53333;">3倍！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			在以下时间段内强化从者和概念礼装时，大成功（经验值2倍奖励）·极大成功（经验值3倍奖励）的发生率限时提升为3倍！
		</p>
		<p class="p">
			趁此机会强化中意的从者和概念礼装吧！
		</p>
		<p class="p">
			<span style="color:#E53333;">※概念礼装强化&amp;进化时的大成功·极大成功的获得经验值增加不适用于「累积经验值」。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/a876daace7b486746a087bc49039aa9f1c6737f7.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>所有每日任务关卡的AP消耗量限时降为1/2！「搜集种火」和「修炼场」限时全部开放！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			迦勒底之门中出现的<span style="color:#E53333;">所有每日任务关卡的AP消耗量限时降为1/2！</span>（即使在战斗中撤退，AP消耗量也会降为1/2）
		</p>
		<p class="p">
			此外，迦勒底之门中出现的每日任务关卡<span style="color:#E53333;">「搜集种火」和「修炼场」将限时全部开放。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>对象关卡<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			･所有「搜集种火」关卡
		</p>
		<p class="p">
			･所有「修炼场」关卡
		</p>
		<p class="p">
			･所有「打开宝物库之门」关卡
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#E53333;">※限时出现的「搜集种火」和「修炼场」关卡将继承平时的「搜集种火」和「修炼场」关卡中的「关卡情报」。</span>
		</p>
		<p class="p">
			※以下为每日任务关卡的详细情况。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p" align="center" style="text-align:center;">
			<strong><span style="color:#337FE5;">【打开宝物库之门、搜集种火&nbsp;关卡的推荐等级和AP消耗量】</span></strong>
		</p>
		<p class="p" align="center" style="text-align:left;">
			<strong><span style="color:#337FE5;"><img src="//i0.hdslb.com/bfs/game/a6945a4a1ca03e6efdc6a3a8968ee6bef3d01062.jpg" alt="" /><br />
		</span></strong>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p" align="center" style="text-align:center;">
			<strong><span style="color:#337FE5;">【修炼场&nbsp;关卡的推荐等级和AP消耗量】</span></strong>
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/c3cc8effbf324cbfaf94e7f6337f39b18a204620.jpg" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p" align="center" style="text-align:center;">
			<strong><span style="color:#337FE5;">【每日任务一览】</span></strong>
		</p>
		<img src="//i0.hdslb.com/bfs/game/d8db7882224731526dffa236609358232c9927d9.jpg" alt="" /><br />
		<p class="p">
			※Berserker职阶适合挑战所有每日任务关卡。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>白纸化地球上的自由关卡的AP消耗量限时降为1/2！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			我们将限时实施<span style="color:#E53333;">白纸化地球上的自由关卡（「奏章I」的自由关卡除外）的AP消耗量降为1/2</span>的活动！
		</p>
		<p class="p">
			※将如常消耗「风暴罐」。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>对象关卡<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			･白纸化地球上的自由关卡（「奏章I」的自由关卡除外）
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/6fd4f713c1abda0e91c890b8313dc47237d7f0fe.png" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/848a307696a8b2c391c032f88a3133ee045111de.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>【常驻】达·芬奇工房中追加过去的7种限时概念礼装！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			达·芬奇工房的「<span style="color:#E53333;">魔力棱镜交换</span>」中将常驻追加在过去的限时活动中登场过的7种活动限定概念礼装！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#E53333;">※已经拥有对象活动限定概念礼装的情况下，也可以在「魔力棱镜交换」中获得。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/5f4db147f38cd58baa5797ab5b34c77591aa17f0.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加内容（常驻）<span style="color:#003399;">◆</span>
		</p>
		<img src="//i0.hdslb.com/bfs/game/d8bfe6e25e02f9758a86bb79bfa6efd3db9c542d.jpg" alt="" /><br />
		<p class="p">
			<span style="color:#E53333;">※「魔力棱镜交换」中追加的活动限定概念礼装为常驻道具，没有交换期限。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>【常驻】通关奏章序幕后「魔力棱镜交换」每月的交换对象中追加强化素材！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">面向通关奏章序幕「Ordeal Call 序」的御主</span>，「魔力棱镜交换」中每月1日更新的交换对象道具中，<span style="color:#E53333;">将常驻追加「兽之足迹」「英灵结晶·流星之芙芙ALL阶★4（HP）」「英灵结晶·日轮之芙芙ALL阶★4（ATK）」。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>交换条件<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">满足以下条件的御主可以进行交换</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">·通关奏章序幕「Ordeal Call 序」</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「魔力棱镜交换」追加道具<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/42e349ef70a85f1f6d5d501868829c0cf388aae3.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※「魔力棱镜交换」中可以交换的道具每月1日的0:00更新。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※2024年7月追加道具的交换期限为2024年7月31日（周三）23:59为止，敬请注意。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>【常驻】进行圣晶石召唤时追加魔力棱镜作为圣晶石消耗奖励！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			2024年7月25日（周四）维护后开始，进行所有圣晶石召唤时（无论使用付费、免费圣晶石），<span style="color:#E53333;">作为圣晶石消耗奖励可以获得魔力棱镜！</span>
		</p>
		<p class="p">
			进行1次圣晶石召唤可以获得<span style="color:#E53333;">5</span>个魔力棱镜作为圣晶石消耗奖励（进行11连召唤时可以获得<span style="color:#E53333;">50</span>个）。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			获得魔力棱镜的机会增加了，还请活用以获取「魔力棱镜交换」中常驻追加的过去活动中登场的概念礼装吧！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>圣晶石消耗奖励魔力棱镜相关的注意事项<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			※获得的魔力棱镜将直接在所持道具中追加。
		</p>
		<p class="p">
			※已经持有数量上限的魔力棱镜的情况下，无法获得作为圣晶石消耗奖励的魔力棱镜，敬请注意。
		</p>
		<p class="p">
			<span style="color:#E53333;">※使用呼符进行召唤时无法获得魔力棱镜。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※在进行每10次召唤的「＋1次额外召唤」时无法获得。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※进行11连召唤（10次+1次额外召唤）时可以获得50个魔力棱镜，进行2次召唤（10次+1次额外召唤）时可以获得5个魔力棱镜。</span>
		</p>
		<p class="p">
			※「新手引导召唤」（游戏开始后新手引导中进行的圣晶石召唤）「Destiny Order召唤」「福袋召唤」中也可以获得魔力棱镜。
		</p>
		<p class="p">
			<span style="color:#E53333;">※「新人御主冲刺福袋召唤」中无法获得魔力棱镜，敬请注意。</span>
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/dd0268fd4f525ccdf13d1b27706eaac4112be9bd.png" alt="" />
		</p>
		<p class="p">
			可以确认过去的召唤结果的「召唤履历」中将显示作为圣晶石消耗奖励获得的魔力棱镜数量。
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/335431710112dd60925b6de8c886d55fefd9fde3.png" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/44dd1f7898405e442420bfd6333a31e6e22c9add.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>【常驻】第2部 第6.5章和第7章（后篇）为止的主线关卡AP消耗量降为1/2!
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			2024年7月25日（周四）维护后开始，第2部 第6.5章和第7章（后篇）为止的主线关卡的AP消耗量降为1/2的限时效果将调整为永久生效。
		</p>
		<p class="p">
			此外，主线关卡战斗中败北时可以续关的「灵脉石」也再度登场，还请在推进主线关卡时活用吧。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/72b3bf0df799695caa252d46b8bc2dceb56b0bed.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>续关道具「灵脉石」限时再度登场！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			主线关卡战斗中败北时可以续关的道具「<span style="color:#E53333;">灵脉石</span>」将在「Fate/Grand Order ～8th Anniversary～」中作为限时道具再度登场！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p" align="justify" style="text-align:justify;">
			在以下时间段内<span style="color:#E53333;">首次登录游戏时，可以获得1次「灵脉石」作为登录奖励。</span>
		</p>
		<p class="p" align="justify" style="text-align:justify;">
			<br />
		</p>
		<p class="p" align="justify" style="text-align:justify;">
			<span style="color:#E53333;">此外，「灵脉石」有使用时间限制，超过使用期限后，「灵脉石」将被删除，敬请注意。</span>
		</p>
		<p class="p" align="justify" style="text-align:justify;">
			<br />
		</p>
		<p class="p" align="justify" style="text-align:justify;">
			使用「灵脉石」后无需消耗3画令咒或圣晶石即可进行续关。在主线剧情中遇到强敌时，请活用「灵脉石」吧！
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/f970c4033ad23f28e4a55d89ad332f39368dd496.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#E53333;">※「灵脉石」可在包含亚种特异点在内的主线剧情中使用。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※限时活动和主线物语中无法使用「灵脉石」，敬请注意。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>奖励对象<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">所有御主</span>
		</p>
		<p class="p">
			※新御主需要通关「特异点F 燃烧污染都市 冬木 第3节 进行度1」。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>登录奖励发放时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月26日（周五）4:00~8月26日（周一）3:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			◆登录奖励内容◆
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/d14e25232a4244063887d432f6acf102440a46f6.jpg" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>可使用的对象关卡<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			·所有第1部至第2部的主线关卡
		</p>
		<p class="p">
			※也包含亚种特异点（I至IV为止）、第5.5章、第6.5章、「奏章I 虚数罗针内界 平面之月」。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>道具使用期限<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">2024年7月25日（周四）维护后~8月26日（周一）23:59为止</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">▶</span>达·芬奇工房内的「魔力棱镜交换」中限时追加<span style="color:#E53333;">灵脉石！</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			达·芬奇工房内的「<span style="color:#E53333;">魔力棱镜交换</span>」中将限时追加灵脉石。
		</p>
		<p class="p">
			请一定趁此机会获得有利于通关主线关卡的道具吧！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#E53333;">此外，「灵脉石」有使用时间限制，超过使用期限后，「灵脉石」将被删除，敬请注意。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>道具交换时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月25日（周日）23:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加道具<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/c95c34ace3d770b8ee0205c306421dffca15f22c.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※「灵脉石」可在包含亚种特异点在内的主线剧情中使用。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※限时活动和主线物语中无法使用「灵脉石」，敬请注意。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">&nbsp;</span>
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>可使用的对象关卡<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			·所有第1部至第2部的主线关卡
		</p>
		<p class="p">
			※也包含亚种特异点（I至IV为止）、第5.5章、第6.5章、「奏章I 虚数罗针内界 平面之月」。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>道具使用期限<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月26日（周一）23:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/f0c671c9fc729409d0ff28965075e989617fd8bb.png" alt="" />
		</p>
		<p class="p">
			所有御主的「从者」「概念礼装」持有栏位和保管栏位各<span style="color:#E56600;">扩大100</span>个。此外，「指令纹章」持有栏位<span style="color:#E53333;">扩大50个</span>。
		</p>
		<p class="p">
			另外，达·芬奇工房内「增加从者保管栏位」和「增加概念礼装保管栏位」中，使用魔力棱镜可追加的保管栏位的上限增加20次（共100栏位）。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>更新时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			【持有栏位的增加数量】
		</p>
		<img src="//i0.hdslb.com/bfs/game/676ae7867abff75a9b903b8e57a57a34ae3499a8.jpg" alt="" />&nbsp;<br />
		<p class="p">
			【保管栏位的增加数量】
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/0017d0a8bb360eed28bafe6a39753635704598de.jpg" alt="" />
		</p>
		<p class="p">
			<span style="color:#E53333;">※有关增加从者和概念礼装的保管栏位，增加1次需要消耗50魔力棱镜。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/f0c671c9fc729409d0ff28965075e989617fd8bb.png" alt="" />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/9a57e020ca8f9c6602be7525b1800a7bf31c1ee0.png" alt="" />
		</p>
		<p class="p">
			「从者强化任务&nbsp;第16弹～8th Anniversary～特别篇」举办！
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			强化从者能力的特别关卡「从者强化任务」第16弹开放！
		</p>
		<p class="p">
			为了纪念「Fate/Grand Order ～8th Anniversary～」的举办，此次共常驻追加14骑从者的强化关卡！
		</p>
		<p class="p">
			迦勒底之门中，连续7天每天都会有对象从者的强化任务开放。
		</p>
		<p class="p">
			通关关卡后不仅可以强化对象从者，还可以获得圣晶石奖励。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			※从者强化任务关卡无剧情内容，敬请注意。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>开放条件<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			拥有本次强化的对象从者并完成<span style="color:#E53333;">最终再临。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※若尚未拥有对象从者，则对应的强化任务关卡不会出现。</span>
		</p>
		<p class="p">
			※本次开放的强化任务关卡不是限时关卡。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			「从者强化任务&nbsp;第16弹～8th Anniversary～特别篇」的详情请参考对应公告。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/c5cbb0cdc69b48fb98c2ecb05d10c1b986293ac1.png" alt="" />
		</p>
		<p class="p">
			达·芬奇工房内「<span style="color:#E53333;">魔力棱镜交换</span>」和「<span style="color:#E53333;">稀有魔力棱镜交换</span>」中限时追加道具！
		</p>
		<p class="p">
			此外，「魔力棱镜交换」的部分道具将在<span style="color:#003399;">通关奏章序幕「Ordeal Call 序」后</span>作为交换对象追加。
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/c470b49e06fbd41a182790c3cf602eadb6afeecc.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「魔力棱镜交换」追加道具<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/7975156d52136b22468f6b1a55af8d001c0ea899.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>「稀有魔力棱镜交换」追加道具<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/8a98cfcac355aab3066f717b8e5694983257bf05.jpg" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/15cfda057e0e2ff196f4d0e2948edae95c09f308.png" alt="" />
		</p>
		<p class="p">
			在达·芬奇工房的「稀有魔力棱镜交换」中可以使用的「魔力棱镜交换限定★5概念礼装开放权」将在通关特定章节后开放免费交换！
		</p>
		<p class="p">
			各开放权是在「魔力棱镜交换」中开放对象「魔力棱镜交换限定★5概念礼装」的权利，实际交换时每次需要消耗1000个魔力棱镜。
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>免费交换时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			◆「魔力棱镜交换限定★5概念礼装开放权」相关的注意事项◆
		</p>
		<p class="p">
			※已经获得「魔力棱镜交换限定★5概念礼装开放权」的御主无法交换。
		</p>
		<p class="p">
			<span style="color:#E53333;">※已经使用1个稀有魔力棱镜交换「魔力棱镜交换限定★5概念礼装开放权」并达成免费交换条件的情况下，将返还交换中使用的1个稀有魔力棱镜至礼物盒。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※使用1个稀有魔力棱镜交换「魔力棱镜交换限定★5概念礼装开放权」后达成免费开放条件的情况下，将返还交换中使用的1个稀有魔力棱镜至礼物盒。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>免费交换对象道具（常驻）<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			<span style="color:#003399;"><img src="//i0.hdslb.com/bfs/game/81223912611d58540d1b81b5f48bfe319ce6532a.jpg" alt="" /><br />
		</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※「灵脉石」可在包含亚种特异点在内的主线剧情中使用。</span>
		</p>
		<p class="p">
			<span style="color:#E53333;">※限时活动和主线物语中无法使用「灵脉石」，敬请注意。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/b85683e5fed9bba5a61e0131c52bc262339021b6.png" alt="" />
		</p>
		<p class="p">
			2024年7月25日（周四）维护后开始，队伍的先发队员在关卡通关时牵绊点数的获得量提升20%！
		</p>
		<p class="p">
			当有助战从者或NPC从者被编入先发队员的情况下，根据编入先发队员的助战从者或NPC从者的数量，每骑都能使队伍中自己的从者的牵绊点数获得量提升4%。
		</p>
		<p class="p">
			<span style="color:#003399;">例：先发队员中编入1骑助战从者的情况</span>
		</p>
		<p class="p">
			·先发成员的牵绊点数获得量提升24%
		</p>
		<p class="p">
			·支援成员的牵绊点数获得量提升4%
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#E53333;">※由于「玛修·基列莱特」在通关特定章节前无法获得牵绊点数，故在此期间的「玛修·基列莱特」不在牵绊点数获得量提升的范围之内。</span>
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>追加时间（常驻）<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>对象关卡<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			·编入先发成员的所有关卡
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/0b1ef1b6b5b95b75fa1bd511912c06c2b41ac3f4.png" alt="" />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<br />
		</p>
		<p class="MsoNormal">
			<br />
		</p>`;

const dom = new JSDOM(s);
const as1d = dom.window.document.createElement('div');

as1d.innerHTML = s;

new Promise((resolve, reject) => {
	// 等as1d加载完才能获取到里面节点
	const im2gs = as1d.querySelector('img');
	console.log('imgs', im2gs?.src);
	resolve(im2gs);
});
