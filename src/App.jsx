import React, { useState, useEffect, useRef, useMemo } from "react";
import { Check, X, RotateCcw, Clock, Shuffle, ArrowLeft, Trophy, Layers, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { LEADERBOARD_MAX_ENTRIES, formatTime, leaderboardKey, meetsAccuracyBar } from "../shared/leaderboardRules.js";

/* ==============================================================
   DATA — baked in from JLPT_N5_Database.xlsx (uploaded by user).
   No network fetch: Claude.ai artifacts can't reach external
   domains via fetch() due to CSP, so this list is embedded
   directly. To refresh it, re-download the sheet as .xlsx,
   upload it in chat, and ask Claude to regenerate this file.
   ============================================================== */

const RAW_ITEMS = [{"category": "Adverb", "jp": "ちょっと", "kana": null, "reading": "chotto", "meaning": "a little", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "丁度", "kana": "ちょうど", "reading": "choudo", "meaning": "exactly", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "大丈夫", "kana": "だいじょうぶ", "reading": "daijoubu", "meaning": "OK; okay; alright; problem free", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "だんだん", "kana": null, "reading": "dandan", "meaning": "gradually", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "どう", "kana": null, "reading": "dou", "meaning": "how; in what way; how about", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "どうも", "kana": null, "reading": "doumo", "meaning": "thank you; thanks", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "どうして", "kana": null, "reading": "doushite", "meaning": "why; for what reason; how", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "どうぞ", "kana": null, "reading": "douzo", "meaning": "please", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "初めて", "kana": "はじめて", "reading": "hajimete", "meaning": "for the first time", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "一人", "kana": "ひとり", "reading": "hitori", "meaning": "one person; alone; single", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "一番", "kana": "いちばん", "reading": "ichiban", "meaning": "number one; first; 1st, first place; best; most", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "いかが", "kana": null, "reading": "ikaga", "meaning": "how; in what way; how about", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "いくら", "kana": null, "reading": "ikura", "meaning": "how much?; how many?", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "いくつ", "kana": null, "reading": "ikutsu", "meaning": "how many?,how old?", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "色々", "kana": "いろいろ", "reading": "iroiro", "meaning": "various", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "一緒に", "kana": "いっしょに", "reading": "issho ni", "meaning": "together", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "いつも", "kana": null, "reading": "itsumo", "meaning": "always; usually; habitually", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "結構", "kana": "けっこう", "reading": "kekkou", "meaning": "splendid, enough", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "まだ", "kana": null, "reading": "mada", "meaning": "still; not yet", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "まだ～ていません", "kana": null, "reading": "mada ~te imasen", "meaning": "have not yet ~", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "前に", "kana": "まえに", "reading": "mae ni", "meaning": "before; in front of ~", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "真っ直ぐ", "kana": "まっすぐ", "reading": "massugu", "meaning": "straight ahead,direct", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "みんな", "kana": null, "reading": "minna", "meaning": "all; everyone; everybody", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "もっと", "kana": null, "reading": "motto", "meaning": "more; longer; further", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "もう", "kana": null, "reading": "mou", "meaning": "already; anymore; again; other", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "何故", "kana": "なぜ", "reading": "naze", "meaning": "why; how", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "同じ", "kana": "おなじ", "reading": "onaji", "meaning": "same", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "直ぐに", "kana": "すぐに ", "reading": "sugu ni", "meaning": "immediately; right away; instantly", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "少し", "kana": "すこし", "reading": "sukoshi", "meaning": "a little (bit); small quantity; few; short distance", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "多分", "kana": "たぶん", "reading": "tabun", "meaning": "perhaps; probably", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "大変", "kana": "たいへん", "reading": "taihen", "meaning": "very; greatly; terribly; serious; difficult", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "時々", "kana": "ときどき", "reading": "tokidoki", "meaning": "sometimes; at times", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "とても", "kana": null, "reading": "totemo", "meaning": "very; awfully; exceedingly", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "よく", "kana": null, "reading": "yoku", "meaning": "often, well", "onyomi": null, "kunyomi": null}, {"category": "Adverb", "jp": "ゆっくり", "kana": null, "reading": "yukkuri", "meaning": "slowly", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "あの", "kana": null, "reading": "ano", "meaning": "that", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "小さな", "kana": "ちいさな", "reading": "chiisana", "meaning": "small; little; tiny", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "どんな", "kana": null, "reading": "donna", "meaning": "what kind of; what sort of", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "どの", "kana": null, "reading": "dono", "meaning": "which", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "こんな", "kana": null, "reading": "konna", "meaning": "such; like this", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "この", "kana": null, "reading": "kono", "meaning": "this", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "大きな", "kana": "おおきな", "reading": "ookina", "meaning": "big; large; great", "onyomi": null, "kunyomi": null}, {"category": "Pre-Noun Adjectivals", "jp": "その", "kana": null, "reading": "sono", "meaning": "that", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "だけ", "kana": null, "reading": "dake", "meaning": "only; just; as much as ~", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "が", "kana": null, "reading": "ga", "meaning": "subject marker; however; but ~", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "か", "kana": null, "reading": "ka", "meaning": "question particle", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "か～か", "kana": null, "reading": "ka~ka", "meaning": "or", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "から", "kana": null, "reading": "kara", "meaning": "because; since; from", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "けど", "kana": null, "reading": "kedo", "meaning": "but; however; although ~", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "けれども", "kana": null, "reading": "keredo mo", "meaning": "but; however; although ~", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "まで", "kana": null, "reading": "made", "meaning": "until; as far as; to (an extent); even ~", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "も", "kana": null, "reading": "mo", "meaning": "too; also; as well", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "なあ", "kana": null, "reading": "naa", "meaning": "sentence ending particle; confirmation; admiration, etc", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "んです", "kana": null, "reading": "ndesu", "meaning": "to explain something; show emphasis", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "ね", "kana": null, "reading": "ne", "meaning": "isn't it? right? eh?", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "に", "kana": null, "reading": "ni", "meaning": "destination particle; in; at; on; to", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "に/へ", "kana": null, "reading": "ni/e", "meaning": "to (indicates direction / destination)", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "の", "kana": null, "reading": "no", "meaning": "possessive particle", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "のです", "kana": null, "reading": "no desu", "meaning": "to explain something; show emphasis", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "ので", "kana": null, "reading": "node", "meaning": "because of; given that; since ~", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "お / ご", "kana": null, "reading": "o / go", "meaning": "polite marker; honorific prefix particle", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "を", "kana": null, "reading": "o / wo", "meaning": "object marker particle", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "たり～たり", "kana": null, "reading": "tari~tari", "meaning": "do such things as A and B", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "と", "kana": null, "reading": "to", "meaning": "and; with; as; connecting particle", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "は", "kana": null, "reading": "wa - topic marker", "meaning": "topic marker", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "や", "kana": null, "reading": "ya", "meaning": "and; or; connecting particle", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "よ", "kana": null, "reading": "yo", "meaning": "you know; emphasis (ending particle)", "onyomi": null, "kunyomi": null}, {"category": "Particles", "jp": "より～ほうが", "kana": null, "reading": "yori ~hou ga", "meaning": "[2] is more than [1]", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "アパート", "kana": null, "reading": "apaato", "meaning": "apartment", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "バス", "kana": null, "reading": "basu", "meaning": "bus", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "バター", "kana": null, "reading": "bataa", "meaning": "butter", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ベッド", "kana": null, "reading": "beddo", "meaning": "bed", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ボールペン", "kana": null, "reading": "boorupen", "meaning": "ball-point pen", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ボタン", "kana": null, "reading": "botan", "meaning": "button", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "デパート", "kana": null, "reading": "depaato", "meaning": "department store", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ドア", "kana": null, "reading": "doa", "meaning": "door", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "エレベーター", "kana": null, "reading": "erebeetaa", "meaning": "elevator", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "フィルム", "kana": null, "reading": "firumu", "meaning": "film", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "フォーク", "kana": null, "reading": "fooku", "meaning": "fork", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ギター", "kana": null, "reading": "gitaa", "meaning": "guitar", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "グラム", "kana": null, "reading": "guramu", "meaning": "gram", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ハンカチ", "kana": null, "reading": "hankachi", "meaning": "handkerchief", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ホテル", "kana": null, "reading": "hoteru", "meaning": "hotel", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "カメラ", "kana": null, "reading": "kamera", "meaning": "camera", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "カップ", "kana": null, "reading": "kappu", "meaning": "cup", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "カレー", "kana": null, "reading": "karee", "meaning": "curry", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "カレンダー", "kana": null, "reading": "karendaa", "meaning": "calendar", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "キログラム", "kana": null, "reading": "kiro guramu", "meaning": "kilogram", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "キロメートル", "kana": null, "reading": "kiro meetoru", "meaning": "kilometer", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "コーヒー", "kana": null, "reading": "koohii", "meaning": "Coffee", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "コート", "kana": null, "reading": "kooto", "meaning": "coat", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "コピー", "kana": null, "reading": "kopii", "meaning": "copy; photocopy", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "コップ", "kana": null, "reading": "koppu", "meaning": "glass (drinking vessel); tumbler", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "クラス", "kana": null, "reading": "kurasu", "meaning": "class", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "マッチ", "kana": null, "reading": "macchi", "meaning": "match", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "メートル", "kana": null, "reading": "meetoru", "meaning": "metre; meter", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ナイフ", "kana": null, "reading": "naifu", "meaning": "knife", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ネクタイ", "kana": null, "reading": "nekutai", "meaning": "tie; necktie", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ノート", "kana": null, "reading": "nooto", "meaning": "notebook", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ニュース", "kana": null, "reading": "nyuusu", "meaning": "news", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "パーティー", "kana": null, "reading": "paatii", "meaning": "party", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "パン", "kana": null, "reading": "pan", "meaning": "bread", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ページ", "kana": null, "reading": "peeji", "meaning": "page", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ペン", "kana": null, "reading": "pen", "meaning": "pen", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ペット", "kana": null, "reading": "petto", "meaning": "pet", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ポケット", "kana": null, "reading": "poketto", "meaning": "pocket", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ポスト", "kana": null, "reading": "posuto", "meaning": "post", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "プール", "kana": null, "reading": "puuru", "meaning": "swimming pool", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ラジオ", "kana": null, "reading": "rajiio", "meaning": "radio", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "レコード", "kana": null, "reading": "rekoodo", "meaning": "record", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "レストラン", "kana": null, "reading": "resutoran", "meaning": "restaurant", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "セーター", "kana": null, "reading": "seetaa", "meaning": "sweater; jumper", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "シャツ", "kana": null, "reading": "shatsu", "meaning": "shirt", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "シャワー", "kana": null, "reading": "shawaa", "meaning": "shower", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "スカート", "kana": null, "reading": "sukaato", "meaning": "skirt", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "スポーツ", "kana": null, "reading": "supootsu", "meaning": "sport; sports", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "スプーン", "kana": null, "reading": "supuun", "meaning": "spoon", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "スリッパ", "kana": null, "reading": "surippa", "meaning": "slipper; slippers", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ストーブ", "kana": null, "reading": "sutoobu", "meaning": "heater; stove", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "タクシー", "kana": null, "reading": "takushii", "meaning": "taxi", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "テーブル", "kana": null, "reading": "teeburu", "meaning": "table", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "テープ", "kana": null, "reading": "teepu", "meaning": "tape", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "テープレコーダー", "kana": null, "reading": "teepu rekoodaa", "meaning": "tape recorder", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "テレビ", "kana": null, "reading": "terebi", "meaning": "television; TV", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "テスト", "kana": null, "reading": "tesuto", "meaning": "examination; quiz; test", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "トイレ", "kana": null, "reading": "toire", "meaning": "toilet", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ワイシャツ", "kana": null, "reading": "wai shatsu", "meaning": "shirt", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ゼロ", "kana": null, "reading": "zero", "meaning": "zero", "onyomi": null, "kunyomi": null}, {"category": "Katakana Words", "jp": "ズボン", "kana": null, "reading": "zubon", "meaning": "trousers; pants", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "赤", "kana": "あか", "reading": "aka", "meaning": "red; crimson; scarlet", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "秋", "kana": "あき", "reading": "aki", "meaning": "autumn; fall", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "雨", "kana": "あめ", "reading": "ame", "meaning": "rain", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "飴", "kana": "あめ", "reading": "ame", "meaning": "candy", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "姉", "kana": "あね", "reading": "ane", "meaning": "older sister; elder sister", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "兄", "kana": "あに", "reading": "ani", "meaning": "elder brother; older brother", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "青", "kana": "あお", "reading": "ao", "meaning": "blue; azure", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "アパート", "kana": null, "reading": "apaato", "meaning": "apartment", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "朝", "kana": "あさ", "reading": "asa", "meaning": "morning", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "朝ご飯", "kana": "あさごはん", "reading": "asagohan", "meaning": "breakfast", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "明後日", "kana": "あさって", "reading": "asatte", "meaning": "day after tomorrow", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "足", "kana": "あし", "reading": "ashi", "meaning": "foot; leg; paw; arm", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "明日", "kana": "あした", "reading": "ashita", "meaning": "tomorrow", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "頭", "kana": "あたま", "reading": "atama", "meaning": "head", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "後", "kana": "あと", "reading": "ato", "meaning": "behind; after; remainder; left; also", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "晩ご飯", "kana": "ばんごはん", "reading": "bangohan", "meaning": "dinner; evening meal", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "番号", "kana": "ばんごう", "reading": "bangou", "meaning": "number", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "バス", "kana": null, "reading": "basu", "meaning": "bus", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "バター", "kana": null, "reading": "bataa", "meaning": "butter", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ベッド", "kana": null, "reading": "beddo", "meaning": "bed", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "勉強", "kana": "べんきょう", "reading": "benkyou", "meaning": "to study", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ボールペン", "kana": null, "reading": "boorupen", "meaning": "ball-point pen", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ボタン", "kana": null, "reading": "botan", "meaning": "button", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "帽子", "kana": "ぼうし", "reading": "boushi", "meaning": "hat; cap", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "文章", "kana": "ぶんしょう", "reading": "bunshou", "meaning": "sentence", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "豚肉", "kana": "ぶたにく", "reading": "butaniku", "meaning": "pork", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "病院", "kana": "びょういん", "reading": "byouin", "meaning": "hospital", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "病気", "kana": "びょうき", "reading": "byouki", "meaning": "illness; disease; sickness", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "茶色", "kana": "ちゃいろ", "reading": "chairo", "meaning": "brown", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "茶碗", "kana": "ちゃわん", "reading": "chawan", "meaning": "rice bowl; tea cup; teacup", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "父", "kana": "ちち", "reading": "chichi", "meaning": "father", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "地下鉄", "kana": "ちかてつ", "reading": "chikatetsu", "meaning": "subway; underground train", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "地図", "kana": "ちず", "reading": "chizu", "meaning": "map", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "台所", "kana": "だいどころ", "reading": "daidokoro", "meaning": "kitchen", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "大学", "kana": "だいがく", "reading": "daigaku", "meaning": "university; college", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "出口", "kana": "でぐち", "reading": "deguchi", "meaning": "exit; gateway; way out", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "電気", "kana": "でんき", "reading": "denki", "meaning": "electricity", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "電車", "kana": "でんしゃ", "reading": "densha", "meaning": "train; electric train", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "電話", "kana": "でんわ", "reading": "denwa", "meaning": "telephone (call / device)l; phone call", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "デパート", "kana": null, "reading": "depaato", "meaning": "department store", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ドア", "kana": null, "reading": "doa", "meaning": "door", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "どなた", "kana": null, "reading": "donata", "meaning": "who", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "動物", "kana": "どうぶつ", "reading": "doubutsu", "meaning": "animal", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "土曜日", "kana": "どようび", "reading": "doyoubi", "meaning": "Saturday", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "絵", "kana": "え", "reading": "e", "meaning": "picture", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ええ", "kana": null, "reading": "ee", "meaning": "yes; that is correct; right", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "映画", "kana": "えいが", "reading": "eiga", "meaning": "movie; film", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "映画館", "kana": "えいがかん", "reading": "eigakan", "meaning": "movie theater; cinema", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "英語", "kana": "えいご", "reading": "eigo", "meaning": "English language", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "駅", "kana": "えき", "reading": "eki", "meaning": "station", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "鉛筆", "kana": "えんぴつ", "reading": "enpitsu", "meaning": "pencil", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "エレベーター", "kana": null, "reading": "erebeetaa", "meaning": "elevator", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "フィルム", "kana": null, "reading": "firumu", "meaning": "film", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "フォーク", "kana": null, "reading": "fooku", "meaning": "fork", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "服", "kana": "ふく", "reading": "fuku", "meaning": "clothes", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "二人", "kana": "ふたり", "reading": "futari", "meaning": "two people; pair; couple", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "二つ", "kana": "ふたつ", "reading": "futatsu", "meaning": "two; 2", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "二日", "kana": "ふつか", "reading": "futsuka", "meaning": "the second day of the month / 2 days", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "封筒", "kana": "ふうとう", "reading": "fuutou", "meaning": "envelope", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "冬", "kana": "ふゆ", "reading": "fuyu", "meaning": "winter", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "外国", "kana": "がいこく", "reading": "gaikoku", "meaning": "foreign country", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "外国人", "kana": "がいこくじん", "reading": "gaikokujin", "meaning": "foreigner; foreign citizen; foreign national; alien; non-Japanese", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "学校", "kana": "がっこう", "reading": "gakkou", "meaning": "school", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "学生", "kana": "がくせい", "reading": "gakusei", "meaning": "student", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "玄関", "kana": "げんかん", "reading": "genkan", "meaning": "entrance", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "元気", "kana": "げんき", "reading": "genki", "meaning": "lively; full of spirit; energetic; healthy", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "月曜日", "kana": "げつようび", "reading": "getsuyoubi", "meaning": "Monday", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "銀行", "kana": "ぎんこう", "reading": "ginkou", "meaning": "bank", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ギター", "kana": null, "reading": "gitaa", "meaning": "guitar", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "五", "kana": "ご", "reading": "go", "meaning": "five; 5", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "午後", "kana": "ごご", "reading": "gogo", "meaning": "afternoon; p.m.", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ご飯", "kana": "ごはん", "reading": "gohan", "meaning": "cooked rice, meal", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "午前", "kana": "ごぜん", "reading": "gozen", "meaning": "morning; a.m.", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "グラム", "kana": null, "reading": "guramu", "meaning": "gram", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "牛肉", "kana": "ぎゅうにく", "reading": "gyuuniku", "meaning": "beef", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "牛乳", "kana": "ぎゅうにゅう", "reading": "gyuunyuu", "meaning": "(cow's) milk", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "歯", "kana": "は", "reading": "ha", "meaning": "tooth", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "八", "kana": "はち", "reading": "hachi", "meaning": "eight: 8", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "葉書", "kana": "はがき", "reading": "hagaki", "meaning": "postcard", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "母", "kana": "はは", "reading": "haha", "meaning": "mother", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "はい", "kana": null, "reading": "hai", "meaning": "yes; that is correct", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "灰皿", "kana": "はいざら", "reading": "haizara", "meaning": "ashtray", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "箱", "kana": "はこ", "reading": "hako", "meaning": "box; crate", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "半", "kana": "はん", "reading": "han", "meaning": "half; semi-; half-past", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "花", "kana": "はな", "reading": "hana", "meaning": "flower", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "鼻", "kana": "はな", "reading": "hana", "meaning": "nose", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "話", "kana": "はなし", "reading": "hanashi", "meaning": "talk; speech; chat; conversation", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "半分", "kana": "はんぶん", "reading": "hanbun", "meaning": "half", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "ハンカチ", "kana": null, "reading": "hankachi", "meaning": "handkerchief", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "晴れ", "kana": "はれ", "reading": "hare", "meaning": "clear weather", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "春", "kana": "はる", "reading": "haru", "meaning": "spring; springtime", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "箸", "kana": "はし", "reading": "hashi", "meaning": "chopsticks", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "橋", "kana": "はし", "reading": "hashi", "meaning": "bridge", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "二十歳", "kana": "はたち", "reading": "hatachi", "meaning": "20 years old; twenty years old", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "二十日", "kana": "はつか", "reading": "hatsuka", "meaning": "twentieth day of the month / 20 days", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "辺", "kana": "へん", "reading": "hen", "meaning": "area", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "下手", "kana": "へた", "reading": "heta", "meaning": "unskillful; poor; awkward", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "部屋", "kana": "へや", "reading": "heya", "meaning": "room", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "左", "kana": "ひだり", "reading": "hidari", "meaning": "left; left hand side", "onyomi": null, "kunyomi": null}, {"category": "Nouns", "jp": "東", "kana": "ひがし", "reading": "higashi", "meaning": "east", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "浴びる", "kana": "あびる", "reading": "abiru", "meaning": "to bathe, to shower", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "上げる", "kana": "あげる", "reading": "ageru", "meaning": "to raise; to elevate; to give", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "開ける", "kana": "あける", "reading": "akeru", "meaning": "to open (a door, etc.); to unwrap (e.g. parcel, package); to unlock", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "開く", "kana": "あく", "reading": "aku", "meaning": "to open (e.g. doors, business, etc)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "洗う", "kana": "あらう", "reading": "arau", "meaning": "to wash", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "ある", "kana": null, "reading": "aru", "meaning": "to be, to have", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "歩く", "kana": "あるく", "reading": "aruku", "meaning": "to walk", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "遊ぶ", "kana": "あそぶ", "reading": "asobu", "meaning": "to play; to enjoy oneself", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "会う", "kana": "あう", "reading": "au", "meaning": "to meet; to encounter; to see", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "勉強", "kana": "べんきょう", "reading": "benkyou", "meaning": "to study", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "違う", "kana": "ちがう", "reading": "chigau", "meaning": "to differ", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "出す", "kana": "だす", "reading": "dasu", "meaning": "to take out; to get out; to put out; to reveal", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "出かける", "kana": "でかける", "reading": "dekakeru", "meaning": "to go out; to leave; to depart", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "電話", "kana": "でんわ", "reading": "denwa", "meaning": "telephone (call / device)l; phone call", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "出る", "kana": "でる", "reading": "deru", "meaning": "to leave; to exit; to appear; to go out", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "吹く", "kana": "ふく", "reading": "fuku", "meaning": "to blow (of the wind)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "降る", "kana": "ふる", "reading": "furu", "meaning": "to fall", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "入る", "kana": "はいる", "reading": "hairu", "meaning": "to enter; to go into", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "始まる", "kana": "はじまる", "reading": "hajimaru", "meaning": "to begin", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "履く", "kana": "はく", "reading": "haku", "meaning": "to wear, to put on trousers", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "話す", "kana": "はなす", "reading": "hanasu", "meaning": "to speak; to talk; to converse", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "晴れる", "kana": "はれる", "reading": "hareru", "meaning": "to be sunny", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "貼る", "kana": "はる", "reading": "haru", "meaning": "to stick; to paste", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "走る", "kana": "はしる", "reading": "hashiru", "meaning": "to run", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "働く", "kana": "はたらく", "reading": "hataraku", "meaning": "to work", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "引く", "kana": "ひく", "reading": "hiku", "meaning": "to pull", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "弾く", "kana": "ひく", "reading": "hiku", "meaning": "to play", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "行く", "kana": "いく", "reading": "iku", "meaning": "to go; to move", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "入れる", "kana": "いれる", "reading": "ireru", "meaning": "to put in; to let in; to take in; to bring in; to insert; to install", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "要る", "kana": "いる", "reading": "iru", "meaning": "to be needed", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "居る", "kana": "いる", "reading": "iru", "meaning": "to be, to have", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "言う", "kana": "いう", "reading": "iu", "meaning": "to say; to call", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "授業", "kana": "じゅぎょう", "reading": "jugyou", "meaning": "lesson; class work", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "帰る", "kana": "かえる", "reading": "kaeru", "meaning": "to go back", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "返す", "kana": "かえす", "reading": "kaesu", "meaning": "to return something", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "掛かる", "kana": "かかる", "reading": "kakaru", "meaning": "to take (a resource, e.g. time or money)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "掛ける", "kana": "かける", "reading": "kakeru", "meaning": "to hang up; to make (a call);", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "書く", "kana": "かく", "reading": "kaku", "meaning": "to write; to compose; to pen; to draw", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "借りる", "kana": "かりる", "reading": "kariru", "meaning": "to borrow", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "貸す", "kana": "かす", "reading": "kasu", "meaning": "to lend; to loan", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "買う", "kana": "かう", "reading": "kau", "meaning": "to buy; to purchase", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "結婚", "kana": "けっこん", "reading": "kekkon", "meaning": "marriage", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "消す", "kana": "けす", "reading": "kesu", "meaning": "to erase, to turn off power", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "消える", "kana": "きえる", "reading": "kieru", "meaning": "to disappear", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "聞く", "kana": "きく", "reading": "kiku", "meaning": "to hear; to listen (to music); to ask; to learn of", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "切る", "kana": "きる", "reading": "kiru", "meaning": "to cut", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "着る", "kana": "きる", "reading": "kiru", "meaning": "to wear", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "困る", "kana": "こまる", "reading": "komaru", "meaning": "to be troubled", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "コピー", "kana": null, "reading": "kopii", "meaning": "copy; photocopy", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "答える", "kana": "こたえる", "reading": "kotaeru", "meaning": "to answer", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "曇る", "kana": "くもる", "reading": "kumoru", "meaning": "to become cloudy, to become dim", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "来る", "kana": "くる", "reading": "kuru", "meaning": "to come", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "曲がる", "kana": "まがる", "reading": "magaru", "meaning": "to turn, to bend", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "待つ", "kana": "まつ", "reading": "matsu", "meaning": "to wait", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "磨く", "kana": "みがく", "reading": "migaku", "meaning": "to polish; to shine; to brush (e.g. teeth)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "見る", "kana": "みる", "reading": "miru", "meaning": "to see; to look; to watch; to view; to observe", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "見せる", "kana": "みせる", "reading": "miseru", "meaning": "to show; to display", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "持つ", "kana": "もつ", "reading": "motsu", "meaning": "to hold", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "鳴く", "kana": "なく", "reading": "naku", "meaning": "animal noise. to chirp", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "無くす", "kana": "なくす", "reading": "nakusu", "meaning": "to lose (something)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "並べる", "kana": "ならべる", "reading": "naraberu", "meaning": "to line up,to set up", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "並ぶ", "kana": "ならぶ", "reading": "narabu", "meaning": "to line up,to stand in a line", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "習う", "kana": "ならう", "reading": "narau", "meaning": "to be taught; to learn (from a teacher)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "寝る", "kana": "ねる", "reading": "neru", "meaning": "to sleep; to go to bed; to lie down", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "登る", "kana": "のぼる", "reading": "noboru", "meaning": "to climb", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "飲む", "kana": "のむ", "reading": "nomu", "meaning": "to drink", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "乗る", "kana": "のる", "reading": "noru", "meaning": "to get on (train, plane, bus, ship, etc.)", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "脱ぐ", "kana": "ぬぐ", "reading": "nugu", "meaning": "to take off clothes", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "覚える", "kana": "おぼえる", "reading": "oboeru", "meaning": "to remember", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "起きる", "kana": "おきる", "reading": "okiru", "meaning": "to get up; to wake up", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "置く", "kana": "おく", "reading": "oku", "meaning": "to put; to place", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "降りる", "kana": "おりる", "reading": "oriru", "meaning": "to get off", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "教える", "kana": "おしえる", "reading": "oshieru", "meaning": "to teach", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "押す", "kana": "おす", "reading": "osu", "meaning": "to push; to press", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "終わる", "kana": "おわる", "reading": "owaru", "meaning": "to finish; to end", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "泳ぐ", "kana": "およぐ", "reading": "oyogu", "meaning": "to swim", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "練習", "kana": "れんしゅう", "reading": "renshuu", "meaning": "practice; practicing", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "旅行", "kana": "りょこう", "reading": "ryokou", "meaning": "travel; trip; journey; excursion; tour", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "料理", "kana": "りょうり", "reading": "ryouri", "meaning": "cuisine", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "咲く", "kana": "さく", "reading": "saku", "meaning": "to bloom", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "散歩", "kana": "さんぽ", "reading": "sanpo", "meaning": "walk; stroll", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "差す", "kana": "さす", "reading": "sasu", "meaning": "to stretch out hands, to raise an umbrella", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "洗濯", "kana": "せんたく", "reading": "sentaku", "meaning": "washing; laundry", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "仕事", "kana": "しごと", "reading": "shigoto", "meaning": "work; job; business", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "閉まる", "kana": "しまる", "reading": "shimaru", "meaning": "to close, to be closed", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "閉める", "kana": "しめる", "reading": "shimeru", "meaning": "to close; to shut", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "締める", "kana": "しめる", "reading": "shimeru", "meaning": "to tie; to fasten; to tighten", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "死ぬ", "kana": "しぬ", "reading": "shinu", "meaning": "to die", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "知る", "kana": "しる", "reading": "shiru", "meaning": "to know", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "質問", "kana": "しつもん", "reading": "shitsumon", "meaning": "question; inquiry", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "掃除", "kana": "そうじ", "reading": "souji", "meaning": "to clean, to sweep", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "住む", "kana": "すむ", "reading": "sumu", "meaning": "to live in; to reside; to inhabit; to dwell; to abide", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "吸う", "kana": "すう", "reading": "suu", "meaning": "to smoke, to suck", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "座る", "kana": "すわる", "reading": "suwaru", "meaning": "to sit", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "食べる", "kana": "たべる", "reading": "taberu", "meaning": "to eat", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "頼む", "kana": "たのむ", "reading": "tanomu", "meaning": "to ask", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "立つ", "kana": "たつ", "reading": "tatsu", "meaning": "to stand; to stand up", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "テスト", "kana": null, "reading": "tesuto", "meaning": "examination; quiz; test", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "飛ぶ", "kana": "とぶ", "reading": "tobu", "meaning": "to fly; to hop", "onyomi": null, "kunyomi": null}, {"category": "Verb", "jp": "止まる", "kana": "とまる", "reading": "tomaru", "meaning": "to stop; to come to a halt", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "危ない", "kana": "あぶない", "reading": "abunai", "meaning": "dangerous", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "赤い", "kana": "あかい", "reading": "akai", "meaning": "red; crimson; scarlet", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "明るい", "kana": "あかるい", "reading": "akarui", "meaning": "bright; light", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "甘い", "kana": "あまい", "reading": "amai", "meaning": "sweet; sweet-tasting; sugary; naive; indulgent", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "青い", "kana": "あおい", "reading": "aoi", "meaning": "blue; azure", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "新しい", "kana": "あたらしい", "reading": "atarashii", "meaning": "new; novel; fresh; recent; latest", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "暖かい", "kana": "あたたかい", "reading": "atatakai", "meaning": "warm", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "熱い", "kana": "あつい", "reading": "atsui", "meaning": "hot", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "厚い", "kana": "あつい", "reading": "atsui", "meaning": "thick", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "暑い", "kana": "あつい", "reading": "atsui", "meaning": "hot; sultry", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "便利", "kana": "べんり", "reading": "benri", "meaning": "convenient; handy; useful", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "小さい", "kana": "ちいさい", "reading": "chiisai", "meaning": "small; little; tiny", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "近い", "kana": "ちかい", "reading": "chikai", "meaning": "near; close", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "大丈夫", "kana": "だいじょうぶ", "reading": "daijoubu", "meaning": "OK; okay; alright; problem free", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "大好き", "kana": "だいすき", "reading": "daisuki", "meaning": "love; like; like very much", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "古い", "kana": "ふるい", "reading": "furui", "meaning": "old (not used for people)", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "太い", "kana": "ふとい", "reading": "futoi", "meaning": "fat; thick", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "元気", "kana": "げんき", "reading": "genki", "meaning": "lively; full of spirit; energetic; healthy", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "速い", "kana": "はやい", "reading": "hayai", "meaning": "fast; quick; hasty; brisk", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "早い", "kana": "はやい", "reading": "hayai", "meaning": "fast; early", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "下手", "kana": "へた", "reading": "heta", "meaning": "unskillful; poor; awkward", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "低い", "kana": "ひくい", "reading": "hikui", "meaning": "short,low", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "暇", "kana": "ひま", "reading": "hima", "meaning": "free time", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "広い", "kana": "ひろい", "reading": "hiroi", "meaning": "spacious; vast; wide", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "本当", "kana": "ほんとう", "reading": "hontou", "meaning": "truth; reality; actuality; fact", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "欲しい", "kana": "ほしい", "reading": "hoshii", "meaning": "want", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "細い", "kana": "ほそい", "reading": "hosoi", "meaning": "thin; slender", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "色々", "kana": "いろいろ", "reading": "iroiro", "meaning": "various", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "忙しい", "kana": "いそがしい", "reading": "isogashii", "meaning": "busy", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "痛い", "kana": "いたい", "reading": "itai", "meaning": "painful; sore", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "嫌", "kana": "いや", "reading": "iya", "meaning": "unpleasant", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "丈夫", "kana": "じょうぶ", "reading": "joubu", "meaning": "strong, durable", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "上手", "kana": "じょうず", "reading": "jouzu", "meaning": "skillful; skilled; proficient; good (at)", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "辛い", "kana": "からい", "reading": "karai", "meaning": "spicy", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "軽い", "kana": "かるい", "reading": "karui", "meaning": "light", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "可愛い", "kana": "かわいい", "reading": "kawaii", "meaning": "cute", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "結構", "kana": "けっこう", "reading": "kekkou", "meaning": "splendid, enough", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "黄色い", "kana": "きいろい", "reading": "kiiroi", "meaning": "yellow", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "嫌い", "kana": "きらい", "reading": "kirai", "meaning": "hate", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "綺麗", "kana": "きれい", "reading": "kirei", "meaning": "pretty; lovely; beautiful", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "汚い", "kana": "きたない", "reading": "kitanai", "meaning": "dirty", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "暗い", "kana": "くらい", "reading": "kurai", "meaning": "dark; gloomy; murky", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "黒い", "kana": "くろい", "reading": "kuroi", "meaning": "black", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "丸い", "kana": "まるい", "reading": "marui", "meaning": "round,circular", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "真っ直ぐ", "kana": "まっすぐ", "reading": "massugu", "meaning": "straight ahead,direct", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "不味い", "kana": "まずい", "reading": "mazui", "meaning": "unpleasant", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "短い", "kana": "みじかい", "reading": "mijikai", "meaning": "short", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "難しい", "kana": "むずかしい", "reading": "muzukashii", "meaning": "difficult", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "長い", "kana": "ながい", "reading": "nagai", "meaning": "long (distance); long (time); lengthy.", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "賑やか", "kana": "にぎやか", "reading": "nigiyaka", "meaning": "bustling,busy", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "温い", "kana": "ぬるい", "reading": "nurui", "meaning": "luke warm", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "美味しい", "kana": "おいしい", "reading": "oishii", "meaning": "delicious", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "重い", "kana": "おもい", "reading": "omoi", "meaning": "heavy", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "面白い", "kana": "おもしろい", "reading": "omoshiroi", "meaning": "interesting", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "多い", "kana": "おおい", "reading": "ooi", "meaning": "many; numerous; a lot; large quantity; frequent", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "大きい", "kana": "おおきい", "reading": "ookii", "meaning": "big; large; great; important", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "遅い", "kana": "おそい", "reading": "osoi", "meaning": "slow; time-consuming; late", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "立派", "kana": "りっぱ", "reading": "rippa", "meaning": "splendid", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "寒い", "kana": "さむい", "reading": "samui", "meaning": "cold", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "狭い", "kana": "せまい", "reading": "semai", "meaning": "narrow", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "白い", "kana": "しろい", "reading": "shiroi", "meaning": "white", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "静か", "kana": "しずか", "reading": "shizuka", "meaning": "quiet", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "好き", "kana": "すき", "reading": "suki", "meaning": "like", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "少ない", "kana": "すくない", "reading": "sukunai", "meaning": "few; a little; scarce; insufficient; seldom", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "涼しい", "kana": "すずしい", "reading": "suzushii", "meaning": "refreshing, cool", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "多分", "kana": "たぶん", "reading": "tabun", "meaning": "perhaps; probably", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "大変", "kana": "たいへん", "reading": "taihen", "meaning": "very; greatly; terribly; serious; difficult", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "大切", "kana": "たいせつ", "reading": "taisetsu", "meaning": "important; necessary; indispensable; beloved", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "高い", "kana": "たかい", "reading": "takai", "meaning": "high; tall; expensive; above average", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "沢山", "kana": "たくさん", "reading": "takusan", "meaning": "many", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "楽しい", "kana": "たのしい", "reading": "tanoshii", "meaning": "enjoyable; fun", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "遠い", "kana": "とおい", "reading": "tooi", "meaning": "far", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "詰まらない", "kana": "つまらない", "reading": "tsumaranai", "meaning": "boring", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "冷たい", "kana": "つめたい", "reading": "tsumetai", "meaning": "cold to the touch", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "強い", "kana": "つよい", "reading": "tsuyoi", "meaning": "powerful", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "煩い", "kana": "うるさい", "reading": "urusai", "meaning": "noisy, annoying", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "薄い", "kana": "うすい", "reading": "usui", "meaning": "thin; weak", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "若い", "kana": "わかい", "reading": "wakai", "meaning": "young", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "悪い", "kana": "わるい", "reading": "warui", "meaning": "bad; poor; undesirable", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "易しい", "kana": "やさしい", "reading": "yasashii", "meaning": "easy, simple", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "安い", "kana": "やすい", "reading": "yasui", "meaning": "cheap; inexpensive", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "良い", "kana": "よい/いい", "reading": "yoi/ii", "meaning": "good", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "弱い", "kana": "よわい", "reading": "yowai", "meaning": "weak", "onyomi": null, "kunyomi": null}, {"category": "Adjectives", "jp": "有名", "kana": "ゆうめい", "reading": "yuumei", "meaning": "famous", "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "あ", "kana": null, "reading": "a", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "い", "kana": null, "reading": "i", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "う", "kana": null, "reading": "u", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "え", "kana": null, "reading": "e", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "お", "kana": null, "reading": "o", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "か", "kana": null, "reading": "ka", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "き", "kana": null, "reading": "ki", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "く", "kana": null, "reading": "ku", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "け", "kana": null, "reading": "ke", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "こ", "kana": null, "reading": "ko", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "さ", "kana": null, "reading": "sa", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "し", "kana": null, "reading": "shi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "す", "kana": null, "reading": "su", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "せ", "kana": null, "reading": "se", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "そ", "kana": null, "reading": "so", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "た", "kana": null, "reading": "ta", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ち", "kana": null, "reading": "chi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "つ", "kana": null, "reading": "tsu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "て", "kana": null, "reading": "te", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "と", "kana": null, "reading": "to", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "な", "kana": null, "reading": "na", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "に", "kana": null, "reading": "ni", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ぬ", "kana": null, "reading": "nu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ね", "kana": null, "reading": "ne", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "の", "kana": null, "reading": "no", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "は", "kana": null, "reading": "ha", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ひ", "kana": null, "reading": "hi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ふ", "kana": null, "reading": "fu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "へ", "kana": null, "reading": "he", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ほ", "kana": null, "reading": "ho", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ま", "kana": null, "reading": "ma", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "み", "kana": null, "reading": "mi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "む", "kana": null, "reading": "mu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "め", "kana": null, "reading": "me", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "も", "kana": null, "reading": "mo", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ら", "kana": null, "reading": "ra", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "り", "kana": null, "reading": "ri", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "る", "kana": null, "reading": "ru", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "れ", "kana": null, "reading": "re", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ろ", "kana": null, "reading": "ro", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "や", "kana": null, "reading": "ya", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ゆ", "kana": null, "reading": "yu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "よ", "kana": null, "reading": "yo", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "わ", "kana": null, "reading": "wa", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "を", "kana": null, "reading": "wo", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Hiragana", "jp": "ん", "kana": null, "reading": "n", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ア", "kana": null, "reading": "a", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "イ", "kana": null, "reading": "i", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ウ", "kana": null, "reading": "u", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "エ", "kana": null, "reading": "e", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "オ", "kana": null, "reading": "o", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "カ", "kana": null, "reading": "ka", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "キ", "kana": null, "reading": "ki", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ク", "kana": null, "reading": "ku", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ケ", "kana": null, "reading": "ke", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "コ", "kana": null, "reading": "ko", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "サ", "kana": null, "reading": "sa", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "シ", "kana": null, "reading": "shi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ス", "kana": null, "reading": "su", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "セ", "kana": null, "reading": "se", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ソ", "kana": null, "reading": "so", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "タ", "kana": null, "reading": "ta", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "チ", "kana": null, "reading": "chi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ツ", "kana": null, "reading": "tsu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "テ", "kana": null, "reading": "te", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ト", "kana": null, "reading": "to", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ナ", "kana": null, "reading": "na", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ニ", "kana": null, "reading": "ni", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ヌ", "kana": null, "reading": "nu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ネ", "kana": null, "reading": "ne", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ノ", "kana": null, "reading": "no", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ハ", "kana": null, "reading": "ha", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ヒ", "kana": null, "reading": "hi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "フ", "kana": null, "reading": "fu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ヘ", "kana": null, "reading": "he", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ホ", "kana": null, "reading": "ho", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "マ", "kana": null, "reading": "ma", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ミ", "kana": null, "reading": "mi", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ム", "kana": null, "reading": "mu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "メ", "kana": null, "reading": "me", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "モ", "kana": null, "reading": "mo", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ヤ", "kana": null, "reading": "ya", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ユ", "kana": null, "reading": "yu", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ヨ", "kana": null, "reading": "yo", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ラ", "kana": null, "reading": "ra", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "リ", "kana": null, "reading": "ri", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ル", "kana": null, "reading": "ru", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "レ", "kana": null, "reading": "re", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ロ", "kana": null, "reading": "ro", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ワ", "kana": null, "reading": "wa", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ヲ", "kana": null, "reading": "wo", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Katakana", "jp": "ン", "kana": null, "reading": "n", "meaning": null, "onyomi": null, "kunyomi": null}, {"category": "Kanji", "jp": "日", "kana": null, "reading": "hi, -bi, -ka / nichi, jitsu", "onyomi": "nichi, jitsu", "kunyomi": "hi, -bi, -ka", "meaning": "day, sun, Japan, counter for days"}, {"category": "Kanji", "jp": "一", "kana": null, "reading": "hito(tsu) / ichi", "onyomi": "ichi", "kunyomi": "hito(tsu)", "meaning": "one"}, {"category": "Kanji", "jp": "国", "kana": null, "reading": "kuni / koku", "onyomi": "koku", "kunyomi": "kuni", "meaning": "country"}, {"category": "Kanji", "jp": "人", "kana": null, "reading": "hito / jin, nin", "onyomi": "jin, nin", "kunyomi": "hito", "meaning": "person"}, {"category": "Kanji", "jp": "年", "kana": null, "reading": "toshi / nen", "onyomi": "nen", "kunyomi": "toshi", "meaning": "year, counter for years"}, {"category": "Kanji", "jp": "大", "kana": null, "reading": "oo(kii) / dai, tai", "onyomi": "dai, tai", "kunyomi": "oo(kii)", "meaning": "large, big"}, {"category": "Kanji", "jp": "十", "kana": null, "reading": "tou, to / juu", "onyomi": "juu", "kunyomi": "tou, to", "meaning": "ten, 10"}, {"category": "Kanji", "jp": "二", "kana": null, "reading": "futa(tsu) / ni, ji", "onyomi": "ni, ji", "kunyomi": "futa(tsu)", "meaning": "two, 2"}, {"category": "Kanji", "jp": "本", "kana": null, "reading": "moto / hon", "onyomi": "hon", "kunyomi": "moto", "meaning": "book, present, true, counter for long cylindrical things"}, {"category": "Kanji", "jp": "中", "kana": null, "reading": "naka, uchi, ata(ru) / chuu", "onyomi": "chuu", "kunyomi": "naka, uchi, ata(ru)", "meaning": "in, inside, middle, mean, center"}, {"category": "Kanji", "jp": "長", "kana": null, "reading": "naga(i), osa / chou", "onyomi": "chou", "kunyomi": "naga(i), osa", "meaning": "long, leader, superior, senior"}, {"category": "Kanji", "jp": "出", "kana": null, "reading": "de(ru), da(su), i(deru) / shutsu, sui", "onyomi": "shutsu, sui", "kunyomi": "de(ru), da(su), i(deru)", "meaning": "exit, leave, go out"}, {"category": "Kanji", "jp": "三", "kana": null, "reading": "mi(tsu) / san", "onyomi": "san", "kunyomi": "mi(tsu)", "meaning": "three, 3"}, {"category": "Kanji", "jp": "時", "kana": null, "reading": "toki, doki / ji", "onyomi": "ji", "kunyomi": "toki, doki", "meaning": "time, hour"}, {"category": "Kanji", "jp": "行", "kana": null, "reading": "i(ku), yu(ku), okona(u) / kou, gyou, an", "onyomi": "kou, gyou, an", "kunyomi": "i(ku), yu(ku), okona(u)", "meaning": "going, journey, carry out, line, row"}, {"category": "Kanji", "jp": "見", "kana": null, "reading": "mi(ru), mi(seru) / ken", "onyomi": "ken", "kunyomi": "mi(ru), mi(seru)", "meaning": "see, hopes, chances, idea, opinion, look at, visible"}, {"category": "Kanji", "jp": "月", "kana": null, "reading": "tsuki / getsu, gatsu", "onyomi": "getsu, gatsu", "kunyomi": "tsuki", "meaning": "month, moon"}, {"category": "Kanji", "jp": "分", "kana": null, "reading": "wa(keru) / bun, fun, bu", "onyomi": "bun, fun, bu", "kunyomi": "wa(keru)", "meaning": "part, minute of time, understand"}, {"category": "Kanji", "jp": "後", "kana": null, "reading": "nochi, ushi(ro), ato / go, kou", "onyomi": "go, kou", "kunyomi": "nochi, ushi(ro), ato", "meaning": "behind, back, later"}, {"category": "Kanji", "jp": "前", "kana": null, "reading": "mae / zen", "onyomi": "zen", "kunyomi": "mae", "meaning": "in front, before"}, {"category": "Kanji", "jp": "生", "kana": null, "reading": "i(kiru), u(mu), o(u), ha(eru), nama / sei, shou", "onyomi": "sei, shou", "kunyomi": "i(kiru), u(mu), o(u), ha(eru), nama", "meaning": "life, genuine, birth"}, {"category": "Kanji", "jp": "五", "kana": null, "reading": "itsu(tsu) / go", "onyomi": "go", "kunyomi": "itsu(tsu)", "meaning": "five, 5"}, {"category": "Kanji", "jp": "間", "kana": null, "reading": "aida, ma, ai / kan, ken", "onyomi": "kan, ken", "kunyomi": "aida, ma, ai", "meaning": "interval, space"}, {"category": "Kanji", "jp": "上", "kana": null, "reading": "ue, uwa, kami, a(geru), nobo(ru), tatematsu(ru) / jou, shou, shan", "onyomi": "jou, shou, shan", "kunyomi": "ue, uwa, kami, a(geru), nobo(ru), tatematsu(ru)", "meaning": "above, up"}, {"category": "Kanji", "jp": "東", "kana": null, "reading": "higashi / tou", "onyomi": "tou", "kunyomi": "higashi", "meaning": "east"}, {"category": "Kanji", "jp": "四", "kana": null, "reading": "yo(tsu), yon / shi", "onyomi": "shi", "kunyomi": "yo(tsu), yon", "meaning": "four, 4"}, {"category": "Kanji", "jp": "今", "kana": null, "reading": "ima / kon, kin", "onyomi": "kon, kin", "kunyomi": "ima", "meaning": "now; the present"}, {"category": "Kanji", "jp": "金", "kana": null, "reading": "kane, kana, gane / kin, kon, gon", "onyomi": "kin, kon, gon", "kunyomi": "kane, kana, gane", "meaning": "gold"}, {"category": "Kanji", "jp": "九", "kana": null, "reading": "kokono(tsu) / kyuu, ku", "onyomi": "kyuu, ku", "kunyomi": "kokono(tsu)", "meaning": "nine, 9"}, {"category": "Kanji", "jp": "入", "kana": null, "reading": "i(ru), hai(ru) / nyuu", "onyomi": "nyuu", "kunyomi": "i(ru), hai(ru)", "meaning": "enter, insert"}, {"category": "Kanji", "jp": "学", "kana": null, "reading": "mana(bu) / gaku", "onyomi": "gaku", "kunyomi": "mana(bu)", "meaning": "study, learning, science"}, {"category": "Kanji", "jp": "高", "kana": null, "reading": "taka(i) / kou", "onyomi": "kou", "kunyomi": "taka(i)", "meaning": "tall, high, expensive"}, {"category": "Kanji", "jp": "円", "kana": null, "reading": "maru(i) / en", "onyomi": "en", "kunyomi": "maru(i)", "meaning": "circle, yen, round"}, {"category": "Kanji", "jp": "子", "kana": null, "reading": "ko, ne / shi, su, tsu", "onyomi": "shi, su, tsu", "kunyomi": "ko, ne", "meaning": "child"}, {"category": "Kanji", "jp": "外", "kana": null, "reading": "soto, hoka, hazu-, to- / gai, ge", "onyomi": "gai, ge", "kunyomi": "soto, hoka, hazu-, to-", "meaning": "outside"}, {"category": "Kanji", "jp": "八", "kana": null, "reading": "ya(tsu), you / hachi", "onyomi": "hachi", "kunyomi": "ya(tsu), you", "meaning": "eight, 8"}, {"category": "Kanji", "jp": "六", "kana": null, "reading": "mu(tsu), mui / roku", "onyomi": "roku", "kunyomi": "mu(tsu), mui", "meaning": "six, 6"}, {"category": "Kanji", "jp": "下", "kana": null, "reading": "shita, shimo, moto, sa(geru), kuda(ru), o(rosu) / ka, ge", "onyomi": "ka, ge", "kunyomi": "shita, shimo, moto, sa(geru), kuda(ru), o(rosu)", "meaning": "below, down, descend, give, low, inferior"}, {"category": "Kanji", "jp": "来", "kana": null, "reading": "kuru, kitaru, ki, ko / rai, tai", "onyomi": "rai, tai", "kunyomi": "kuru, kitaru, ki, ko", "meaning": "come, due, next, cause, become"}, {"category": "Kanji", "jp": "気", "kana": null, "reading": "iki / ki, ke", "onyomi": "ki, ke", "kunyomi": "iki", "meaning": "spirit, mind, air, atmosphere, mood"}, {"category": "Kanji", "jp": "小", "kana": null, "reading": "chii(sai), ko-, o-, sa- / shou", "onyomi": "shou", "kunyomi": "chii(sai), ko-, o-, sa-", "meaning": "little, small"}, {"category": "Kanji", "jp": "七", "kana": null, "reading": "nana(tsu), nano / shichi", "onyomi": "shichi", "kunyomi": "nana(tsu), nano", "meaning": "seven, 7"}, {"category": "Kanji", "jp": "山", "kana": null, "reading": "yama / san, sen", "onyomi": "san, sen", "kunyomi": "yama", "meaning": "mountain"}, {"category": "Kanji", "jp": "話", "kana": null, "reading": "hana(su), hanashi / wa", "onyomi": "wa", "kunyomi": "hana(su), hanashi", "meaning": "tale, talk"}, {"category": "Kanji", "jp": "女", "kana": null, "reading": "onnna, me / jo", "onyomi": "jo", "kunyomi": "onnna, me", "meaning": "woman, female"}, {"category": "Kanji", "jp": "北", "kana": null, "reading": "kita / hoku", "onyomi": "hoku", "kunyomi": "kita", "meaning": "north"}, {"category": "Kanji", "jp": "午", "kana": null, "reading": "uma / go", "onyomi": "go", "kunyomi": "uma", "meaning": "noon, sign of the horse"}, {"category": "Kanji", "jp": "百", "kana": null, "reading": "momo / hyaku, byaku", "onyomi": "hyaku, byaku", "kunyomi": "momo", "meaning": "hundred"}, {"category": "Kanji", "jp": "書", "kana": null, "reading": "kaku / sho", "onyomi": "sho", "kunyomi": "kaku", "meaning": "write"}, {"category": "Kanji", "jp": "先", "kana": null, "reading": "saki, ma(zu) / sen", "onyomi": "sen", "kunyomi": "saki, ma(zu)", "meaning": "before, ahead, previous, future, precedence"}, {"category": "Kanji", "jp": "名", "kana": null, "reading": "na / mei, myou", "onyomi": "mei, myou", "kunyomi": "na", "meaning": "name, noted, distinguished, reputation"}, {"category": "Kanji", "jp": "川", "kana": null, "reading": "kawa / sen", "onyomi": "sen", "kunyomi": "kawa", "meaning": "river, stream"}, {"category": "Kanji", "jp": "千", "kana": null, "reading": "chi / sen", "onyomi": "sen", "kunyomi": "chi", "meaning": "thousand"}, {"category": "Kanji", "jp": "水", "kana": null, "reading": "mizu / sui", "onyomi": "sui", "kunyomi": "mizu", "meaning": "water"}, {"category": "Kanji", "jp": "半", "kana": null, "reading": "naka(ba) / han", "onyomi": "han", "kunyomi": "naka(ba)", "meaning": "half, middle, odd number, semi-"}, {"category": "Kanji", "jp": "男", "kana": null, "reading": "otoko, o / dan, nan", "onyomi": "dan, nan", "kunyomi": "otoko, o", "meaning": "male; man"}, {"category": "Kanji", "jp": "西", "kana": null, "reading": "nishi / sei, sai", "onyomi": "sei, sai", "kunyomi": "nishi", "meaning": "west"}, {"category": "Kanji", "jp": "電", "kana": null, "reading": "den", "onyomi": "den", "kunyomi": null, "meaning": "electricity; electric powered"}, {"category": "Kanji", "jp": "校", "kana": null, "reading": "kou", "onyomi": "kou", "kunyomi": null, "meaning": "school, exam"}, {"category": "Kanji", "jp": "語", "kana": null, "reading": "kata(ru) / go", "onyomi": "go", "kunyomi": "kata(ru)", "meaning": "word, speech, language"}, {"category": "Kanji", "jp": "土", "kana": null, "reading": "tsuchi / do, to", "onyomi": "do, to", "kunyomi": "tsuchi", "meaning": "soil, earth, ground"}, {"category": "Kanji", "jp": "木", "kana": null, "reading": "ki, ko / boku, moku", "onyomi": "boku, moku", "kunyomi": "ki, ko", "meaning": "tree, wood"}, {"category": "Kanji", "jp": "聞", "kana": null, "reading": "ki(ku) / bun, mon", "onyomi": "bun, mon", "kunyomi": "ki(ku)", "meaning": "to hear; to listen; to ask"}, {"category": "Kanji", "jp": "食", "kana": null, "reading": "k(u), ta(beru), ha(mu) / shoku, jiki", "onyomi": "shoku, jiki", "kunyomi": "k(u), ta(beru), ha(mu)", "meaning": "eat, food"}, {"category": "Kanji", "jp": "車", "kana": null, "reading": "kuruma / sha", "onyomi": "sha", "kunyomi": "kuruma", "meaning": "car, wheel"}, {"category": "Kanji", "jp": "何", "kana": null, "reading": "nani, nan / ka", "onyomi": "ka", "kunyomi": "nani, nan", "meaning": "what"}, {"category": "Kanji", "jp": "南", "kana": null, "reading": "minami / nan, na", "onyomi": "nan, na", "kunyomi": "minami", "meaning": "south"}, {"category": "Kanji", "jp": "万", "kana": null, "reading": "man, ban", "onyomi": "man, ban", "kunyomi": null, "meaning": "ten thousand, 10,000"}, {"category": "Kanji", "jp": "毎", "kana": null, "reading": "goto(ni) / mai", "onyomi": "mai", "kunyomi": "goto(ni)", "meaning": "every"}, {"category": "Kanji", "jp": "白", "kana": null, "reading": "shiro(i) / haku, byaku", "onyomi": "haku, byaku", "kunyomi": "shiro(i)", "meaning": "white"}, {"category": "Kanji", "jp": "天", "kana": null, "reading": "amatsu / ten", "onyomi": "ten", "kunyomi": "amatsu", "meaning": "heavens, sky, imperial"}, {"category": "Kanji", "jp": "母", "kana": null, "reading": "haha, kaa / bo", "onyomi": "bo", "kunyomi": "haha, kaa", "meaning": "mother"}, {"category": "Kanji", "jp": "火", "kana": null, "reading": "hi, bi, ho / ka", "onyomi": "ka", "kunyomi": "hi, bi, ho", "meaning": "fire"}, {"category": "Kanji", "jp": "右", "kana": null, "reading": "migi / u, yuu", "onyomi": "u, yuu", "kunyomi": "migi", "meaning": "right (direction)"}, {"category": "Kanji", "jp": "読", "kana": null, "reading": "yo(mu) / doku, toku, tou", "onyomi": "doku, toku, tou", "kunyomi": "yo(mu)", "meaning": "to read"}, {"category": "Kanji", "jp": "友", "kana": null, "reading": "tomo / yuu", "onyomi": "yuu", "kunyomi": "tomo", "meaning": "friend"}, {"category": "Kanji", "jp": "左", "kana": null, "reading": "hidari / sa, sha", "onyomi": "sa, sha", "kunyomi": "hidari", "meaning": "left"}, {"category": "Kanji", "jp": "休", "kana": null, "reading": "yasu(mu) / kyuu", "onyomi": "kyuu", "kunyomi": "yasu(mu)", "meaning": "rest, day off, retire, sleep"}, {"category": "Kanji", "jp": "父", "kana": null, "reading": "chichi, tou / fu", "onyomi": "fu", "kunyomi": "chichi, tou", "meaning": "father"}, {"category": "Kanji", "jp": "雨", "kana": null, "reading": "ame, ama / u", "onyomi": "u", "kunyomi": "ame, ama", "meaning": "rain"}, {"category": "Kanji", "jp": "安", "kana": null, "reading": "yasu(i) / an", "onyomi": "an", "kunyomi": "yasu(i)", "meaning": "peace, cheap, safety"}, {"category": "Kanji", "jp": "飲", "kana": null, "reading": "no(mu) / in", "onyomi": "in", "kunyomi": "no(mu)", "meaning": "to drink"}, {"category": "Kanji", "jp": "駅", "kana": null, "reading": "– / eki", "onyomi": "eki", "kunyomi": "–", "meaning": "station"}, {"category": "Kanji", "jp": "花", "kana": null, "reading": "hana / ka", "onyomi": "ka", "kunyomi": "hana", "meaning": "flower, blossom"}, {"category": "Kanji", "jp": "会", "kana": null, "reading": "a(u) / kai, e", "onyomi": "kai, e", "kunyomi": "a(u)", "meaning": "to meet, to come together, society"}, {"category": "Kanji", "jp": "魚", "kana": null, "reading": "sakana, uo / gyo", "onyomi": "gyo", "kunyomi": "sakana, uo", "meaning": "fish"}, {"category": "Kanji", "jp": "空", "kana": null, "reading": "sora, a(keru), kara / kuu", "onyomi": "kuu", "kunyomi": "sora, a(keru), kara", "meaning": "sky, to become free, empty"}, {"category": "Kanji", "jp": "言", "kana": null, "reading": "i(u) / gen, gon", "onyomi": "gen, gon", "kunyomi": "i(u)", "meaning": "word, to talk"}, {"category": "Kanji", "jp": "古", "kana": null, "reading": "furu(i) / ko", "onyomi": "ko", "kunyomi": "furu(i)", "meaning": "old, used"}, {"category": "Kanji", "jp": "口", "kana": null, "reading": "kuchi / kou, ku", "onyomi": "kou, ku", "kunyomi": "kuchi", "meaning": "mouth"}, {"category": "Kanji", "jp": "耳", "kana": null, "reading": "mimi / ji", "onyomi": "ji", "kunyomi": "mimi", "meaning": "ear"}, {"category": "Kanji", "jp": "社", "kana": null, "reading": "yashiro / sha", "onyomi": "sha", "kunyomi": "yashiro", "meaning": "shinto shrine, society"}, {"category": "Kanji", "jp": "手", "kana": null, "reading": "te / shu", "onyomi": "shu", "kunyomi": "te", "meaning": "hand"}, {"category": "Kanji", "jp": "週", "kana": null, "reading": "– / shuu", "onyomi": "shuu", "kunyomi": "–", "meaning": "week"}, {"category": "Kanji", "jp": "少", "kana": null, "reading": "suko(shi), suku(nai) / shou", "onyomi": "shou", "kunyomi": "suko(shi), suku(nai)", "meaning": "a little"}, {"category": "Kanji", "jp": "新", "kana": null, "reading": "atara(shii), ara(ta), nii- / shin", "onyomi": "shin", "kunyomi": "atara(shii), ara(ta), nii-", "meaning": "new"}, {"category": "Kanji", "jp": "足", "kana": null, "reading": "ashi, ta(riru), ta(su) / soku", "onyomi": "soku", "kunyomi": "ashi, ta(riru), ta(su)", "meaning": "foot, to be sufficient, to add"}, {"category": "Kanji", "jp": "多", "kana": null, "reading": "oo(i) / ta", "onyomi": "ta", "kunyomi": "oo(i)", "meaning": "many"}, {"category": "Kanji", "jp": "店", "kana": null, "reading": "mise / ten", "onyomi": "ten", "kunyomi": "mise", "meaning": "shop"}, {"category": "Kanji", "jp": "買", "kana": null, "reading": "ka(u) / bai", "onyomi": "bai", "kunyomi": "ka(u)", "meaning": "to buy"}, {"category": "Kanji", "jp": "目", "kana": null, "reading": "me / moku", "onyomi": "moku", "kunyomi": "me", "meaning": "eye"}, {"category": "Kanji", "jp": "立", "kana": null, "reading": "ta(tsu), ta(teru) / ritsu", "onyomi": "ritsu", "kunyomi": "ta(tsu), ta(teru)", "meaning": "to stand, to establish"}, {"category": "Kanji", "jp": "六", "kana": null, "reading": "mutt(su), mu(tsu), mu, mui / roku", "onyomi": "roku", "kunyomi": "mutt(su), mu(tsu), mu, mui", "meaning": "six"}];

const ALL_ITEMS = RAW_ITEMS.map((d, i) => ({ id: `${d.category}-${i}`, ...d }));

const CATEGORY_ORDER = [
  "Nouns", "Verb", "Adjectives", "Adverb", "Pre-Noun Adjectivals",
  "Particles", "Katakana Words", "Hiragana", "Katakana", "Kanji",
];

const CATEGORIES = CATEGORY_ORDER
  .filter((c) => ALL_ITEMS.some((i) => i.category === c))
  .map((c) => ({ key: c, label: c, items: ALL_ITEMS.filter((i) => i.category === c) }));

/* Categories where the jp text can contain kanji with a hiragana reading
   worth showing as furigana. Kanji (tests the reading itself), Katakana
   Words, Hiragana and Katakana (already phonetic) are excluded on purpose. */
const FURIGANA_CATEGORIES = new Set([
  "Nouns", "Verb", "Adjectives", "Adverb", "Pre-Noun Adjectivals", "Particles",
]);

/* Categories with no separate "meaning" field — pure kana drills.
   These always test kanji/kana → reading regardless of prompt/answer
   settings, since there's no meaning to switch to and the jp text
   already *is* the phonetic form. */
const KANA_ONLY_CATEGORIES = new Set(["Hiragana", "Katakana"]);

const QUESTION_COUNT_OPTIONS = [10, 20, 50, 100];

function JpText({ item, showFurigana }) {
  const canShow = showFurigana && FURIGANA_CATEGORIES.has(item.category) && item.kana && item.kana !== item.jp;
  if (!canShow) return <>{item.jp}</>;
  return (
    <ruby>
      {item.jp}
      <rt>{item.kana}</rt>
    </ruby>
  );
}

/* ============================== HELPERS ============================== */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Resolve what this question actually asks, honoring each category's own
   promptType/answerType, with pure-kana categories forced to kanji→reading
   regardless of settings. For Kanji, includeOnyomi/includeKunyomi control
   which reading kind(s) can be the answer when a reading is asked. */
/* perCategoryConfig: { [categoryName]: { promptType?, answerType, includeOnyomi?, includeKunyomi? } }
   Kanji entries have answerType + includeOnyomi/includeKunyomi (no promptType — always jp).
   Every other configurable category has promptType + answerType. */
function resolveQuestion(item, perCategoryConfig) {
  if (KANA_ONLY_CATEGORIES.has(item.category) || !item.meaning) {
    return { item, promptField: "jp", answerField: "reading" };
  }

  const cfg = perCategoryConfig[item.category];
  const isKanji = item.category === "Kanji";

  if (isKanji) {
    const effectiveAnswer = cfg.answerType === "mixed" ? (Math.random() < 0.5 ? "romaji" : "meaning") : cfg.answerType;
    if (effectiveAnswer === "meaning") {
      return { item, promptField: "jp", answerField: "meaning" };
    }
    const kanjiReadingType = cfg.includeOnyomi && cfg.includeKunyomi ? "mixed" : cfg.includeOnyomi ? "onyomi" : "kunyomi";
    const wanted = kanjiReadingType === "mixed" ? (Math.random() < 0.5 ? "onyomi" : "kunyomi") : kanjiReadingType;
    const readingKind = item[wanted] ? wanted : item[wanted === "onyomi" ? "kunyomi" : "onyomi"] ? (wanted === "onyomi" ? "kunyomi" : "onyomi") : "reading";
    return { item, promptField: "jp", answerField: readingKind, kanjiMixedTrap: kanjiReadingType === "mixed" };
  }

  const effectivePrompt = cfg.promptType === "mixed" ? (Math.random() < 0.5 ? "kanji" : "romaji") : cfg.promptType;
  if (effectivePrompt === "romaji") {
    return { item, promptField: "reading", answerField: "meaning" };
  }
  const effectiveAnswer = cfg.answerType === "mixed" ? (Math.random() < 0.5 ? "romaji" : "meaning") : cfg.answerType;
  if (effectiveAnswer === "meaning") {
    return { item, promptField: "jp", answerField: "meaning" };
  }
  return { item, promptField: "jp", answerField: "reading" };
}

/* Same-kanji trap: when the Kanji reading-type setting is "Mixed", there's a
   chance one distractor is the SAME kanji's other reading (onyomi vs
   kunyomi) rather than a different kanji entirely — the classic mix-up. */
function buildKanjiReadingChoices(item, readingKind, allowTrap) {
  const correct = item[readingKind];
  const otherKind = readingKind === "onyomi" ? "kunyomi" : "onyomi";

  let trap = null;
  if (allowTrap) {
    const siblingValue = item[otherKind];
    if (siblingValue && siblingValue !== correct && Math.random() < 0.35) trap = siblingValue;
  }

  const sameKindPool = ALL_ITEMS.filter(
    (i) => i.category === "Kanji" && i.id !== item.id && i[readingKind] && i[readingKind] !== correct && i[readingKind] !== trap
  ).map((i) => i[readingKind]);
  let candidates = [...new Set(sameKindPool)];
  if (candidates.length < (trap ? 2 : 3)) {
    const wider = ALL_ITEMS.filter((i) => i.id !== item.id && i[readingKind] && i[readingKind] !== correct && i[readingKind] !== trap).map(
      (i) => i[readingKind]
    );
    candidates = [...new Set([...candidates, ...wider])];
  }

  const neededRandom = trap ? 2 : 3;
  const randomDistractors = shuffle(candidates).slice(0, neededRandom);
  const distractors = trap ? [trap, ...randomDistractors] : randomDistractors;
  return shuffle([correct, ...distractors]);
}

/* Legacy simple mode picker, used only for Match (no prompt/answer config there) */
function questionMode(item) {
  if (!item.meaning) return "reading";
  return Math.random() < 0.5 ? "meaning" : "reading";
}

function buildChoices(item, answerField, kanjiMixedTrap) {
  if (answerField === "onyomi" || answerField === "kunyomi") {
    return buildKanjiReadingChoices(item, answerField, !!kanjiMixedTrap);
  }
  const correct = item[answerField];
  const sameCategory = ALL_ITEMS.filter(
    (i) => i.id !== item.id && i.category === item.category && i[answerField] && i[answerField] !== correct
  ).map((i) => i[answerField]);

  let candidates = [...new Set(sameCategory)];
  if (candidates.length < 3) {
    const wider = ALL_ITEMS.filter((i) => i.id !== item.id && i[answerField] && i[answerField] !== correct).map((i) => i[answerField]);
    candidates = [...new Set([...candidates, ...wider])];
  }
  const distractors = shuffle(candidates).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

/* Build the exact ordered list of items a quiz session will ask, honoring
   the overflow choice when the selected pool is smaller than the requested
   question count. */
function buildSessionItems(pool, count, overflowChoice) {
  if (pool.length >= count) return shuffle(pool).slice(0, count);
  if (overflowChoice === "all") return shuffle(pool);
  // "repeat": cycle through re-shuffled laps of the pool until count is reached
  let result = [];
  while (result.length < count) result = result.concat(shuffle(pool));
  return result.slice(0, count);
}

/* ==============================================================
   LEADERBOARDS — now backed by a real server (Vercel KV) instead of the
   Claude.ai artifact storage API, so scores are shared across every device
   and every person who plays this deployment. One leaderboard per exact
   combination of category + question count + mode, since a 5-second Hard
   time-attack run and an untimed Normal run aren't comparable.
   ============================================================== */

async function loadLeaderboard(category, count, mode) {
  try {
    const params = new URLSearchParams({ category, count: String(count), mode });
    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch (e) {
    return [];
  }
}

// Returns the updated top-10 list on success, or null on failure (network
// error, or the server rejected it — e.g. a race where someone else's
// submission pushed this one back out of qualifying range in the meantime).
async function submitScore(category, count, mode, entry) {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, count, mode, ...entry }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : null;
  } catch (e) {
    return null;
  }
}

// Client-side pre-check only, so the name-entry form doesn't flash up and
// then get rejected — the server enforces this same rule independently and
// is the actual source of truth.
function qualifiesForLeaderboard(leaderboard, timeSeconds, score, total) {
  if (!meetsAccuracyBar(score, total)) return false;
  if (leaderboard.length < LEADERBOARD_MAX_ENTRIES) return true;
  return timeSeconds < leaderboard[leaderboard.length - 1].timeSeconds;
}

/* ============================== ROOT ============================== */

export default function N5Dojo() {
  const [screen, setScreen] = useState("home");
  const [selectedCategories, setSelectedCategories] = useState(() => CATEGORIES.map((c) => c.key));
  const [showFurigana, setShowFurigana] = useState(true);
  const [quizConfig, setQuizConfig] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const pool = useMemo(
    () => ALL_ITEMS.filter((i) => selectedCategories.includes(i.category)),
    [selectedCategories]
  );

  return (
    <div className="dojo-root">
      <style>{CSS}</style>
      <div className="grid-veil" aria-hidden="true" />

      {screen === "home" && (
        <Home
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          pool={pool}
          showFurigana={showFurigana}
          setShowFurigana={setShowFurigana}
          onQuiz={() => setScreen("quizSetup")}
          onMatch={() => setScreen("match")}
          onViewLeaderboards={() => setScreen("leaderboards")}
        />
      )}

      {screen === "leaderboards" && <LeaderboardBrowser onBack={() => setScreen("home")} />}

      {screen === "quizSetup" && (
        <QuizSetup
          pool={pool}
          onBack={() => setScreen("home")}
          onStart={(config) => {
            setQuizConfig(config);
            setScreen("quiz");
          }}
        />
      )}

      {screen === "quiz" && quizConfig && (
        <Quiz
          config={quizConfig}
          showFurigana={showFurigana}
          onExit={() => setScreen("home")}
          onFinish={(res) => {
            const categoriesInPlay = [...new Set(quizConfig.pool.map((i) => i.category))];
            const categoryKey = categoriesInPlay.length === 1 ? categoriesInPlay[0] : "Mixed";
            setLastResult({ ...res, categoryKey, count: quizConfig.count });
            setScreen("quizResults");
          }}
        />
      )}

      {screen === "quizResults" && (
        <QuizResults result={lastResult} onRetry={() => setScreen("quizSetup")} onHome={() => setScreen("home")} />
      )}

      {screen === "match" && (
        <Match
          pool={pool}
          showFurigana={showFurigana}
          onExit={() => setScreen("home")}
          onFinish={(res) => {
            setLastResult(res);
            setScreen("matchResults");
          }}
        />
      )}

      {screen === "matchResults" && (
        <MatchResults result={lastResult} onRetry={() => setScreen("match")} onHome={() => setScreen("home")} />
      )}
    </div>
  );
}

/* ============================== HOME ============================== */

function Home({ selectedCategories, setSelectedCategories, pool, showFurigana, setShowFurigana, onQuiz, onMatch, onViewLeaderboards }) {
  const allSelected = selectedCategories.length === CATEGORIES.length;
  const furiganaRelevant = pool.some((i) => FURIGANA_CATEGORIES.has(i.category) && i.kana);

  const toggleCategory = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    setSelectedCategories(allSelected ? [] : CATEGORIES.map((c) => c.key));
  };

  return (
    <div className="screen home-screen">
      <header className="home-header">
        <div className="hanko-mark" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" />
            <text x="50" y="62" textAnchor="middle">五級</text>
          </svg>
        </div>
        <h1>
          N5<span className="dojo-suffix">道場</span>
        </h1>
        <p className="home-tagline">JLPT N5 practice — from your word list</p>
      </header>

      <section className="category-rail" aria-label="Choose categories">
        <button className={`chip chip-selectall${allSelected ? " chip-active" : ""}`} onClick={toggleAll}>
          <span className="chip-jp">{allSelected ? "Deselect all" : "Select all"}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`chip${selectedCategories.includes(c.key) ? " chip-active" : ""}`}
            onClick={() => toggleCategory(c.key)}
            aria-pressed={selectedCategories.includes(c.key)}
          >
            <span className="chip-check" aria-hidden="true">{selectedCategories.includes(c.key) ? <Check size={12} /> : null}</span>
            <span className="chip-jp">{c.label}</span>
            <span className="chip-en">{c.items.length}</span>
          </button>
        ))}
      </section>

      <label className={`furigana-toggle${furiganaRelevant ? "" : " furigana-toggle-dim"}`}>
        <input type="checkbox" checked={showFurigana} onChange={(e) => setShowFurigana(e.target.checked)} />
        <span className="furigana-switch" aria-hidden="true" />
        <span className="furigana-label">
          Show furigana <span className="furigana-sub">(hiragana readings on kanji)</span>
        </span>
      </label>

      <section className="mode-grid">
        <button className="mode-card" onClick={onQuiz} disabled={pool.length < 2}>
          <span className="mode-jp">選択</span>
          <span className="mode-title">Quiz</span>
          <span className="mode-desc">Multiple choice — choose your prompt, answer, and question count.</span>
          <span className="mode-go">Set up →</span>
        </button>
        <button className="mode-card mode-card-alt" onClick={onMatch} disabled={pool.length < 3}>
          <span className="mode-jp">対</span>
          <span className="mode-title">Match</span>
          <span className="mode-desc">Flip cards and pair each term with its answer.</span>
          <span className="mode-go">Start →</span>
        </button>
      </section>

      <button className="leaderboard-link" onClick={onViewLeaderboards}>
        <Trophy size={14} /> View leaderboards
      </button>

      <footer className="home-footer">{ALL_ITEMS.length} terms total · {pool.length} in your selection</footer>
    </div>
  );
}

