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
  }
];
