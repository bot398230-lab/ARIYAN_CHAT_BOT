const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const cacheDir = path.join(__dirname, "cache");
const imagePath = path.join(cacheDir, "help_avatar.jpg");
const TARGET_UID = "61595546250453";

if (!fs.existsSync(cacheDir)) {
	fs.mkdirSync(cacheDir, { recursive: true });
}

// Category emoji map (visual color feel)
const categoryEmoji = {
	"AI": "🤖",
	"AI-IMAGE": "🎨",
	"ANIME": "🌸",
	"ADMIN": "👑",
	"ADULT": "🔞",
	"18+": "🔥",
	"FUN": "🎉",
	"GAME": "🎮",
	"GROUP": "👥",
	"IMAGE": "🖼️",
	"INFO": "ℹ️",
	"LOVE": "💕",
	"MEDIA": "🎬",
	"MUSIC": "🎵",
	"NSFW": "🔞",
	"OWNER": "💎",
	"SYSTEM": "⚙️",
	"TOOLS": "🛠️",
	"UTILITY": "📦",
	"ECONOMY": "💰",
	"RANK": "🏆",
	"PROTECTION": "🛡️",
	"BOX": "📦",
	"BOX CHAT": "💬",
	"CUSTOM": "✨",
	"EVENTS": "📅",
	"OTHER": "🔹",
	"UNCATEGORIZED": "📌"
};

