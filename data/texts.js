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
它 有 一 个 星期，大家 都 不 上班。我 爱 我 的 家 人，我 很 喜欢 它。`,
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
  },
  {
    id: "d3", cat: "diary", title: "新同事", titleEn: "A new colleague",
    text: `今天 公司 来 了 一 个 新 同事，他 叫 {王明|wáng míng}。他 二 十 五 岁，是 {北京} 人。
中午，我们 一起 去 饭店 吃饭。他 喜欢 吃 羊肉 和 面条。他 问 了 我 很 多 问题：公司 在 哪儿？哪儿 有 好吃 的 饭店？
下午，我 帮助 他 找 到 椅子 和 桌子。
我 觉得 他 很 好，我们 会 是 好 朋友。`,
    en: `Today a new colleague joined the company. His name is Wang Ming. He is twenty-five and from Beijing.
At noon we went to a restaurant together. He likes lamb and noodles. He asked me lots of questions: Where is the company? Where are the good restaurants?
In the afternoon I helped him find a chair and a desk.
I think he's nice, and I think we'll be good friends.`
  },
  {
    id: "s3", cat: "story", title: "小熊猫北北", titleEn: "Beibei the little panda",
    text: `有 一 只 小 熊猫，名字 叫 {北北|běi běi}。它 很 可爱，喜欢 吃 竹子，也 喜欢 睡觉。
今天 天气 很 好，{北北} 想 出去 玩。它 看见 一 只 小 狗。
小 狗 说：“你好！你 在 做 什么？”
{北北} 说：“我 想 找 朋友。你 可以 和 我 玩 吗？”
小 狗 笑 了：“好 的！”
{北北} 和 小 狗 一起 玩 了 一 个 下午。晚上，{北北} 回 家 了。它 很 高兴，因为 它 有 了 新 朋友。`,
    en: `There was a little panda called Beibei. She was very cute, and liked eating bamboo and sleeping too.
The weather was lovely today and Beibei wanted to go out and play. She saw a little dog.
The little dog said, "Hello! What are you doing?"
Beibei said, "I'm looking for a friend. Would you like to play with me?"
The little dog smiled: "Sure!"
Beibei and the little dog played together all afternoon. In the evening Beibei went home. She was very happy, because she had a new friend.`
  },
  {
    id: "n3", cat: "news", title: "汉语比赛", titleEn: "The Chinese contest",
    text: `学校 有 一 个 汉语 比赛，星期 六 开始。很 多 学生 想 参加。
它 有 三 个 题：读 书，写 字，说话。
老师 说：“不 要 太 快，慢 一点儿。”
最 好 的 学生 可以 去 {北京} 玩。请 你 来 看 吧。`,
    en: `The school is holding a Chinese contest, starting on Saturday. Many students want to take part.
It has three parts: reading, writing and speaking.
The teacher says, "Don't go too fast. Slow down a little."
The best student can go to Beijing for a visit. Please come and watch.`
  },
  {
    id: "c3", cat: "culture", title: "汉字", titleEn: "Chinese characters",
    text: `中国 的 字 叫 汉字。我 每天 在 学校 学习 它，写 十 个 字。
我 喜欢 “月” 字，因为 它 就 是 月亮。
老师 说：“多 写，多 读，你 会 学习 得 很 好。”
现在 我 认识 三 百 个 字 了！`,
    en: `Chinese writing is called hanzi. Every day at school I study it and write ten characters.
I like the character "月", because it is the moon.
The teacher says, "Write more, read more, and you will do very well."
Now I know three hundred characters!`
  },
  {
    id: "g4", cat: "dialogue", title: "打电话", titleEn: "A phone call",
    text: `A：喂，你好！我 是 {小明|xiǎo míng}。你 现在 忙 吗？
