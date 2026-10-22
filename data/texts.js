// Reading texts. Hand-segmented: words separated by spaces, punctuation attached, new line = line break.
// Names: {小明|xiǎo míng} (pinyin needed on first use only). A {name} that is also a word (北京) counts as a word.
// A non-default reading: 长=zhǎng. Speaker labels like "A：" are plain Latin letters.
// After editing, run:  node tools/validate.js
// cat is one of: story, dialogue, news, diary, culture
var TEXTS = [
  {
    id: "d1", cat: "diary", title: "我的星期六", titleEn: "My Saturday",
    text: `今天 是 星期 六，我 不 工作。早上 我 起床 以后，先 喝 了 一 杯 茶，然后 吃 了 米饭 和 水果。上午 我 去 商店 买 了 一些 东西。下午 我 在 家 看 电视。晚上 我 和 朋友 一起 吃饭。我 觉得 今天 很 高兴。`,
    en: `Today is Saturday, so I'm not working. After I got up this morning, I first drank a cup of tea, then ate rice and fruit. Later in the morning I went to the shop and bought a few things. In the afternoon I watched TV at home. In the evening I had dinner with a friend. I felt very happy today.`
  },
  {
    id: "d2", cat: "diary", title: "去医院", titleEn: "A trip to the hospital",
    text: `昨天 我 觉得 不 舒服，头 很 疼，还 发烧 了。妈妈 说：“你 应该 去 医院 看 医生。”我 在 医院 等 了 很 久。医生 检查 了 我 的 身体，说 我 感冒 了，不 是 大 问题，但是 需要 多 休息。医生 给 了 我 一些 药。回 家 以后，我 吃 了 药 就 睡觉 了。`,
    en: `Yesterday I didn't feel well. My head ached and I had a fever too. Mum said, "You should go and see a doctor at the hospital." I waited at the hospital for a long time. The doctor examined me and said I had a cold. It wasn't a big problem, but I needed to rest a lot. The doctor gave me some medicine. After I got home I took the medicine and went to sleep.`
  },
  {
    id: "g1", cat: "dialogue", title: "在商店", titleEn: "At the shop",
    text: `A：你好！你 想 买 什么？
B：我 想 买 苹果。一 个 多少 钱？
A：三 块。
B：三 块？太 贵 了！昨天 很 便宜。
A：对不起，今天 苹果 不 太 多，所以 贵 一点儿。你 要 不 要 西瓜？
B：西瓜 不 要，谢谢。我 买 两 个 苹果 吧。
A：好 的，六 块。`,
    en: `A: Hello! What would you like to buy?
B: I'd like apples. How much is one?
A: Three yuan.
B: Three yuan? That's too expensive! It was cheap yesterday.
A: Sorry, there aren't many apples today, so they cost a bit more. Would you like a watermelon?
B: No watermelon, thank you. I'll buy two apples.
A: OK, that's six yuan.`
  },
  {
    id: "s1", cat: "story", title: "小明和他的狗", titleEn: "Xiaoming and his dog",
    text: `{小明|xiǎo míng} 有 一 只 狗。狗 的 名字 叫 {大黄|dà huáng}。每天 早上，{小明} 都 和 {大黄} 一起 去 公园 玩。公园 里 有 很 多 人，也 有 很 多 狗。{大黄} 喜欢 和 小 狗 一起 跑。{小明} 坐 在 椅子 上 看 书，觉得 很 高兴。`,
    en: `Xiaoming has a dog. The dog's name is Dahuang. Every morning, Xiaoming goes to the park with Dahuang to play. There are lots of people in the park, and lots of dogs too. Dahuang likes to run with the little dogs. Xiaoming sits on a chair reading a book and feels very happy.`
  },
  {
    id: "n1", cat: "news", title: "明天的天气", titleEn: "Tomorrow's weather",
    text: `明天 的 天气：{北京} 上午 是 晴天，下午 会 下雨，天气 很 冷。晚上 有 风。出去 的 时候，请 带 一 把 伞，多 穿 一 件 衣服。后天 会 更 冷，大家 要 注意 身体。`,
    en: `Tomorrow's weather: in Beijing it will be sunny in the morning and rain in the afternoon, and it will be cold. There will be wind in the evening. When you go out, please take an umbrella and wear extra clothes. The day after tomorrow will be even colder, so everyone should look after their health.`
  },
  {
    id: "g2", cat: "dialogue", title: "请问，地铁站在哪儿？", titleEn: "Excuse me, where is the metro station?",
    text: `A：请 问，地铁 站 在 哪儿？
B：你 看，前面 有 一 个 医院。它 就 在 医院 右边。
A：远 不 远？
B：不 远，你 走 十 分钟 就 到 了。
A：我 要 去 看 朋友，今天 很 忙。
B：那 你 快 去 吧！
A：太 好 了！谢谢 你！
B：不客气。再见！`,
    en: `A: Excuse me, where is the metro station?
B: Look, there's a hospital ahead. It's just to the right of the hospital.
A: Is it far?
B: Not far. It takes you ten minutes to walk there.
A: I'm going to see a friend and I'm very busy today.
B: Then hurry up and go!
A: That's great! Thank you!
B: You're welcome. Goodbye!`
  },
  {
    id: "g3", cat: "dialogue", title: "在饭店", titleEn: "At the restaurant",
    text: `A：你好！你们 几 个 人？
B：我们 两 个 人。
A：请 坐。这 是 菜单。你们 想 吃 什么？
B：我 想 吃 面条，她 想 吃 鱼。
A：你们 想 喝 什么？
B：我 喝 茶，她 喝 水。
A：好 的，请 等 一下。
B：这 个 鱼 很 好吃！服务员，多少 钱？
A：二 十 八 块。
B：给 你 钱。谢谢！
A：不客气，再见！`,
    en: `A: Hello! How many people are you?
B: Two of us.
A: Please sit down. Here is the menu. What would you like to eat?
B: I'd like noodles, and she'd like fish.
A: What would you like to drink?
B: I'll have tea, and she'll have water.
A: OK, please wait a moment.
B: This fish is delicious! Waiter, how much is it?
A: Twenty-eight yuan.
B: Here's the money. Thank you!
A: You're welcome. Goodbye!`
  },
  {
    id: "s2", cat: "story", title: "小红的帽子", titleEn: "Xiaohong's hat",
    text: `{小红|xiǎo hóng} 有 一 个 新 帽子。帽子 是 红 的，很 漂亮。她 很 喜欢 它。
昨天 下午，她 在 学校 玩。回 到 家，帽子 不 在 了。她 很 不 高兴。
妈妈 说：“别 不 高兴，我们 一起 去 找 吧。”
她 和 妈妈 去 了 学校，找 了 一 个 小时，也 没有。后来，一 个 学生 说：“是 你 的 帽子 吗？我 在 椅子 上 看见 它 了。”
{小红} 笑 了，说：“谢谢 你！”`,
    en: `Xiaohong has a new hat. The hat is red and very pretty. She likes it very much.
Yesterday afternoon she was playing at school. When she got home, the hat was gone. She was very unhappy.
Mum said, "Don't be sad. Let's go and look for it together."
She and her mum went to the school and searched for an hour, but found nothing. Later, a student said, "Is this your hat? I saw it on a chair."
Xiaohong smiled and said, "Thank you!"`
  },
  {
    id: "n2", cat: "news", title: "新地铁明天开始", titleEn: "The new metro opens tomorrow",
    text: `{北京} 的 新 地铁 明天 开始 了。它 从 学校 到 火车站，有 八 个 站。坐 地铁 二 十 分钟 就 到 了，比 公共汽车 快 很 多。每天 早上 六 点 到 晚上 十 点 都 有。票 很 便宜，一 次 两 块 钱。很 多 人 说，新 地铁 对 大家 都 很 方便。`,
    en: `Beijing's new metro line opens tomorrow. It runs from the school to the railway station and has eight stops. The ride takes just twenty minutes, much faster than the bus. It runs every day from six in the morning until ten at night. Tickets are cheap, two yuan a trip. Many people say the new metro is very convenient for everyone.`
  },
  {
    id: "c1", cat: "culture", title: "春节", titleEn: "Spring Festival",
    text: `春节 是 中国 最 大 的 节日。这 时候，大家 都 回 家。
妈妈 买 了 很 多 菜 和 水果。晚上，我们 一 家 人 一起 吃饭，很 高兴。孩子 都 穿 新 衣服。
很 多 朋友 说：“春节 快乐！”
它 有 一 个 星期，大家 都 不 上班。我 很 喜欢 它。`,
    en: `Spring Festival is China's biggest holiday. At this time everyone goes home.
Mum buys lots of dishes and fruit. In the evening our whole family eats together, and we are very happy. The children all wear new clothes.
Many friends say, "Happy Spring Festival!"
It lasts a week, and nobody goes to work. I like it very much.`
  },
  {
    id: "c2", cat: "culture", title: "喝茶", titleEn: "Drinking tea",
    text: `中国 人 喜欢 喝 茶。中国 有 很 多 茶：有 红 茶，也 有 绿 茶。
早上，很 多 人 喝 一 杯 茶。朋友 来 家 里，我们 请 他 喝 茶。
喝 茶 要 慢 一点儿，不 要 太 快。
茶 对 身体 很 好。我 爸爸 每天 都 喝 三 杯 茶。`,
    en: `Chinese people like drinking tea. China has many kinds of tea: there is black tea and also green tea.
In the morning, many people have a cup of tea. When friends come to our home, we invite them to have tea.
You should drink tea slowly, not too fast.
Tea is very good for your health. My dad drinks three cups of tea every day.`
  }
];