module.exports = {
	config: {
		name: "help",
		version: "3.5",
		author: "SK HABIBULLA",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "View command list & usage",
			bn: "কমান্ড তালিকা ও ব্যবহার দেখুন",
			vi: "Xem danh sách và cách dùng lệnh"
		},
		longDescription: {
			en: "Premium colorful help menu",
			bn: "প্রিমিয়াম কালারফুল হেল্প মেনু",
			vi: "Menu help cao cấp đầy màu sắc"
		},
		category: "info",
		guide: {
			en: "{pn} [command name]",
			bn: "{pn} [কমান্ডের নাম]",
			vi: "{pn} [tên lệnh]"
		},
		priority: 1
	},

	onStart: async function ({ message, args, event, threadsData }) {
		const { threadID } = event;
		const threadData = await threadsData.get(threadID);
		const prefix = getPrefix(threadID);
		const langCode = threadData.data.lang || global.GoatBot.config.language || "en";

		// ========== Avatar Load ==========
		let attachment = [];
		try {
			const avatarUrl = `https://graph.facebook.com/${TARGET_UID}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
			const res = await axios.get(avatarUrl, {
				responseType: "arraybuffer",
				timeout: 15000
			});
			fs.writeFileSync(imagePath, Buffer.from(res.data));
			attachment = [fs.createReadStream(imagePath)];
		} catch (err) {
			console.log("[HELP] Avatar load failed:", err.message);
		}

		// ========== MAIN HELP LIST ==========
		if (args.length === 0) {
			const categories = {};

			for (const [name, value] of commands) {
				const category = (value.config.category || "Uncategorized").toUpperCase();
				if (!categories[category]) categories[category] = [];
				if (!categories[category].includes(name)) {
					categories[category].push(name);
				}
			}

			let msg = "";

			// ===== BOLD PREMIUM HEADER =====
			msg += `╔══════════════════════════╗\n`;
			msg += `║     ⚡ 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 ⚡     ║\n`;
			msg += `╚══════════════════════════╝\n\n`;

			const sortedCategories = Object.keys(categories).sort();

			for (const category of sortedCategories) {
				const cmds = categories[category].sort();
				const emoji = categoryEmoji[category] || "🔹";

				// Bold style category header
				msg += `┏━━━━━━━━━━━━━━━━━━━━┓\n`;
				msg += `┃  ${emoji}  ${category}  ${emoji}\n`;
				msg += `┣━━━━━━━━━━━━━━━━━━━━┫\n`;

				for (const cmd of cmds) {
					msg += `┃   ✦  ${cmd}\n`;
				}

				msg += `┗━━━━━━━━━━━━━━━━━━━━┛\n\n`;
			}

			const totalCommands = commands.size;

			const helpHint =
				langCode === "bn" ? `বিস্তারিত জানতে লিখুন → ${prefix}help <কমান্ড>` :
				langCode === "vi" ? `Gõ ${prefix}help <lệnh> để xem chi tiết` :
				`Type ${prefix}help <cmd> for details`;

			msg += `╔══════════════════════════╗\n`;
			msg += `║  📦 Total Commands : ${totalCommands}\n`;
			msg += `║  💡 ${helpHint}\n`;
			msg += `╚══════════════════════════╝\n\n`;

			msg += `✦ 𝗔𝗗𝗠𝗜𝗡     →  ♡┋𝙼𝙸𝚁𝙹𝙰𝙵𝙾𝚁\n`;
			msg += `✦ 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣  →  01617183579`;

			try {
				const sent = await message.reply({
					body: msg,
					attachment
				});
				setTimeout(() => message.unsend(sent.messageID).catch(() => {}), 90000);
			} catch (e) {
				await message.reply(msg);
			}

		} else {
			// ========== SINGLE COMMAND INFO ==========
			const commandName = args[0].toLowerCase();
			const command = commands.get(commandName) || commands.get(aliases.get(commandName));

			if (!command) {
				const notFound =
					langCode === "bn" ? `❌ | "${commandName}" নামে কোনো কমান্ড পাওয়া যায়নি!` :
					langCode === "vi" ? `❌ | Không tìm thấy lệnh "${commandName}"` :
					`❌ | Command "${commandName}" not found`;
				return message.reply(notFound);
			}

			const config = command.config;
			const roleText = roleTextToString(config.role, langCode);

			const labels = {
				bn: {
					name: "নাম",
					alias: "অ্যালিয়াস",
					desc: "বর্ণনা",
					author: "লেখক",
					guide: "ব্যবহার",
					ver: "ভার্সন",
					role: "অনুমতি",
					none: "নেই",
					unknown: "অজানা"
				},
				vi: {
					name: "Tên",
					alias: "Tên khác",
					desc: "Mô tả",
					author: "Tác giả",
					guide: "Hướng dẫn",
					ver: "Phiên bản",
					role: "Quyền",
					none: "Không có",
					unknown: "Không rõ"
				},
				en: {
					name: "NAME",
					alias: "ALIASES",
					desc: "DESCRIPTION",
					author: "AUTHOR",
					guide: "USAGE",
					ver: "VERSION",
					role: "ROLE",
					none: "None",
					unknown: "Unknown"
				}
			};

			const lb = labels[langCode] || labels.en;

			const desc =
				config.description?.[langCode] ||
				config.description?.en ||
				config.longDescription?.[langCode] ||
				config.longDescription?.en ||
				"No description available";

			const guideBody = config.guide?.[langCode] || config.guide?.en || "";
			const usage = guideBody
				.replace(/{pn}/g, prefix + config.name)
				.replace(/{p}/g, prefix)
				.replace(/{n}/g, config.name) || `\( {prefix} \){config.name}`;

			const response =
`╔══════════════════════════╗
║     ⚡ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 ⚡     ║
╚══════════════════════════╝

┌─ ${lb.name}
│  ➜  ${config.name}
├─ ${lb.alias}
│  ➜  ${config.aliases ? config.aliases.join(", ") : lb.none}
├─ ${lb.desc}
│  ➜  ${desc}
├─ ${lb.author}
│  ➜  ${config.author || lb.unknown}
├─ ${lb.guide}
│  ➜  ${usage}
├─ ${lb.ver}
│  ➜  ${config.version || "1.0"}
├─ ${lb.role}
│  ➜  ${roleText}
└──────────────────────────`;

			try {
				const sent = await message.reply({
					body: response,
					attachment
				});
				setTimeout(() => message.unsend(sent.messageID).catch(() => {}), 90000);
			} catch (e) {
				await message.reply(response);
			}
		}
	}
};

function roleTextToString(role, lang) {
	const roles = {
		bn: ["সবাই", "গ্রুপ অ্যাডমিন", "বট অ্যাডমিন", "ডেভেলপার", "ভিআইপি", "NSFW ইউজার"],
		en: ["All Users", "Group Admin", "Bot Admin", "Developer", "VIP", "NSFW User"],
		vi: ["Tất cả", "Quản trị nhóm", "Admin bot", "Developer", "VIP", "NSFW"]
	};

	const r = roles[lang] || roles.en;
	if (role >= 0 && role <= 5) {
		return `${role} → ${r[role]}`;
	}
	return `${role} → Unknown`;
}