/* ============================== QUIZ SETUP ============================== */

function ConfigCarousel({ slides, renderSlide }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const scrollTimeout = useRef(null);

  const scrollToIndex = (i) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      setIndex(Math.max(0, Math.min(slides.length - 1, i)));
    }, 60);
  };

  useEffect(() => () => clearTimeout(scrollTimeout.current), []);

  if (slides.length === 0) return null;

  return (
    <div className="carousel-wrap">
      {slides.length > 1 && (
        <div className="carousel-nav">
          <button className="carousel-arrow" onClick={() => scrollToIndex(index - 1)} disabled={index === 0} aria-label="Previous category">
            <ChevronLeft size={16} />
          </button>
          <div className="carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.key}
                className={`carousel-dot${i === index ? " carousel-dot-active" : ""}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to ${s.key} settings`}
              />
            ))}
          </div>
          <button
            className="carousel-arrow"
            onClick={() => scrollToIndex(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="Next category"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
        {slides.map((s) => (
          <div className="carousel-slide" key={s.key}>
            {renderSlide(s)}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <p className="carousel-hint">
          {index + 1} of {slides.length} — swipe or use the arrows
        </p>
      )}
    </div>
  );
}

function summarizeConfig(cat, cfg) {
  if (cat === "Kanji") {
    if (cfg.answerType === "meaning") return "Meaning";
    const kinds = [cfg.includeOnyomi && "Onyomi", cfg.includeKunyomi && "Kunyomi"].filter(Boolean).join(" + ");
    return cfg.answerType === "mixed" ? `Meaning / ${kinds}` : kinds;
  }
  const promptLabel = cfg.promptType === "kanji" ? "Kanji/Kana" : cfg.promptType === "romaji" ? "Romaji" : "Mixed";
  const answerLabel = cfg.promptType === "romaji" ? "Meaning" : cfg.answerType === "mixed" ? "Mixed" : cfg.answerType === "romaji" ? "Romaji" : "Meaning";
  return `${promptLabel} → ${answerLabel}`;
}

function PromptAnswerFields({ cfg, isKanji, onChange }) {
  return (
    <>
      {!isKanji && (
        <>
          <span className="setup-sublabel">Prompt type</span>
          <div className="option-row segmented">
            <button className={`option-btn${cfg.promptType === "kanji" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "kanji" })}>
              Kanji / Kana
            </button>
            <button className={`option-btn${cfg.promptType === "romaji" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "romaji" })}>
              Romaji
            </button>
            <button className={`option-btn${cfg.promptType === "mixed" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "mixed" })}>
              Mixed
            </button>
          </div>
        </>
      )}

      {(isKanji || cfg.promptType !== "romaji") && (
        <>
          <span className="setup-sublabel">Answer type</span>
          <div className="option-row segmented">
            <button className={`option-btn${cfg.answerType === "romaji" ? " option-btn-active" : ""}`} onClick={() => onChange({ answerType: "romaji" })}>
              Romaji
            </button>
            <button className={`option-btn${cfg.answerType === "meaning" ? " option-btn-active" : ""}`} onClick={() => onChange({ answerType: "meaning" })}>
              Meaning
            </button>
            <button className={`option-btn${cfg.answerType === "mixed" ? " option-btn-active" : ""}`} onClick={() => onChange({ answerType: "mixed" })}>
              Mixed
            </button>
          </div>
        </>
      )}
      {!isKanji && cfg.promptType === "romaji" && <p className="setup-hint">Answer is always Meaning when the prompt is Romaji.</p>}

      {isKanji && cfg.answerType !== "meaning" && (
        <>
          <span className="setup-sublabel">Which readings</span>
          <div className="option-row">
            <button
              className={`option-btn option-btn-check${cfg.includeOnyomi ? " option-btn-active" : ""}`}
              onClick={() => onChange({ includeOnyomi: cfg.includeOnyomi && !cfg.includeKunyomi ? cfg.includeOnyomi : !cfg.includeOnyomi })}
            >
              {cfg.includeOnyomi ? <Check size={13} /> : null} Onyomi
            </button>
            <button
              className={`option-btn option-btn-check${cfg.includeKunyomi ? " option-btn-active" : ""}`}
              onClick={() => onChange({ includeKunyomi: cfg.includeKunyomi && !cfg.includeOnyomi ? cfg.includeKunyomi : !cfg.includeKunyomi })}
            >
              {cfg.includeKunyomi ? <Check size={13} /> : null} Kunyomi
            </button>
          </div>
          <p className="setup-hint setup-hint-dim">
            {cfg.includeOnyomi && cfg.includeKunyomi
              ? "Randomly asks either type per question, with an occasional decoy from the kanji's other reading."
              : `Only ${cfg.includeOnyomi ? "onyomi" : "kunyomi"} questions, no decoys.`}
          </p>
        </>
      )}
    </>
  );
}

function QuizSetup({ pool, onBack, onStart }) {
  const [count, setCount] = useState(10);
  const [overflowChoice, setOverflowChoice] = useState(null);
  const [timeAttackOn, setTimeAttackOn] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const mode = timeAttackOn ? difficulty : "normal";
  const timeLimitSeconds = mode === "easy" ? 10 : mode === "hard" ? 5 : null;

  const kanaOnlyCount = pool.filter((i) => KANA_ONLY_CATEGORIES.has(i.category) || !i.meaning).length;

  const nonKanjiCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => c !== "Kanji" && !KANA_ONLY_CATEGORIES.has(c) && pool.some((i) => i.category === c)),
    [pool]
  );
  const kanjiPresent = pool.some((i) => i.category === "Kanji");

  const defaultOtherConfig = () => ({ promptType: "kanji", answerType: "meaning" });
  const defaultKanjiConfig = () => ({ answerType: "meaning", includeOnyomi: true, includeKunyomi: true });

  // "Same for all" is the default: one shared config applied to every non-Kanji
  // category. Flip the switch to swipe through each one individually.
  const [customizePerCategory, setCustomizePerCategory] = useState(false);
  const [sharedConfig, setSharedConfig] = useState(defaultOtherConfig);
  const [perCategoryConfig, setPerCategoryConfig] = useState(() => {
    const map = {};
    nonKanjiCategories.forEach((c) => {
      map[c] = defaultOtherConfig();
    });
    return map;
  });
  const [kanjiConfig, setKanjiConfig] = useState(defaultKanjiConfig);

  const needsOverflowChoice = pool.length < count;

  useEffect(() => {
    setOverflowChoice(null);
  }, [count]);

  const canStart = pool.length >= 2 && (!needsOverflowChoice || overflowChoice);

  const handleStart = () => {
    if (!canStart) return;
    const finalConfig = {};
    nonKanjiCategories.forEach((cat) => {
      finalConfig[cat] = customizePerCategory ? perCategoryConfig[cat] || defaultOtherConfig() : sharedConfig;
    });
    if (kanjiPresent) finalConfig["Kanji"] = kanjiConfig;
    onStart({ pool, count, overflowChoice, perCategoryConfig: finalConfig, mode, timeLimitSeconds });
  };

  // Slides for the swipeable carousel: each non-Kanji category (only when
  // "Customize each" is on) plus Kanji (always its own slide, if present).
  const slides = [];
  if (customizePerCategory) {
    nonKanjiCategories.forEach((cat) => slides.push({ key: cat, isKanji: false }));
  }
  if (kanjiPresent) slides.push({ key: "Kanji", isKanji: true });

  const renderSlide = (s) => {
    const isKanji = s.isKanji;
    const cfg = isKanji ? kanjiConfig : perCategoryConfig[s.key] || defaultOtherConfig();
    const onChange = isKanji
      ? (patch) => setKanjiConfig((prev) => ({ ...prev, ...patch }))
      : (patch) => setPerCategoryConfig((prev) => ({ ...prev, [s.key]: { ...prev[s.key], ...patch } }));
    const itemCount = pool.filter((i) => i.category === s.key).length;
    return (
      <div className="category-config">
        <span className="category-config-label">
          {s.key} <span className="setup-hint-dim">({itemCount})</span>
        </span>
        <PromptAnswerFields cfg={cfg} isKanji={isKanji} onChange={onChange} />
      </div>
    );
  };

  return (
    <div className="screen setup-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <span className="setup-title">Quiz setup</span>
        <span className="score-pill">{pool.length}</span>
      </div>

      <div className="setup-body setup-body-scroll">
        <div className="setup-group">
          <span className="setup-label">Number of questions</span>
          <div className="option-row segmented">
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <button key={n} className={`option-btn${count === n ? " option-btn-active" : ""}`} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
          {needsOverflowChoice && (
            <div className="overflow-note">
              <span>Only {pool.length} terms in your selection — fewer than {count}.</span>
              <div className="option-row">
                <button
                  className={`option-btn${overflowChoice === "all" ? " option-btn-active" : ""}`}
                  onClick={() => setOverflowChoice("all")}
                >
                  Use all {pool.length}
                </button>
                <button
                  className={`option-btn${overflowChoice === "repeat" ? " option-btn-active" : ""}`}
                  onClick={() => setOverflowChoice("repeat")}
                >
                  Repeat terms to reach {count}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="setup-group">
          <span className="setup-label">Mode</span>
          <div className="option-row segmented">
            <button className={`option-btn${!timeAttackOn ? " option-btn-active" : ""}`} onClick={() => setTimeAttackOn(false)}>
              Normal
            </button>
            <button className={`option-btn${timeAttackOn ? " option-btn-active" : ""}`} onClick={() => setTimeAttackOn(true)}>
              Time Attack
            </button>
          </div>
          {timeAttackOn && (
            <>
              <span className="setup-sublabel">Difficulty</span>
              <div className="option-row segmented">
                <button className={`option-btn${difficulty === "easy" ? " option-btn-active" : ""}`} onClick={() => setDifficulty("easy")}>
                  Easy — 10s
                </button>
                <button className={`option-btn${difficulty === "hard" ? " option-btn-active" : ""}`} onClick={() => setDifficulty("hard")}>
                  Hard — 5s
                </button>
              </div>
              <p className="setup-hint setup-hint-dim">
                {timeLimitSeconds} seconds per question — running out counts as a miss and moves on automatically.
              </p>
            </>
          )}
        </div>

        {kanaOnlyCount > 0 && (
          <p className="setup-hint setup-hint-dim setup-kana-note">
            {kanaOnlyCount} kana-only term{kanaOnlyCount === 1 ? "" : "s"} in your selection always test Kana → Romaji — no settings needed for those.
          </p>
        )}

        {nonKanjiCategories.length >= 2 && (
          <div className="setup-group">
            <span className="setup-label">Word type prompts &amp; answers</span>
            <div className="option-row segmented">
              <button className={`option-btn${!customizePerCategory ? " option-btn-active" : ""}`} onClick={() => setCustomizePerCategory(false)}>
                Same for all
              </button>
              <button className={`option-btn${customizePerCategory ? " option-btn-active" : ""}`} onClick={() => setCustomizePerCategory(true)}>
                Customize each
              </button>
            </div>
          </div>
        )}

        {nonKanjiCategories.length >= 2 && !customizePerCategory && (
          <div className="setup-group category-config">
            <span className="category-config-label">{nonKanjiCategories.join(", ")}</span>
            <PromptAnswerFields cfg={sharedConfig} isKanji={false} onChange={(patch) => setSharedConfig((prev) => ({ ...prev, ...patch }))} />
          </div>
        )}

        {nonKanjiCategories.length === 1 && !customizePerCategory && renderSlide({ key: nonKanjiCategories[0], isKanji: false })}

        <ConfigCarousel slides={slides} renderSlide={renderSlide} />
      </div>

      <button className="btn-primary setup-start" onClick={handleStart} disabled={!canStart}>
        Start quiz →
      </button>
    </div>
  );
}


/* ============================== QUIZ ============================== */

function Quiz({ config, showFurigana, onExit, onFinish }) {
  const { pool, count, overflowChoice, perCategoryConfig, mode, timeLimitSeconds } = config;

  const questions = useMemo(() => {
    const sessionItems = buildSessionItems(pool, count, overflowChoice);
    return sessionItems.map((item) => {
      const resolved = resolveQuestion(item, perCategoryConfig);
      return { ...resolved, choices: buildChoices(resolved.item, resolved.answerField, resolved.kanjiMixedTrap) };
    });
  }, [pool, count, overflowChoice, perCategoryConfig]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const q = questions[index];
  const isTimeAttack = mode !== "normal" && timeLimitSeconds != null;

  const finishNow = (finalScore, finalMissed) => {
    const timeSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    onFinish({ score: finalScore, total: questions.length, missed: finalMissed, timeSeconds, mode });
  };

  const choose = (choice) => {
    if (feedback) return;
    clearInterval(countdownRef.current);
    const isCorrect = choice != null && choice === q.item[q.answerField];
    setSelected(choice);
    setFeedback(isCorrect ? "correct" : "wrong");
    const nextScore = isCorrect ? score + 1 : score;
    const nextMissed = isCorrect ? missed : [...missed, q];
    if (isCorrect) setScore(nextScore);
    else setMissed(nextMissed);

    timerRef.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        finishNow(nextScore, nextMissed);
      }
    }, 850);
  };

  // Time-attack countdown: resets every question, ticks down, times out as a miss.
  useEffect(() => {
    if (!isTimeAttack) return undefined;
    setTimeLeft(timeLimitSeconds);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdownRef.current);
          choose(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    },
    []
  );

  if (!q) return null;

  const FIELD_LABELS = { jp: "Kanji / Kana", reading: "Romaji", meaning: "Meaning", onyomi: "Onyomi", kunyomi: "Kunyomi" };
  const promptLabel = FIELD_LABELS[q.promptField] || q.promptField;
  const answerLabel = FIELD_LABELS[q.answerField] || q.answerField;
  const promptIsPlainText = q.promptField !== "jp";

  return (
    <div className="screen quiz-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <div className="progress-track">
          {questions.map((_, i) => (
            <span key={i} className={`progress-dot${i < index ? " dot-done" : ""}${i === index ? " dot-current" : ""}`} />
          ))}
        </div>
        <div className="score-pill">{score}</div>
      </div>

      <div className="quiz-card">
        {isTimeAttack && (
          <div className={`countdown${timeLeft <= 3 ? " countdown-urgent" : ""}`} aria-live="polite">
            {timeLeft}s
          </div>
        )}
        <span className="quiz-instruction">{promptLabel} → {answerLabel}</span>
        <div className={`jp-display${promptIsPlainText ? " romaji-display" : ""}`}>
          {q.promptField === "jp" ? <JpText item={q.item} showFurigana={showFurigana} /> : q.item[q.promptField]}
        </div>

        {feedback && (
          <div className={`stamp-layer ${feedback}`} aria-hidden="true">
            {feedback === "correct" ? (
              <div className="hanko-stamp">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" />
                  <text x="50" y="46" textAnchor="middle" className="hanko-line1">正</text>
                  <text x="50" y="70" textAnchor="middle" className="hanko-line2">解</text>
                </svg>
              </div>
            ) : (
              <div className="ink-cross">
                <svg viewBox="0 0 100 100">
                  <path d="M20,20 L80,80" />
                  <path d="M80,20 L20,80" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="choice-grid">
        {q.choices.map((choice) => {
          const isSelected = selected === choice;
          const isAnswer = feedback && choice === q.item[q.answerField];
          return (
            <button
              key={choice}
              className={`choice-btn${isSelected && feedback === "correct" ? " choice-correct" : ""}${
                isSelected && feedback === "wrong" ? " choice-wrong" : ""
              }${isAnswer && !isSelected ? " choice-reveal" : ""}`}
              onClick={() => choose(choice)}
              disabled={!!feedback}
            >
              {choice}
              {isSelected && feedback === "correct" && <Check size={16} />}
              {isSelected && feedback === "wrong" && <X size={16} />}
            </button>
          );
        })}
      </div>

      <div className="quiz-footer">
        Question {index + 1} of {questions.length}
      </div>
    </div>
  );
}

function QuizResults({ result, onRetry, onHome }) {
  const pct = Math.round((result.score / result.total) * 100);
  const verdict = pct === 100 ? "合格 — Perfect!" : pct >= 70 ? "合格 — Well done" : "もう一度 — Keep practicing";

  const key = leaderboardKey(result.categoryKey, result.count, result.mode);
  const [leaderboard, setLeaderboard] = useState(null); // null = loading
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedInfo, setSubmittedInfo] = useState(null); // { name, timeSeconds } for highlighting the new row

  useEffect(() => {
    let cancelled = false;
    loadLeaderboard(result.categoryKey, result.count, result.mode).then((entries) => {
      if (!cancelled) setLeaderboard(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [key, result.categoryKey, result.count, result.mode]);

  const qualifies = leaderboard != null && qualifiesForLeaderboard(leaderboard, result.timeSeconds, result.score, result.total);

  const handleSubmitName = async () => {
    const trimmed = name.trim().slice(0, 24) || "Anonymous";
    setSubmitting(true);
    setSubmitError(null);
    const updated = await submitScore(result.categoryKey, result.count, result.mode, {
      name: trimmed,
      timeSeconds: result.timeSeconds,
      score: result.score,
      total: result.total,
    });
    setSubmitting(false);
    if (updated) {
      setLeaderboard(updated);
      setSubmitted(true);
      setSubmittedInfo({ name: trimmed, timeSeconds: result.timeSeconds });
    } else {
      setSubmitError("Couldn't save your score — check your connection and try again.");
    }
  };

  const modeLabel = result.mode === "easy" ? "Time Attack (Easy)" : result.mode === "hard" ? "Time Attack (Hard)" : "Normal";

  return (
    <div className="screen results-screen">
      <Trophy size={34} className="results-icon" />
      <h2>{verdict}</h2>
      <div className="results-score">
        {result.score}
        <span className="results-of">/{result.total}</span>
      </div>
      <p className="results-time">
        {formatTime(result.timeSeconds)} · {result.categoryKey} · {result.count}Q · {modeLabel}
      </p>

      {result.missed.length > 0 && (
        <div className="missed-list">
          <p className="missed-title">Review</p>
          {result.missed.map((m, i) => (
            <div className="missed-row" key={i}>
              <span className="missed-jp">{m.promptField === "jp" ? m.item.jp : m.item[m.promptField]}</span>
              <span className="missed-answer">{m.item[m.answerField]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="leaderboard-panel">
        <p className="missed-title">Leaderboard — {result.categoryKey} · {result.count}Q · {modeLabel}</p>
        {leaderboard === null ? (
          <p className="setup-hint setup-hint-dim">Loading…</p>
        ) : (
          <>
            {qualifies && !submitted && (
              <div className="name-entry">
                <p className="setup-hint">New best time! Add your name:</p>
                <div className="name-entry-row">
                  <input
                    type="text"
                    className="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={24}
                    disabled={submitting}
                    onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmitName()}
                  />
                  <button className="btn-primary name-submit" onClick={handleSubmitName} disabled={submitting}>
                    {submitting ? "Saving…" : "Save"}
                  </button>
                </div>
                {submitError && <p className="setup-hint submit-error">{submitError}</p>}
              </div>
            )}
            {leaderboard.length === 0 && !qualifies ? (
              <p className="setup-hint setup-hint-dim">No entries yet — be the first to clear this one.</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((e, i) => (
                  <div
                    className={`leaderboard-row${
                      submitted && submittedInfo && e.name === submittedInfo.name && e.timeSeconds === submittedInfo.timeSeconds
                        ? " leaderboard-row-new"
                        : ""
                    }`}
                    key={i}
                  >
                    <span className="leaderboard-rank">{i + 1}</span>
                    <span className="leaderboard-name">{e.name}</span>
                    <span className="leaderboard-time">{formatTime(e.timeSeconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="results-actions">
        <button className="btn-primary" onClick={onRetry}>
          <RotateCcw size={16} /> Try again
        </button>
        <button className="btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}

/* ============================== MATCH ============================== */

function buildMatchCards(pool) {
  const pairCount = Math.min(6, pool.length);
  const chosen = shuffle(pool).slice(0, pairCount);
  const cards = [];
  chosen.forEach((item) => {
    const mode = questionMode(item);
    const pairId = item.id;
    cards.push({ key: `${pairId}-jp`, pairId, face: item.jp, item, isJp: true, kind: "jp" });
    cards.push({ key: `${pairId}-ans`, pairId, face: item[mode], item, isJp: false, kind: "ans" });
  });
  return shuffle(cards);
}

function Match({ pool, showFurigana, onExit, onFinish }) {
  const [cards] = useState(() => buildMatchCards(pool));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState(false);
  const [wrongPair, setWrongPair] = useState([]);

  useEffect(() => {
    if (matched.size === cards.length) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [matched.size, cards.length]);

  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0) {
      const timeout = setTimeout(() => onFinish({ moves, seconds, pairs: cards.length / 2 }), 500);
      return () => clearTimeout(timeout);
    }
  }, [matched, cards.length, moves, seconds, onFinish]);

  const flip = (idx) => {
    if (locked || flipped.includes(idx) || matched.has(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a].pairId === cards[b].pairId) {
        setTimeout(() => {
          setMatched((prev) => new Set(prev).add(a).add(b));
          setFlipped([]);
          setLocked(false);
        }, 450);
      } else {
        setWrongPair(next);
        setTimeout(() => {
          setFlipped([]);
          setWrongPair([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="screen match-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <div className="match-stats">
          <span>
            <Clock size={14} /> {mm}:{ss}
          </span>
          <span>
            <Shuffle size={14} /> {moves} moves
          </span>
        </div>
        <div className="score-pill">
          {matched.size / 2}/{cards.length / 2}
        </div>
      </div>

      <div className="match-grid">
        {cards.map((c, idx) => {
          const isFlipped = flipped.includes(idx) || matched.has(idx);
          const isMatched = matched.has(idx);
          const isWrong = wrongPair.includes(idx);
          return (
            <button
              key={c.key}
              className={`match-card${isFlipped ? " is-flipped" : ""}${isMatched ? " is-matched" : ""}${isWrong ? " is-wrong" : ""}`}
              onClick={() => flip(idx)}
              disabled={isMatched}
              aria-label={isFlipped ? c.face : "hidden card"}
            >
              <span className="match-card-inner">
                <span className="match-face match-front">
                  <Layers size={18} />
                </span>
                <span className="match-face match-back">
                  {c.isJp ? <JpText item={c.item} showFurigana={showFurigana} /> : c.face}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchResults({ result, onRetry, onHome }) {
  const mm = String(Math.floor(result.seconds / 60)).padStart(2, "0");
  const ss = String(result.seconds % 60).padStart(2, "0");
  return (
    <div className="screen results-screen">
      <Trophy size={34} className="results-icon" />
      <h2>そろった — All matched!</h2>
      <div className="match-summary">
        <div>
          <span className="summary-num">
            {mm}:{ss}
          </span>
          <span className="summary-label">time</span>
        </div>
        <div>
          <span className="summary-num">{result.moves}</span>
          <span className="summary-label">moves</span>
        </div>
        <div>
          <span className="summary-num">{result.pairs}</span>
          <span className="summary-label">pairs</span>
        </div>
      </div>
      <div className="results-actions">
        <button className="btn-primary" onClick={onRetry}>
          <RotateCcw size={16} /> Play again
        </button>
        <button className="btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}

/* ============================== LEADERBOARD BROWSER ============================== */

const LEADERBOARD_CATEGORY_OPTIONS = [...CATEGORY_ORDER, "Mixed"];
const LEADERBOARD_MODE_OPTIONS = [
  { key: "normal", label: "Normal" },
  { key: "easy", label: "Easy (10s)" },
  { key: "hard", label: "Hard (5s)" },
];

function LeaderboardBrowser({ onBack }) {
  const [category, setCategory] = useState(LEADERBOARD_CATEGORY_OPTIONS[0]);
  const [count, setCount] = useState(QUESTION_COUNT_OPTIONS[0]);
  const [mode, setMode] = useState("normal");
  const [leaderboard, setLeaderboard] = useState(null);

  const key = leaderboardKey(category, count, mode);

  useEffect(() => {
    let cancelled = false;
    setLeaderboard(null);
    loadLeaderboard(category, count, mode).then((entries) => {
      if (!cancelled) setLeaderboard(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [key, category, count, mode]);

  return (
    <div className="screen setup-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <span className="setup-title">Leaderboards</span>
      </div>

      <div className="setup-body setup-body-scroll">
        <div className="setup-group">
          <span className="setup-label">Category</span>
          <div className="category-rail category-rail-compact">
            {LEADERBOARD_CATEGORY_OPTIONS.map((c) => (
              <button key={c} className={`chip${category === c ? " chip-active" : ""}`} onClick={() => setCategory(c)}>
                <span className="chip-jp">{c}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="setup-group">
          <span className="setup-label">Questions</span>
          <div className="option-row segmented">
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <button key={n} className={`option-btn${count === n ? " option-btn-active" : ""}`} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-group">
          <span className="setup-label">Mode</span>
          <div className="option-row segmented">
            {LEADERBOARD_MODE_OPTIONS.map((m) => (
              <button key={m.key} className={`option-btn${mode === m.key ? " option-btn-active" : ""}`} onClick={() => setMode(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="leaderboard-panel">
          <p className="missed-title">
            {category} · {count}Q · {LEADERBOARD_MODE_OPTIONS.find((m) => m.key === mode).label}
          </p>
          {leaderboard === null ? (
            <p className="setup-hint setup-hint-dim">Loading…</p>
          ) : leaderboard.length === 0 ? (
            <p className="setup-hint setup-hint-dim">No entries yet — play this combination to set the first time.</p>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((e, i) => (
                <div className="leaderboard-row" key={i}>
                  <span className="leaderboard-rank">{i + 1}</span>
                  <span className="leaderboard-name">{e.name}</span>
                  <span className="leaderboard-time">{formatTime(e.timeSeconds)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== STYLES ============================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap');

.dojo-root {
  --paper: #eae3cf;
  --paper-deep: #ddd3b6;
  --paper-line: rgba(42,39,35,0.06);
  --ink: #2a2723;
  --ink-soft: #5c574d;
  --indigo: #1f3f5c;
  --indigo-deep: #16314a;
  --gold: #cf9a2c;
  --hanko: #a83a32;
  --success: #4c7a4a;
  position: relative;
  min-height: 100%;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Zen Kaku Gothic New', sans-serif;
  overflow: hidden;
  border-radius: 18px;
  isolation: isolate;
}
.dojo-root *, .dojo-root *::before, .dojo-root *::after { box-sizing: border-box; }
.dojo-root button { font-family: inherit; cursor: pointer; }
.dojo-root button:disabled { opacity: 0.45; cursor: default; }
.dojo-root button:focus-visible { outline: 2px solid var(--indigo); outline-offset: 2px; }

.grid-veil {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    repeating-linear-gradient(0deg, var(--paper-line) 0, var(--paper-line) 1px, transparent 1px, transparent 34px),
    repeating-linear-gradient(90deg, var(--paper-line) 0, var(--paper-line) 1px, transparent 1px, transparent 34px);
}

.screen { position: relative; z-index: 1; padding: 28px 22px 24px; display: flex; flex-direction: column; min-height: 520px; }

/* ---------- Home ---------- */
.home-header { text-align: center; margin-bottom: 18px; }
.hanko-mark { width: 46px; height: 46px; margin: 0 auto 10px; opacity: 0.9; }
.hanko-mark svg { width: 100%; height: 100%; }
.hanko-mark circle { fill: none; stroke: var(--hanko); stroke-width: 6; }
.hanko-mark text { font-family: 'Shippori Mincho', serif; font-size: 26px; fill: var(--hanko); }
.home-header h1 { font-family: 'Shippori Mincho', serif; font-size: 40px; font-weight: 800; margin: 0; color: var(--indigo-deep); letter-spacing: 0.02em; }
.dojo-suffix { font-size: 26px; margin-left: 4px; color: var(--hanko); }
.home-tagline { margin: 6px 0 0; color: var(--ink-soft); font-size: 13.5px; }

.category-rail { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; max-height: 148px; overflow-y: auto; padding: 2px; }
.chip {
  background: var(--paper-deep); border: 1px solid rgba(42,39,35,0.12); border-radius: 999px;
  padding: 8px 16px; display: flex; align-items: center; gap: 6px; transition: all .15s ease;
}
.chip-check { display: flex; align-items: center; color: #fff; width: 12px; }
.chip-jp { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 13px; font-weight: 700; }
.chip-en { font-size: 10.5px; color: var(--ink-soft); letter-spacing: 0.04em; }
.chip:hover { border-color: var(--indigo); }
.chip-active { background: var(--indigo); border-color: var(--indigo); }
.chip-active .chip-jp { color: #fff; }
.chip-active .chip-en { color: rgba(255,255,255,0.75); }
.chip-selectall { border-style: dashed; }
.chip-selectall.chip-active { border-style: solid; }

.furigana-toggle { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 20px; cursor: pointer; user-select: none; }
.furigana-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
.furigana-switch {
  width: 34px; height: 20px; border-radius: 999px; background: rgba(42,39,35,0.18); position: relative;
  flex-shrink: 0; transition: background .15s ease;
}
.furigana-switch::after {
  content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: transform .15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.furigana-toggle input:checked + .furigana-switch { background: var(--indigo); }
.furigana-toggle input:checked + .furigana-switch::after { transform: translateX(14px); }
.furigana-toggle input:focus-visible + .furigana-switch { outline: 2px solid var(--indigo); outline-offset: 2px; }
.furigana-label { font-size: 12.5px; font-weight: 700; color: var(--ink); }
.furigana-sub { font-weight: 400; color: var(--ink-soft); }
.furigana-toggle-dim .furigana-label { color: var(--ink-soft); }

ruby { ruby-position: over; }
rt { font-family: 'Zen Kaku Gothic New', sans-serif; font-weight: 500; color: var(--ink-soft); }
.jp-display rt { font-size: 16px; letter-spacing: 0; }
.match-back rt { font-size: 9px; }

.mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; flex: 1; }
.mode-card {
  background: var(--paper-deep); border: 1px solid rgba(42,39,35,0.12); border-radius: 14px;
  padding: 22px 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  text-align: left; transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  position: relative; overflow: hidden;
}
.mode-card:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(31,63,92,0.14); border-color: var(--indigo); }
.mode-jp { font-family: 'Shippori Mincho', serif; font-size: 30px; color: var(--hanko); opacity: 0.55; position: absolute; top: 10px; right: 14px; }
.mode-title { font-size: 19px; font-weight: 900; color: var(--indigo-deep); }
.mode-desc { font-size: 12.5px; color: var(--ink-soft); line-height: 1.4; }
.mode-go { margin-top: auto; padding-top: 10px; font-size: 13px; font-weight: 700; color: var(--indigo); }

.home-footer { text-align: center; margin-top: 18px; font-size: 11.5px; color: var(--ink-soft); }
.leaderboard-link {
  display: flex; align-items: center; justify-content: center; gap: 6px; background: none; border: none;
  color: var(--indigo); font-weight: 700; font-size: 12.5px; margin-top: 14px; padding: 6px;
}
.leaderboard-link:hover { color: var(--indigo-deep); text-decoration: underline; }
.category-rail-compact { max-height: 110px; }

/* ---------- Setup screen ---------- */
.setup-title { flex: 1; font-weight: 800; font-size: 14px; color: var(--indigo-deep); }
.setup-body { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.setup-body-scroll { overflow-y: auto; max-height: 440px; padding-right: 2px; }
.setup-group { display: flex; flex-direction: column; gap: 8px; }
.category-config { background: var(--paper-deep); border: 1px solid rgba(42,39,35,0.1); border-radius: 12px; padding: 14px; gap: 10px; }
.category-config-label { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 13px; font-weight: 700; color: var(--indigo-deep); }
.category-config-header {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  background: none; border: none; padding: 0; width: 100%; text-align: left;
}
.category-config-summary { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-soft); font-weight: 600; flex-shrink: 0; }
.chevron { transition: transform 0.18s ease; color: var(--ink-soft); }
.chevron-open { transform: rotate(180deg); }
.setup-sublabel { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: var(--ink-soft); margin-top: 4px; }
.setup-kana-note { background: rgba(42,39,35,0.06); border-radius: 8px; padding: 8px 10px; }

.carousel-wrap { display: flex; flex-direction: column; gap: 8px; }
.carousel-nav { display: flex; align-items: center; justify-content: center; gap: 12px; }
.carousel-arrow {
  background: var(--paper-deep); border: 1px solid rgba(42,39,35,0.14); border-radius: 999px;
  padding: 6px; display: flex; color: var(--ink); flex-shrink: 0;
}
.carousel-arrow:disabled { opacity: 0.3; }
.carousel-arrow:hover:not(:disabled) { border-color: var(--indigo); color: var(--indigo); }
.carousel-dots { display: flex; gap: 6px; align-items: center; }
.carousel-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(42,39,35,0.22); border: none; padding: 0; transition: all 0.18s ease; }
.carousel-dot-active { background: var(--indigo); width: 18px; border-radius: 4px; }
.carousel-track {
  display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
  scrollbar-width: none; border-radius: 12px;
}
.carousel-track::-webkit-scrollbar { display: none; }
.carousel-slide { flex: 0 0 100%; scroll-snap-align: start; scroll-snap-stop: always; min-width: 0; }
.carousel-hint { text-align: center; font-size: 11px; color: var(--ink-soft); margin: 0; }

.setup-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; color: var(--ink-soft); }
.setup-hint { font-size: 12.5px; color: var(--ink-soft); margin: 0; }
.setup-hint-dim { font-size: 11px; opacity: 0.8; }
.option-row { display: flex; gap: 8px; flex-wrap: wrap; }
.option-btn {
  background: #fff; border: 1.5px solid rgba(42,39,35,0.16); border-radius: 10px; padding: 9px 14px;
  font-size: 13px; font-weight: 700; color: var(--ink); transition: all .12s ease;
}
.option-btn-check { display: inline-flex; align-items: center; gap: 5px; }
.option-btn:hover { border-color: var(--indigo); }
.option-btn-active { background: var(--indigo); border-color: var(--indigo); color: #fff; }

/* Segmented-control variant: joined pill group for mutually-exclusive choices
   (prompt/answer type, question count, same-for-all toggle) */
.option-row.segmented { background: rgba(42,39,35,0.07); border-radius: 10px; padding: 3px; gap: 2px; flex-wrap: nowrap; }
.option-row.segmented .option-btn { flex: 1; background: transparent; border: none; color: var(--ink-soft); padding: 8px 10px; white-space: nowrap; }
.option-row.segmented .option-btn:hover { border-color: transparent; color: var(--ink); }
.option-row.segmented .option-btn-active { background: #fff; border: none; color: var(--indigo-deep); box-shadow: 0 1px 3px rgba(0,0,0,0.14); }

.overflow-note {
  background: rgba(207,154,44,0.14); border: 1px solid rgba(207,154,44,0.4); border-radius: 10px;
  padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; color: var(--ink);
}
.setup-start { width: 100%; justify-content: center; margin-top: 8px; }

/* ---------- Quiz / Match top bar ---------- */
.quiz-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.icon-btn { background: transparent; border: 1px solid rgba(42,39,35,0.16); border-radius: 10px; padding: 7px; display: flex; color: var(--ink); }
.icon-btn:hover { background: var(--paper-deep); }
.progress-track { flex: 1; display: flex; gap: 5px; }
.progress-dot { flex: 1; height: 5px; border-radius: 3px; background: rgba(42,39,35,0.14); }
.dot-done { background: var(--indigo); }
.dot-current { background: var(--gold); }
.score-pill { background: var(--indigo); color: #fff; font-weight: 800; font-size: 13px; padding: 6px 12px; border-radius: 999px; min-width: 34px; text-align: center; }
.match-stats { flex: 1; display: flex; gap: 14px; font-size: 12.5px; color: var(--ink-soft); align-items: center; }
.match-stats span { display: flex; align-items: center; gap: 4px; }

/* ---------- Quiz card ---------- */
.quiz-card {
  position: relative; background: var(--paper-deep); border: 1px solid rgba(42,39,35,0.12); border-radius: 16px;
  padding: 30px 18px; display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 18px;
  min-height: 150px; justify-content: center; overflow: hidden;
}
.countdown {
  position: absolute; top: 10px; right: 12px; background: var(--indigo); color: #fff; font-weight: 800;
  font-size: 13px; padding: 5px 10px; border-radius: 999px; font-variant-numeric: tabular-nums;
}
.countdown-urgent { background: var(--hanko); animation: pulse 0.6s ease infinite alternate; }
@keyframes pulse { from { opacity: 1; } to { opacity: 0.6; } }
.quiz-instruction { font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-soft); font-weight: 700; }
.jp-display { font-family: 'Shippori Mincho', serif; font-size: 44px; font-weight: 700; color: var(--ink); text-align: center; word-break: break-word; }
.jp-display.romaji-display { font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 32px; font-style: italic; }

.stamp-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.hanko-stamp { width: 92px; height: 92px; animation: stampDown 0.4s cubic-bezier(.2,1.4,.4,1); }
.hanko-stamp svg { width: 100%; height: 100%; }
.hanko-stamp circle { fill: none; stroke: var(--hanko); stroke-width: 5; opacity: 0.88; }
.hanko-line1, .hanko-line2 { font-family: 'Shippori Mincho', serif; font-size: 24px; fill: var(--hanko); opacity: 0.88; }
@keyframes stampDown { 0% { transform: scale(2.2) rotate(-14deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: scale(1) rotate(-8deg); opacity: 1; } }
.ink-cross { width: 64px; height: 64px; animation: shakeX 0.4s ease; }
.ink-cross svg { width: 100%; height: 100%; }
.ink-cross path { stroke: var(--ink); stroke-width: 9; stroke-linecap: round; opacity: 0.75; }
@keyframes shakeX { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }

.choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.choice-btn {
  background: #fff; border: 1.5px solid rgba(42,39,35,0.14); border-radius: 12px; padding: 14px 10px;
  font-size: 15px; font-weight: 600; color: var(--ink); display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: border-color .12s ease, background .12s ease;
}
.choice-btn:hover:not(:disabled) { border-color: var(--indigo); }
.choice-btn:disabled { cursor: default; opacity: 1; }
.choice-correct { background: rgba(76,122,74,0.14); border-color: var(--success); color: var(--success); }
.choice-wrong { background: rgba(168,58,50,0.1); border-color: var(--hanko); color: var(--hanko); }
.choice-reveal { border-color: var(--success); color: var(--success); }

.quiz-footer { margin-top: auto; text-align: center; font-size: 12px; color: var(--ink-soft); padding-top: 14px; }

/* ---------- Match grid ---------- */
.match-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; flex: 1; align-content: start; }
.match-card { background: transparent; border: none; padding: 0; aspect-ratio: 3/4; perspective: 700px; }
.match-card-inner { display: block; width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.4s cubic-bezier(.3,.8,.4,1); }
.is-flipped .match-card-inner { transform: rotateY(180deg); }
.match-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 4px; text-align: center; }
.match-front { background: var(--indigo); color: rgba(255,255,255,0.8); border: 1px solid var(--indigo-deep); }
.match-back { background: #fff; border: 1.5px solid rgba(42,39,35,0.16); transform: rotateY(180deg); font-family: 'Shippori Mincho', serif; font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.2; word-break: break-word; }
.is-matched .match-back { background: rgba(76,122,74,0.14); border-color: var(--success); color: var(--success); }
.is-wrong .match-back { background: rgba(168,58,50,0.1); border-color: var(--hanko); color: var(--hanko); }
.is-matched { opacity: 0.55; }

/* ---------- Results ---------- */
.results-screen { align-items: center; text-align: center; justify-content: center; }
.results-icon { color: var(--gold); margin-bottom: 6px; }
.results-screen h2 { font-family: 'Shippori Mincho', serif; font-size: 22px; color: var(--indigo-deep); margin: 0 0 14px; }
.results-score { font-size: 52px; font-weight: 900; color: var(--indigo); font-family: 'Shippori Mincho', serif; }
.results-of { font-size: 24px; color: var(--ink-soft); }
.missed-list { width: 100%; max-width: 320px; margin-top: 18px; background: var(--paper-deep); border-radius: 12px; padding: 12px 16px; max-height: 220px; overflow-y: auto; }
.missed-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft); font-weight: 700; margin: 0 0 8px; }
.missed-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(42,39,35,0.08); font-size: 14px; gap: 10px; }
.missed-row:last-child { border-bottom: none; }
.missed-jp { font-family: 'Shippori Mincho', serif; font-weight: 700; }
.missed-answer { color: var(--ink-soft); text-align: right; }
.results-time { font-size: 12px; color: var(--ink-soft); margin: 2px 0 0; }

.leaderboard-panel { width: 100%; max-width: 340px; margin-top: 18px; background: var(--paper-deep); border-radius: 12px; padding: 12px 16px; }
.name-entry { background: rgba(207,154,44,0.14); border: 1px solid rgba(207,154,44,0.4); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; }
.name-entry-row { display: flex; gap: 8px; margin-top: 6px; }
.name-input {
  flex: 1; border: 1.5px solid rgba(42,39,35,0.2); border-radius: 8px; padding: 8px 10px; font-size: 13px;
  font-family: 'Zen Kaku Gothic New', sans-serif; color: var(--ink); background: #fff;
}
.name-input:focus { outline: 2px solid var(--indigo); outline-offset: 1px; }
.name-submit { padding: 8px 16px; font-size: 13px; }
.submit-error { color: var(--hanko); margin-top: 6px; }
.leaderboard-list { display: flex; flex-direction: column; gap: 2px; }
.leaderboard-row { display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: center; padding: 6px 4px; border-radius: 6px; font-size: 13.5px; }
.leaderboard-row-new { background: rgba(76,122,74,0.16); font-weight: 700; }
.leaderboard-rank { color: var(--ink-soft); font-weight: 800; font-size: 12px; }
.leaderboard-name { font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.leaderboard-time { font-variant-numeric: tabular-nums; color: var(--indigo-deep); font-weight: 700; }

.match-summary { display: flex; gap: 28px; margin: 8px 0 22px; }
.match-summary > div { display: flex; flex-direction: column; align-items: center; }
.summary-num { font-size: 26px; font-weight: 900; color: var(--indigo); font-family: 'Shippori Mincho', serif; }
.summary-label { font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

.results-actions { display: flex; gap: 10px; margin-top: 6px; }
.btn-primary { background: var(--indigo); color: #fff; border: none; border-radius: 10px; padding: 11px 20px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary:hover:not(:disabled) { background: var(--indigo-deep); }
.btn-ghost { background: transparent; border: 1.5px solid rgba(42,39,35,0.18); border-radius: 10px; padding: 11px 20px; font-weight: 700; font-size: 14px; color: var(--ink); }
.btn-ghost:hover { border-color: var(--indigo); color: var(--indigo); }

@media (max-width: 420px) {
  .mode-grid { grid-template-columns: 1fr; }
  .match-grid { grid-template-columns: repeat(3, 1fr); }
  .jp-display { font-size: 36px; }
  .home-header h1 { font-size: 32px; }
}

@media (prefers-reduced-motion: reduce) {
  .dojo-root * { animation: none !important; transition: none !important; }
}
`;
