const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const cacheDir = path.join(__dirname, "cache");
const imagePath = path.join(cacheDir, "help_avatar.jpg");
const TARGET_UID = "61595546250453";

// Cache folder তৈরি
if (!fs.existsSync(cacheDir)) {
	fs.mkdirSync(cacheDir, { recursive: true });
}

module.exports = {
	config: {
		name: "help",
		version: "2.2",
		author: "SK HABIBULLA",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "View command usage and list all commands",
			bn: "কমান্ড ব্যবহারের নিয়ম এবং তালিকা দেখুন",
			vi: "Xem cách sử dụng và danh sách lệnh"
		},
		longDescription: {
			en: "View command usage and list all commands directly",
			bn: "কমান্ড ব্যবহারের নিয়ম এবং তালিকা দেখুন",
			vi: "Xem cách sử dụng và danh sách lệnh"
		},
		category: "info",
		guide: {
			en: "{pn} [command name]",
			bn: "{pn} [কমান্ডের নাম]",
			vi: "{pn} [tên lệnh]"
		},
		priority: 1,
	},

	onStart: async function ({ message, args, event, threadsData, role, api }) {
		const { threadID } = event;
		const threadData = await threadsData.get(threadID);
		const prefix = getPrefix(threadID);
		const langCode = threadData.data.lang || global.GoatBot.config.language || "en";

		// ========== Profile Picture Load ==========
		let attachment = [];
		try {
			// Facebook profile picture URL
			const avatarUrl = `https://graph.facebook.com/${TARGET_UID}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

			const res = await axios.get(avatarUrl, {
				responseType: "arraybuffer",
				timeout: 15000
			});

			fs.writeFileSync(imagePath, Buffer.from(res.data));
			attachment = [fs.createReadStream(imagePath)];

		} catch (err) {
			console.log("[HELP] Avatar load failed:", err.message);
			attachment = [];
		}

		// ========== Main Help List ==========
		if (args.length === 0) {
			const categories = {};
			let msg = "";

			for (const [name, value] of commands) {
				const category = value.config.category || "Uncategorized";
				categories[category] = categories[category] || { commands: [] };
				if (!categories[category].commands.includes(name)) {
					categories[category].commands.push(name);
				}
			}

			msg += `╔════════════════════╗\n`;
			msg += `║     ⚡ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧 ⚡     ║\n`;
			msg += `╚════════════════════╝\n`;

			Object.keys(categories).sort().forEach((category) => {
				msg += `\n┏━━━ ${category.toUpperCase()} ━━━┓\n`;
				const names = categories[category].commands.sort();

				names.forEach((item) => {
					msg += `┃ ✦ ${item}\n`;
				});

				msg += `┗━━━━━━━━━━━━━━┛\n`;
			});

			const totalCommands = commands.size;
			let helpHint =
				langCode === "bn" ? `বিস্তারিত দেখতে ${prefix}help <কমান্ড> লিখুন।` :
				langCode === "vi" ? `Nhập ${prefix}help <lệnh> để xem chi tiết.` :
				`Type ${prefix}help <cmd> to see details.`;

			msg += `\n┌──────────────────┐\n`;
			msg += `│ 📦 Total Commands : ${totalCommands}\n`;
			msg += `│ 💡 ${helpHint}\n`;
			msg += `└──────────────────┘\n`;
			msg += `\n✦ ADMIN: ♡┋𝐚𝐫𝐢𝐲𝐚𝐧\n`;
			msg += `✦ WHATSAPP: 01937278213`;

			try {
				const hh = await message.reply({
					body: msg,
					attachment: attachment
				});
				setTimeout(() => {
					message.unsend(hh.messageID).catch(() => {});
				}, 80000);
			} catch (error) {
				console.error("Help Error:", error);
				await message.reply(msg);
			}

		} else {
			// ========== Single Command Info ==========
			const commandName = args[0].toLowerCase();
			const command = commands.get(commandName) || commands.get(aliases.get(commandName));

			if (!command) {
				const notFound =
					langCode === "bn" ? `❌ | বেবি, "${commandName}" নামে কোনো কমান্ড নেই!` :
					langCode === "vi" ? `❌ | Không tìm thấy lệnh "${commandName}".` :
					`❌ | Command "${commandName}" not found.`;
				return message.reply(notFound);
			}

			const config = command.config;
			const roleText = roleTextToString(config.role, langCode);

			const labels = {
				bn: { name: "নাম", alias: "ডাকনাম", info: "তথ্য", desc: "বর্ণনা", author: "লেখক", guide: "নির্দেশনা", usage: "ভার্সন ও পারমিশন", ver: "ভার্সন", role: "অনুমতি", none: "নেই", unknown: "অজানা" },
				vi: { name: "Tên", alias: "Tên khác", info: "Thông tin", desc: "Mô tả", author: "Tác giả", guide: "Hướng dẫn", usage: "Phiên bản & Quyền", ver: "Phiên bản", role: "Quyền hạn", none: "Không có", unknown: "Không xác định" },
				en: { name: "NAME", alias: "Aliases", info: "INFO", desc: "Description", author: "Author", guide: "Guide", usage: "Details", ver: "Version", role: "Role", none: "None", unknown: "Unknown" }
			};

			const lb = labels[langCode] || labels.en;
			const desc = config.description?.[langCode] || config.description?.en || config.longDescription?.[langCode] || config.longDescription?.en || "No description";
			const guideBody = config.guide?.[langCode] || config.guide?.en || "";

			const usage = guideBody
				.replace(/{pn}/g, prefix + config.name)
				.replace(/{p}/g, prefix)
				.replace(/{n}/g, config.name);

			const response =
				`╔══════════════════╗\n` +
				`║   ⚡ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗  𝗜𝗡𝗙𝗢 ⚡   ║\n` +
				`╚══════════════════╝\n\n` +
				`┌─ ${lb.name}\n` +
				`│  ➜ ${config.name}\n` +
				`├─ ${lb.alias}\n` +
				`│  ➜ ${config.aliases ? config.aliases.join(", ") : lb.none}\n` +
				`├─ ${lb.desc}\n` +
				`│  ➜ ${desc}\n` +
				`├─ ${lb.author}\n` +
				`│  ➜ ${config.author || lb.unknown}\n` +
				`├─ ${lb.guide}\n` +
				`│  ➜ ${usage || prefix + config.name}\n` +
				`├─ ${lb.ver}\n` +
				`│  ➜ ${config.version || "1.0"}\n` +
				`├─ ${lb.role}\n` +
				`│  ➜ ${roleText}\n` +
				`└──────────────────`;

			try {
				const helpMessage = await message.reply({
					body: response,
					attachment: attachment
				});
				setTimeout(() => {
					message.unsend(helpMessage.messageID).catch(() => {});
				}, 80000);
			} catch (error) {
				console.error("Help Error:", error);
				await message.reply(response);
			}
		}
	}
};

function roleTextToString(role, lang) {
	const roles = {
		bn: ["সব ইউজার", "গ্রুপ অ্যাডমিন", "বোট অ্যাডমিন", "ডেভেলপার (Dev)", "ভিআইপি (VIP)", "NSFW ইউজার"],
		en: ["All users", "Group Admin", "Bot Admin", "Developer", "VIP User", "NSFW User"],
		vi: ["Tất cả người dùng", "Quản trị viên nhóm", "Admin bot", "Người phát triển", "Người dùng VIP", "Người dùng NSFW"]
	};

	const r = roles[lang] || roles.en;
	if (role >= 0 && role <= 5) {
		return `\( {role} ( \){r[role]})`;
	}
	return `${role} (Unknown)`;
                                                                           }