B：不 忙，你 有 什么 事情？
A：明天 星期 六，我们 去 爬山 吧。
B：好 的！几 点 去？
A：早上 八 点，在 学校 前面 见面。
B：八 点？我 还 想 睡觉！
A：那 九 点，可以 吗？
B：好 的。我 带 水 和 水果。
A：好，那 明天 再见！`,
    en: `A: Hello! It's Xiaoming. Are you busy right now?
B: No. What's up?
A: Tomorrow is Saturday. Let's go hiking.
B: OK! What time?
A: Eight in the morning. Let's meet in front of the school.
B: Eight? I still want to sleep!
A: Then nine o'clock. Is that all right?
B: OK. I'll bring water and fruit.
A: Great, see you tomorrow!`
  },
  {
    id: "d4", cat: "diary", title: "我怎么学汉语", titleEn: "How I study Chinese",
    text: `我 学习 汉语 已经 两 年 了。
每天 早上，我 先 听 汉语 新闻。虽然 有 的 我 听 不 懂，但是 我 觉得 很 有 意思。
下午，我 看 书，写 汉字。
晚上，我 和 中国 朋友 聊天。他 说 我 的 汉语 很 好。
学习 汉语 不 容易，但是 我 一定 会 努力。`,
    en: `I've been studying Chinese for two years now.
Every morning I start by listening to the Chinese news. Although there are parts I don't understand, I find it very interesting.
In the afternoon I read and write characters.
In the evening I chat with my Chinese friend. He says my Chinese is very good.
Studying Chinese isn't easy, but I will definitely work hard.`
  },
  {
    id: "s4", cat: "story", title: "一个决定", titleEn: "A decision",
    text: `{李明|lǐ míng} 在 一 个 小 公司 工作。他 有 一 个 新 工作 的 机会，但是 新 公司 在 {北京}，离 他 家 很 远。
他 想 了 一 个 星期，不 知道 怎么 做。
妈妈 说：“你 觉得 什么 好，就 做 什么。”
他 问 朋友，朋友 说：“去 吧！{北京} 很 大，有 很 多 机会。”
他 说：“好，我 决定 去 {北京}！”`,
    en: `Li Ming works at a small company. He has the chance of a new job, but the new company is in Beijing, far from his home.
He thought about it for a week and didn't know what to do.
His mum said, "Do whatever you think is best."
He asked a friend, who said, "Go! Beijing is big and there are lots of opportunities."
He said, "OK, I've decided to go to Beijing!"`
  },
  {
    id: "c4", cat: "culture", title: "北京的胡同", titleEn: "The hutongs of Beijing",
    text: `{北京} 有 很 多 老 胡同。它 是 小 小 的 街道。
很 久 以前，很 多 人 住 在 胡同 里，今天 还 有 人 住 在 这 里。
这 里 很 安静。旁边 有 小 商店 和 饭店。
我 喜欢 在 这 里 走 一 走，喝 杯 茶。`,
    en: `Beijing has many old hutongs. A hutong is a small, narrow street.
A long time ago, many people lived in the hutongs, and some still live here today.
It is very quiet in a hutong. Beside it there are small shops and restaurants.
I like to stroll here and have a cup of tea.`
  },
  {
    id: "n4", cat: "news", title: "运动和身体", titleEn: "Exercise and health",
    text: `医生 说，每天 运动 对 身体 很 好。很 多 人 早上 跑步，下午 游泳。
每 星期 运动 三 次，每 次 三 十 分钟，就 可以 了。
运动 的 时候 要 喝 水，运动 完 要 休息。天气 冷 的 时候，要 多 穿 衣服。
运动 还 能 让 你 高兴。大家 一起 锻炼 吧，身体 健康 最 重要。`,
    en: `Doctors say that exercising every day is very good for your body. Many people go jogging in the morning and swimming in the afternoon.
Exercising three times a week for thirty minutes each time is enough.
Drink water while you exercise, and rest when you've finished. When the weather is cold, wear extra clothes.
Exercise can also make you happy. Let's all work out together: good health is the most important thing.`
  }
];
