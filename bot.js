const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ChannelType,
} = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const axios = require("axios");
const { Readable } = require("stream");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const token = process.env.TOKEN; 
const prefix = process.env.PREFIX;
const ownerID = "856480076689965086";

const { ActivityType, PresenceUpdateStatus } = require("discord.js");

const tickets = new Map();
const backups = new Map();
const logSettings = new Map();
const activeGames = new Map();
const giveaways = new Map();

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        activities: [{ name: "au lego", type: ActivityType.Playing }],
        status: PresenceUpdateStatus.Dnd,
    });

    console.log("🎮 Activity and status set successfully");
});

let connection = null;
let player = null;
const songUrl =
    "https://raw.githubusercontent.com/AdamD-v/elevatorsong/main/song.mp3";

async function downloadSong(url) {
    const response = await axios.get(url, {
        responseType: "stream",
    });
    return response.data;
}

async function playSong(message) {
    if (player) {
        player.stop();
    }

    player = createAudioPlayer();

    const songStream = await downloadSong(songUrl);
    const resource = createAudioResource(songStream, {
        inputType: "arbitrary",
    });

    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("🎶 Song ended, replaying...");
        playSong(message);
    });

    player.on(AudioPlayerStatus.Playing, () => {
        console.log("🎶 Song is playing!");
    });

    connection.subscribe(player);

    message.channel.send("🎶 Now playing the Elevator Song in a loop.");
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (message.content.toLowerCase() === prefix + "ping") {
        const sentMessage = await message.channel.send("Pinging...");
        const ping = sentMessage.createdTimestamp - message.createdTimestamp;
        sentMessage.edit(`Pong! 🏓 Latency: ${ping}ms`);
    } else if (message.content.toLowerCase().startsWith(prefix + "say")) {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const text = message.content.slice((prefix + "say").length).trim();
        if (!text)
            return message.channel.send("Dites un message à envoyer ! !");

        message.delete().catch(console.error);
        message.channel.send(text);
    } else if (message.content.toLowerCase().startsWith(prefix + "purge")) {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageMessages,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const args = message.content.split(" ");
        const amount = parseInt(args[1]);

        if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
            return message.channel.send(
                "❌ Dites un nombre entre 1 et 100 s'il vous plait.",
            );
        }

        await message.channel.bulkDelete(amount + 1, true).catch((err) => {
            console.error(err);
            message.channel.send(
                "❌ Erreur, les messages doivent avoir moins de 14 jours.",
            );
        });
    } else if (message.content.toLowerCase() === prefix + "cmds") {
        return message.channel.send(
            "Voici une liste des commandes disponibles :\n" +
                "`!ping` - Vérifie la latence du bot\n" +
                "`!say` - Permet au bot de dire un message (Admin uniquement)\n" +
                "`!purge` - Supprime un certain nombre de messages (Admin uniquement)\n" +
                "`!kick` - Expulse un membre (Admin uniquement)\n" +
                "`!ban` - Bannit un membre (Admin uniquement)\n" +
                "`!mute` - Muter un membre (Admin uniquement)\n" +
                "`!wr` - Salle d'attente (Admin uniquement)\n" +
                "`!leavevc` - Quitter la salle d'attente (Admin uniquement)\n" +
                "`!info` - Infos sur le serveur\n" +
                "`!avatar` - Afficher l'avatar d'un membre\n" +
                "`!userinfo` - Infos sur un utilisateur\n" +
                "`!serverinfo` - Infos détaillées sur le serveur\n" +
                "`!poll` - Créer un sondage\n" +
                "`!ticket` - Créer un nouveau ticket\n" +
                "`!close` - Fermer le ticket actuel\n" +
                "`!add` - Ajouter un membre au ticket\n" +
                "`!remove` - Retirer un membre du ticket\n" +
                "`!tickets` - Voir la liste des tickets\n" +
                "`!backup create` - Créer une sauvegarde du serveur\n" +
                "`!backup load` - Charger une sauvegarde\n" +
                "`!stats` - Voir les statistiques du serveur\n" +
                "`!roleinfo` - Voir les infos d'un rôle\n" +
                "`!setlog` - Définir le canal de logs\n" +
                "`!log join` - Activer les logs de connexion\n" +
                "`!log leave` - Activer les logs de déconnexion\n" +
                "`!log ban` - Activer les logs de bannissement\n" +
                "`!log messages` - Activer les logs de messages\n" +
                "`!connect4 [@adversaire]` - Jouer à Puissance 4 🟡🔴\n" +
                "`!hangman` - Lancez un jeu du pendu ✏️\n" +
                "`!chess [@adversaire]` - Démarre une partie d'échecs ♟️\n" +
                "`!trivia` - Poser une question de culture générale ❓\n" +
                "`!guessnumber` - Le bot choisit un nombre, à vous de deviner ! 🔢\n" +
                "`!lockall` - Verrouille tous les channels 🔒\n" +
                "`!unlockall` - Déverrouille tous les channels 🔓\n" +
                "`!lock` - Verrouille le channel actuel 🔒\n" +
                "`!unlock` - Déverrouille le channel actuel 🔓\n" +
                "`!nuke` - Supprime et recrée le salon 💥\n" +
                "`!clone` - Clone un salon 📋\n" +
                "`!roleall` - Donne un rôle à tous les membres 🌐\n" +
                "`!deroleall` - Retire un rôle à tous les membres 🚫",
        );
    }

    if (
        command === "!kill" ||
        command === "!restart" ||
        command === "!reloadstatus" ||
        command === "!eval"
    ) {
        if (message.author.id !== ownerID) {
            return message.channel.send(
                "❌ Vous n'êtes pas autorisé à utiliser cette commande.",
            );
        }
    }

    if (command === "!kill") {
        await message.channel.send("⚠️ Shutting down...");
        console.log("🛑 Bot is shutting down...");
        process.exit(0);
    } else if (command === "!restart") {
        await message.channel.send("🔄 Restarting bot...");
        console.log("♻️ Restarting bot...");
        process.exit(1);
    } else if (command === "!reloadstatus") {
        client.user.setPresence({
            activities: [
                { name: "Créé par AdamD_v", type: ActivityType.Playing },
            ],
            status: PresenceUpdateStatus.Dnd,
        });
        message.channel.send("🔁 Bot status reloaded!");
    } else if (command === "!eval") {
        try {
            const code = args.join(" ");
            if (!code)
                return message.channel.send(
                    "❌ Please provide JavaScript code to evaluate.",
                );

            let result = eval(code);
            if (typeof result !== "string")
                result = require("util").inspect(result);

            message.channel.send(`🖥️ **Output:**\n\`\`\`js\n${result}\n\`\`\``);
        } catch (error) {
            message.channel.send(`❌ **Error:**\n\`\`\`js\n${error}\n\`\`\``);
        }
    } else if (command === "!kick") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.KickMembers,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à expulser.");

        if (!member.kickable)
            return message.channel.send("❌ Impossible d'expulser ce membre.");
        await member
            .kick()
            .catch((err) => message.channel.send("❌ Erreur d'expulsion."));
        message.channel.send(`✅ ${member.user.tag} a été expulsé.`);
    }

    if (command === "!pdfr") {
        message.delete().catch(console.error);
        await message.channel.send(
            "https://www.roblox.com/games/13870964350/PLS-DONATE-BUT-YOU-DONATE-FAKE-ROBUX",
        );
    } else if (command === "!ban") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.BanMembers,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à bannir.");

        if (!member.bannable)
            return message.channel.send("❌ Impossible de bannir ce membre.");
        await member
            .ban()
            .catch((err) => message.channel.send("❌ Erreur de bannissement."));
        message.channel.send(`✅ ${member.user.tag} a été banni.`);
    } else if (command === "!mute") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageMessages,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à muter.");

        const muteRole = message.guild.roles.cache.find(
            (role) => role.name === "Muted",
        );
        if (!muteRole) {
            return message.channel.send("❌ Le rôle 'Muted' n'existe pas.");
        }

        await member.roles
            .add(muteRole)
            .catch((err) =>
                message.channel.send("❌ Erreur lors de l'ajout du rôle."),
            );
        message.channel.send(`✅ ${member.user.tag} a été muté.`);
    } else if (command === "!info") {
        const embed = new EmbedBuilder()
            .setTitle("Informations sur le serveur")
            .setColor("#0099ff")
            .setDescription(
                `Nom: ${message.guild.name}\nMembres: ${message.guild.memberCount}\nCréé le: ${message.guild.createdAt.toLocaleDateString()}`,
            )
            .setThumbnail(message.guild.iconURL());
        message.channel.send({ embeds: [embed] });
    } else if (command === "!avatar") {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setTitle(`Avatar de ${user.username}`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setColor("#0099ff");
        message.channel.send({ embeds: [embed] });
    } else if (command === "!userinfo") {
        const member = message.mentions.members.first() || message.member;
        const embed = new EmbedBuilder()
            .setTitle(`Information sur ${member.user.username}`)
            .setColor("#0099ff")
            .addFields(
                { name: "Tag", value: member.user.tag },
                { name: "ID", value: member.user.id },
                {
                    name: "A rejoint le",
                    value: member.joinedAt.toLocaleDateString(),
                },
                {
                    name: "Compte créé le",
                    value: member.user.createdAt.toLocaleDateString(),
                },
            )
            .setThumbnail(member.user.displayAvatarURL());
        message.channel.send({ embeds: [embed] });
    } else if (command === "!serverinfo") {
        const embed = new EmbedBuilder()
            .setTitle(`Information sur ${message.guild.name}`)
            .setColor("#0099ff")
            .addFields(
                { name: "Propriétaire", value: `<@${message.guild.ownerId}>` },
                {
                    name: "Membres",
                    value: message.guild.memberCount.toString(),
                },
                {
                    name: "Salons",
                    value: message.guild.channels.cache.size.toString(),
                },
                {
                    name: "Rôles",
                    value: message.guild.roles.cache.size.toString(),
                },
                {
                    name: "Créé le",
                    value: message.guild.createdAt.toLocaleDateString(),
                },
            )
            .setThumbnail(message.guild.iconURL());
        message.channel.send({ embeds: [embed] });
    } else if (command === "!poll") {
        if (args.length < 2) {
            return message.channel.send(
                "❌ Format: !poll [question] [choix1] [choix2] ...",
            );
        }

        const question = args[0];
        const choices = args.slice(1);

        if (choices.length < 2 || choices.length > 10) {
            return message.channel.send(
                "❌ Le sondage doit avoir entre 2 et 10 choix.",
            );
        }

        const reactions = [
            "1️⃣",
            "2️⃣",
            "3️⃣",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟",
        ];

        let description = `**${question}**\n\n`;
        choices.forEach((choice, i) => {
            description += `${reactions[i]} ${choice}\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("📊 Sondage")
            .setDescription(description)
            .setColor("#0099ff");

        const pollMessage = await message.channel.send({ embeds: [embed] });

        for (let i = 0; i < choices.length; i++) {
            await pollMessage.react(reactions[i]);
        }
    } else if (command === "!ticket") {
        const ticketChannel = await message.guild.channels.create({
            name: `ticket-${message.author.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: message.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: message.author.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });

        tickets.set(ticketChannel.id, {
            creator: message.author.id,
            members: [message.author.id],
        });

        message.channel.send(`✅ Ticket créé: ${ticketChannel}`);
    } else if (command === "!close") {
        if (!tickets.has(message.channel.id)) {
            return message.channel.send("❌ Ce n'est pas un ticket!");
        }

        await message.channel.delete();
        tickets.delete(message.channel.id);
    } else if (command === "!add") {
        if (!tickets.has(message.channel.id)) {
            return message.channel.send("❌ Ce n'est pas un ticket!");
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.channel.send("❌ Mentionnez un membre à ajouter!");
        }

        await message.channel.permissionOverwrites.create(member, {
            ViewChannel: true,
        });

        const ticket = tickets.get(message.channel.id);
        ticket.members.push(member.id);
        message.channel.send(`✅ ${member} a été ajouté au ticket.`);
    } else if (command === "!remove") {
        if (!tickets.has(message.channel.id)) {
            return message.channel.send("❌ Ce n'est pas un ticket!");
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.channel.send("❌ Mentionnez un membre à retirer!");
        }

        const ticket = tickets.get(message.channel.id);
        if (member.id === ticket.creator) {
            return message.channel.send(
                "❌ Impossible de retirer le créateur du ticket!",
            );
        }

        await message.channel.permissionOverwrites.delete(member);
        ticket.members = ticket.members.filter((id) => id !== member.id);
        message.channel.send(`✅ ${member} a été retiré du ticket.`);
    } else if (command === "!tickets") {
        const embed = new EmbedBuilder()
            .setTitle("Liste des tickets")
            .setColor("#0099ff")
            .setDescription(
                Array.from(tickets.entries())
                    .map(
                        ([channelId, ticket]) =>
                            `<#${channelId}> - Créé par <@${ticket.creator}>`,
                    )
                    .join("\n") || "Aucun ticket actif",
            );

        message.channel.send({ embeds: [embed] });
    } else if (command === "!backup") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        if (args[0] === "create") {
            const backupId = Date.now().toString();
            const backup = {
                channels: message.guild.channels.cache.map((channel) => ({
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                })),
                roles: message.guild.roles.cache.map((role) => ({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions.bitfield,
                })),
            };

            backups.set(backupId, backup);
            message.channel.send(`✅ Sauvegarde créée avec l'ID: ${backupId}`);
        } else if (args[0] === "load") {
            const backupId = args[1];
            const backup = backups.get(backupId);

            if (!backup) {
                return message.channel.send("❌ Sauvegarde non trouvée.");
            }

            message.channel.send("🔄 Chargement de la sauvegarde en cours...");
        }
    } else if (command === "!stats") {
        const embed = new EmbedBuilder()
            .setTitle("📊 Statistiques du Serveur")
            .setColor("#0099ff")
            .addFields(
                {
                    name: "👥 Membres Total",
                    value: message.guild.memberCount.toString(),
                },
                {
                    name: "🤖 Bots",
                    value: message.guild.members.cache
                        .filter((m) => m.user.bot)
                        .size.toString(),
                },
                {
                    name: "💬 Salons",
                    value: message.guild.channels.cache.size.toString(),
                },
                {
                    name: "🏷️ Rôles",
                    value: message.guild.roles.cache.size.toString(),
                },
                {
                    name: "📅 Âge du Serveur",
                    value: `${Math.floor((Date.now() - message.guild.createdTimestamp) / (1000 * 60 * 60 * 24))} jours`,
                },
            )
            .setThumbnail(message.guild.iconURL());

        message.channel.send({ embeds: [embed] });
    } else if (command === "!roleinfo") {
        const role = message.mentions.roles.first();
        if (!role) return message.channel.send("❌ Mentionnez un rôle!");

        const embed = new EmbedBuilder()
            .setTitle(`🏷️ Information sur ${role.name}`)
            .setColor(role.color)
            .addFields(
                { name: "ID", value: role.id },
                { name: "Couleur", value: role.hexColor },
                { name: "Position", value: role.position.toString() },
                {
                    name: "Mentionnable",
                    value: role.mentionable ? "Oui" : "Non",
                },
                { name: "Membres", value: role.members.size.toString() },
                { name: "Créé le", value: role.createdAt.toLocaleDateString() },
            );

        message.channel.send({ embeds: [embed] });
    } else if (command === "!setlog") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.channel.send(
                "❌ Veuillez mentionner un canal pour les logs!",
            );
        }

        if (!logSettings.has(message.guild.id)) {
            logSettings.set(message.guild.id, {
                channel: channel.id,
                join: false,
                leave: false,
                ban: false,
                messages: false,
            });
        } else {
            const settings = logSettings.get(message.guild.id);
            settings.channel = channel.id;
        }

        message.channel.send(`✅ Canal de logs défini sur ${channel}`);
    } else if (command === "!log") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        if (!logSettings.has(message.guild.id)) {
            return message.channel.send(
                "❌ Veuillez d'abord définir un canal de logs avec !setlog",
            );
        }

        const settings = logSettings.get(message.guild.id);
        const type = args[0]?.toLowerCase();

        switch (type) {
            case "join":
                settings.join = !settings.join;
                message.channel.send(
                    `✅ Logs de connexion ${settings.join ? "activés" : "désactivés"}`,
                );
                break;
            case "leave":
                settings.leave = !settings.leave;
                message.channel.send(
                    `✅ Logs de déconnexion ${settings.leave ? "activés" : "désactivés"}`,
                );
                break;
            case "ban":
                settings.ban = !settings.ban;
                message.channel.send(
                    `✅ Logs de bannissement ${settings.ban ? "activés" : "désactivés"}`,
                );
                break;
            case "messages":
                settings.messages = !settings.messages;
                message.channel.send(
                    `✅ Logs de messages ${settings.messages ? "activés" : "désactivés"}`,
                );
                break;
            default:
                message.channel.send(
                    "❌ Type de log invalide. Utilisez: join, leave, ban, ou messages",
                );
        }
    } else if (command === "!connect4") {
        const opponent = message.mentions.users.first();
        if (!opponent)
            return message.channel.send(
                "❌ Mentionnez un adversaire pour jouer!",
            );
        if (opponent.bot)
            return message.channel.send(
                "❌ Vous ne pouvez pas jouer contre un bot!",
            );
        if (opponent.id === message.author.id)
            return message.channel.send(
                "❌ Vous ne pouvez pas jouer contre vous-même!",
            );

        message.channel.send(
            `🎮 Nouvelle partie de Puissance 4 entre ${message.author} et ${opponent}!`,
        );
    } else if (command === "!hangman") {
        if (activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous avez déjà une partie en cours!",
            );
        }

        message.channel.send("🎯 Nouvelle partie de pendu! Devinez le mot...");
    } else if (command === "!chess") {
        const opponent = message.mentions.users.first();
        if (!opponent)
            return message.channel.send(
                "❌ Mentionnez un adversaire pour jouer!",
            );
        if (opponent.bot)
            return message.channel.send(
                "❌ Vous ne pouvez pas jouer contre un bot!",
            );
        if (opponent.id === message.author.id)
            return message.channel.send(
                "❌ Vous ne pouvez pas jouer contre vous-même!",
            );

        message.channel.send(
            `♟️ Nouvelle partie d'échecs entre ${message.author} et ${opponent}!`,
        );
    } else if (command === "!tcmds") {
        return message.channel.send(
            "Voici les commandes de troll disponibles :\n" +
                "`!ghostping [@membre]` - Ghost ping un membre 👻\n" +
                "`!fakeban [@membre]` - Fait semblant de bannir un membre 🔨\n" +
                "`!rickroll [@membre]` - Envoie un rickroll en MP 🎵 \n" +
                "`!echo [@membre]` - echo 🎵",
        );
    } else if (command === "!ghostping") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send(
                "❌ Mentionnez un membre à ghost ping.",
            );

        message.channel.send(`${member}`).then((msg) => {
            msg.delete();
        });
        message.delete();
    } else if (command === "!fakeban") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à fake ban.");

        message.channel
            .send(`🔨 **${member.user.tag}** a été banni du serveur.`)
            .then(() => {
                setTimeout(() => {
                    message.channel.send(
                        "😅 C'était une blague! Personne n'a été banni.",
                    );
                }, 3000);
            });
        message.delete();
    } else if (command === "!rickroll") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à rickroll.");

        member
            .send(
                "🎵 Hey! Regarde cette super vidéo: [https://www.youtube.com/watch?v=wgKlFNGU174](<https:⫽www.youtube.com/watch?v=dQw4w9WgXcQ>)",
            )
            .then(() => {
                message.channel.send("😈 Rickroll envoyé avec succès!");
            })
            .catch(() => {
                message.channel.send(
                    "❌ Je ne peux pas envoyer de messages privés à ce membre.",
                );
            });
        message.delete();
    } else if (command === "!echo") {
        const channel = message.mentions.channels.first();
        if (!channel)
            return message.channel.send("❌ Mentionnez un canal pour l'echo.");

        const text = args.slice(1).join(" ");
        if (!text)
            return message.channel.send("❌ Écrivez un message à envoyer.");

        channel.send(text);
        message.delete();
    } else if (command === "!guessnumber") {
        if (!args[0]) {
            const number = Math.floor(Math.random() * 100) + 1;
            console.log(`Le nombre choisi est: ${number}`);
            activeGames.set(message.author.id, {
                type: "guessnumber",
                number: number,
                tries: 0,
            });
            return message.channel.send(
                "🎮 J'ai généré un nombre entre 1 et 100. Utilisez à nouveau !guessnumber [nombre] pour deviner!",
            );
        }

        if (!activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous n'avez pas de partie en cours. Utilisez !guessnumber sans argument pour commencer!",
            );
        }

        const guess = parseInt(args[0]);
        if (!guess)
            return message.channel.send("❌ Veuillez entrer un nombre valide!");

        const game = activeGames.get(message.author.id);
        game.tries++;

        if (guess === game.number) {
            message.channel.send(
                `🎉 Bravo! Vous avez trouvé le nombre ${game.number} en ${game.tries} essais!`,
            );
            activeGames.delete(message.author.id);
        } else if (guess < game.number) {
            message.channel.send("⬆️ C'est plus haut!");
        } else {
            message.channel.send("⬇️ C'est plus bas!");
        }
    } else if (command === "!lockall") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.guild.channels.cache.forEach((channel) => {
            channel.permissionOverwrites
                .edit(message.guild.roles.everyone, {
                    SendMessages: false,
                })
                .catch(() => {});
        });
        message.channel.send("🔒 Tous les salons ont été verrouillés.");
    } else if (command === "!unlockall") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.guild.channels.cache.forEach((channel) => {
            channel.permissionOverwrites
                .edit(message.guild.roles.everyone, {
                    SendMessages: true,
                })
                .catch(() => {});
        });
        message.channel.send("🔓 Tous les salons ont été déverrouillés.");
    } else if (command === "!lock") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                SendMessages: false,
            },
        );
        message.channel.send("🔒 Ce salon a été verrouillé.");
    } else if (command === "!unlock") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                SendMessages: true,
            },
        );
        message.channel.send("🔓 Ce salon a été déverrouillé.");
    } else if (command === "!nuke") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.channel.send("💥 Nuking the server...");
    } else if (command === "!clone") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.channel.send(
                "❌ Veuillez mentionner un canal à cloner!",
            );
        }

        const newChannel = await channel.clone();
        await newChannel.setParent(channel.parent);
        await newChannel.setPosition(channel.position);
        message.channel.send(`✅ Canal cloné avec succès: ${newChannel}`);
    } else if (command === "!roleall") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageRoles,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const role = message.mentions.roles.first();
        if (!role)
            return message.channel.send(
                "❌ Mentionnez un rôle à donner à tous les membres!",
            );

        message.guild.members.cache.forEach((member) => {
            member.roles.add(role).catch(() => {});
        });
        message.channel.send(`✅ Rôle ${role} a été donné à tous les membres.`);
    } else if (command === "!deroleall") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageRoles,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const role = message.mentions.roles.first();
        if (!role)
            return message.channel.send(
                "❌ Mentionnez un rôle à retirer de tous les membres!",
            );

        message.guild.members.cache.forEach((member) => {
            member.roles.remove(role).catch(() => {});
        });
        message.channel.send(
            `✅ Rôle ${role} a été retiré de tous les membres.`,
        );
    } else if (command === "!poll") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageMessages,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const question = args.join(" ");
        if (!question)
            return message.channel.send(
                "❌ Veuillez fournir une question pour le sondage!",
            );

        const embed = new EmbedBuilder()
            .setTitle("🎲 Sondage")
            .setDescription(question)
            .setColor("#0099ff");

        const pollMessage = await message.channel.send({ embeds: [embed] });
        await pollMessage.react("👍");
        await pollMessage.react("👎");
        await pollMessage.react("🤷‍♂️");

        message.channel.send("🎲 Sondage créé avec succès!");
    } else if (command === "!ticket") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const ticketChannel = message.guild.channels.cache.find(
            (ch) => ch.name === "tickets",
        );
        if (!ticketChannel) {
            return message.channel.send(
                "❌ Aucun canal de tickets trouvé. Créez un canal nommé 'tickets' d'abord.",
            );
        }

        const newTicketChannel = await ticketChannel.clone();
        await newTicketChannel.setParent(ticketChannel.parent);
        await newTicketChannel.setPosition(ticketChannel.position);
        await newTicketChannel.setName(`ticket-${message.author.username}`);

        const embed = new EmbedBuilder()
            .setTitle("🎫 Nouveau Ticket")
            .setDescription(
                `Un nouveau ticket a été créé par ${message.author}.`,
            )
            .setColor("#0099ff");

        await newTicketChannel.send({ embeds: [embed] });
        message.channel.send(
            `✅ Nouveau ticket créé avec succès: ${newTicketChannel}`,
        );
    } else if (command === "!close") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const ticketChannel = message.guild.channels.cache.find((ch) =>
            ch.name.startsWith("ticket-"),
        );
        if (!ticketChannel) {
            return message.channel.send("❌ Aucun ticket trouvé.");
        }

        await ticketChannel.delete();
        message.channel.send("🔒 Ticket fermé avec succès.");
    } else if (command === "!add") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const ticketChannel = message.guild.channels.cache.find((ch) =>
            ch.name.startsWith("ticket-"),
        );
        if (!ticketChannel) {
            return message.channel.send("❌ Aucun ticket trouvé.");
        }

        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send(
                "❌ Mentionnez un membre à ajouter au ticket!",
            );

        await ticketChannel.send(`✅ ${member} a été ajouté au ticket.`);
        message.channel.send(`✅ ${member} a été ajouté au ticket.`);
    } else if (command === "!remove") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const ticketChannel = message.guild.channels.cache.find((ch) =>
            ch.name.startsWith("ticket-"),
        );
        if (!ticketChannel) {
            return message.channel.send("❌ Aucun ticket trouvé.");
        }

        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send(
                "❌ Mentionnez un membre à retirer du ticket!",
            );

        await ticketChannel.send(`✅ ${member} a été retiré du ticket.`);
        message.channel.send(`✅ ${member} a été retiré du ticket.`);
    } else if (command === "!tickets") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const ticketChannel = message.guild.channels.cache.find((ch) =>
            ch.name.startsWith("ticket-"),
        );
        if (!ticketChannel) {
            return message.channel.send("❌ Aucun ticket trouvé.");
        }

        const ticketsList = message.guild.channels.cache.filter((ch) =>
            ch.name.startsWith("ticket-"),
        );
        const ticketListEmbed = new EmbedBuilder()
            .setTitle("🎫 Liste des tickets")
            .setDescription(ticketsList.map((ch) => ch.name).join("\n"))
            .setColor("#0099ff");

        message.channel.send({ embeds: [ticketListEmbed] });
    } else if (command === "!backup") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const backupChannel = message.guild.channels.cache.find(
            (ch) => ch.name === "backups",
        );
        if (!backupChannel) {
            return message.channel.send(
                "❌ Aucun canal de backups trouvé. Créez un canal nommé 'backups' d'abord.",
            );
        }

        if (args[0] === "create") {
            const backup = {
                channels: [],
                roles: [],
            };

            message.guild.channels.cache.forEach((channel) => {
                backup.channels.push({
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                });
            });

            message.guild.roles.cache.forEach((role) => {
                backup.roles.push({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions.bitfield,
                });
            });

            const backupId = Date.now().toString();
            backups.set(backupId, backup);

            message.channel.send(`✅ Backup créée avec l'ID: ${backupId}`);
        } else if (args[0] === "load") {
            const backupId = args[1];
            const backup = backups.get(backupId);

            if (!backup) {
                return message.channel.send("❌ Backup non trouvée.");
            }

            message.guild.channels.cache.forEach((channel) => {
                if (channel.deletable) channel.delete();
            });

            message.guild.roles.cache.forEach((role) => {
                if (role.deletable) role.delete();
            });

            backup.channels.forEach((channelData) => {
                message.guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    position: channelData.position,
                });
            });

            backup.roles.forEach((roleData) => {
                message.guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    permissions: roleData.permissions,
                });
            });

            message.channel.send("✅ Backup restaurée avec succès!");
        } else {
            message.channel.send(
                "❌ Utilisez !backup create ou !backup load [id]",
            );
        }
    } else if (command === "!stats") {
        const embed = new EmbedBuilder()
            .setTitle(`📊 Statistiques de ${message.guild.name}`)
            .setColor("#0099ff")
            .addFields(
                {
                    name: "Membres totaux",
                    value: message.guild.memberCount.toString(),
                },
                {
                    name: "Humains",
                    value: message.guild.members.cache
                        .filter((m) => !m.user.bot)
                        .size.toString(),
                },
                {
                    name: "Bots",
                    value: message.guild.members.cache
                        .filter((m) => m.user.bot)
                        .size.toString(),
                },
                {
                    name: "Salons textuels",
                    value: message.guild.channels.cache
                        .filter((c) => c.type === ChannelType.GuildText)
                        .size.toString(),
                },
                {
                    name: "Salons vocaux",
                    value: message.guild.channels.cache
                        .filter((c) => c.type === ChannelType.GuildVoice)
                        .size.toString(),
                },
                {
                    name: "Rôles",
                    value: message.guild.roles.cache.size.toString(),
                },
                {
                    name: "Émojis",
                    value: message.guild.emojis.cache.size.toString(),
                },
            )
            .setThumbnail(message.guild.iconURL());
        message.channel.send({ embeds: [embed] });
    } else if (command === "!roleinfo") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageRoles,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const role = message.mentions.roles.first();
        if (!role) {
            return message.channel.send("❌ Veuillez mentionner un rôle.");
        }

        const embed = new EmbedBuilder()
            .setTitle(`Information sur le rôle ${role.name}`)
            .setColor(role.color)
            .addFields(
                { name: "ID", value: role.id },
                { name: "Couleur", value: role.hexColor },
                { name: "Position", value: role.position.toString() },
                {
                    name: "Mentionnable",
                    value: role.mentionable ? "Oui" : "Non",
                },
                {
                    name: "Affiché séparément",
                    value: role.hoist ? "Oui" : "Non",
                },
                { name: "Membres", value: role.members.size.toString() },
            );
        message.channel.send({ embeds: [embed] });
    } else if (command === "!setlog") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.channel.send("❌ Veuillez mentionner un salon.");
        }

        logSettings.set(message.guild.id, { channel: channel.id });
        message.channel.send(`✅ Salon de logs défini sur ${channel}`);
    } else if (command === "!log") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        const type = args[0];
        if (!type || !["join", "leave", "ban", "messages"].includes(type)) {
            return message.channel.send(
                "❌ Type invalide. Utilisez: join, leave, ban, ou messages",
            );
        }

        const settings = logSettings.get(message.guild.id) || {};
        settings[type] = true;
        logSettings.set(message.guild.id, settings);

        message.channel.send(`✅ Logs de type "${type}" activés.`);
    } else if (command === "!connect4") {
        const opponent = message.mentions.users.first();
        if (!opponent) {
            return message.channel.send(
                "❌ Veuillez mentionner un adversaire.",
            );
        }

        if (activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous avez déjà une partie en cours.",
            );
        }

        activeGames.set(message.author.id, {
            type: "connect4",
            opponent: opponent.id,
            board: Array(6)
                .fill()
                .map(() => Array(7).fill(null)),
            currentPlayer: message.author.id,
        });

        message.channel.send(
            `🎮 Partie de Puissance 4 démarrée entre ${message.author} et ${opponent}!`,
        );
    } else if (command === "!hangman") {
        if (activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous avez déjà une partie en cours.",
            );
        }

        const words = [
            "DISCORD",
            "JAVASCRIPT",
            "PROGRAMMATION",
            "DEVELOPPEUR",
            "SERVEUR",
        ];
        const word = words[Math.floor(Math.random() * words.length)];

        activeGames.set(message.author.id, {
            type: "hangman",
            word: word,
            guessed: new Set(),
            tries: 6,
        });

        message.channel.send(
            "🎮 Partie de pendu démarrée! Utilisez `!guess [lettre]` pour deviner.",
        );
    } else if (command === "!chess") {
        const opponent = message.mentions.users.first();
        if (!opponent) {
            return message.channel.send(
                "❌ Veuillez mentionner un adversaire.",
            );
        }

        if (activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous avez déjà une partie en cours.",
            );
        }

        activeGames.set(message.author.id, {
            type: "chess",
            opponent: opponent.id,
            board: initializeChessBoard(),
            currentPlayer: message.author.id,
        });

        message.channel.send(
            `♟️ Partie d'échecs démarrée entre ${message.author} et ${opponent}!`,
        );
    } else if (command === "!trivia") {
        if (activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous avez déjà une partie en cours!",
            );
        }

        if (args.length < 2) {
            return message.channel.send(
                "❌ Utilisation: !trivia [question] | [réponse]\nExemple: !trivia Quelle est la capitale de la France? | paris",
            );
        }

        const input = args.join(" ").split("|");
        if (input.length !== 2) {
            return message.channel.send(
                "❌ Format invalide. Utilisez | pour séparer la question et la réponse.",
            );
        }

        const question = input[0].trim();
        const answer = input[1].trim().toLowerCase();

        activeGames.set(message.author.id, {
            type: "trivia",
            question: question,
            answer: answer,
            tries: 3,
        });

        message.channel.send(
            `❓ **Question:** ${question}\nVous avez 3 essais! Utilisez \`!answer [votre réponse]\` pour répondre.`,
        );
    } else if (command === "!tcmds") {
        return message.channel.send(
            "Voici les commandes de troll disponibles :\n" +
                "`!ghostping [@membre]` - Ghost ping un membre 👻\n" +
                "`!fakeban [@membre]` - Fait semblant de bannir un membre 🔨\n" +
                "`!rickroll [@membre]` - Envoie un rickroll en MP 🎵 \n" +
                "`!echo [@membre]` - echo 🎵",
        );
    } else if (command === "!ghostping") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send(
                "❌ Mentionnez un membre à ghost ping.",
            );

        message.channel.send(`${member}`).then((msg) => {
            msg.delete();
        });
        message.delete();
    } else if (command === "!fakeban") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à fake ban.");

        message.channel
            .send(`🔨 **${member.user.tag}** a été banni du serveur.`)
            .then(() => {});
        message.delete();
    } else if (command === "!rickroll") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre à rickroll.");

        member
            .send(
                "🎶 Hey! Regarde cette super vidéo: [https:⫽www.youtube.com/watch?v=wgKlFNGU174](<https://www.youtube.com/watch?v=dQw4w9WgXcQ>)",
            )
            .then(() => {
                message.channel.send("😈 Rickroll envoyé avec succès!");
            })
            .catch(() => {
                message.channel.send(
                    "❌ Je ne peux pas envoyer de messages privés à ce membre.",
                );
            });
        message.delete();
    } else if (command === "!echo") {
        const member = message.mentions.members.first();
        if (!member)
            return message.channel.send("❌ Mentionnez un membre pour l'echo.");

        const text = args.slice(1).join(" ");
        if (!text)
            return message.channel.send("❌ Écrivez un message à envoyer.");

        message.channel
            .createWebhook({
                name: member.displayName,
                avatar: member.user.displayAvatarURL(),
            })
            .then((webhook) => {
                webhook.send(text).then(() => {
                    webhook.delete();
                });
            })
            .catch((error) => {
                message.channel.send("❌ Je n'ai pas pu créer le webhook.");
            });

        message.delete();
    } else if (command === "!guessnumber") {
        if (activeGames.has(message.author.id)) {
            return message.channel.send(
                "❌ Vous avez déjà une partie en cours.",
            );
        }

        const number = Math.floor(Math.random() * 100) + 1;
        activeGames.set(message.author.id, {
            type: "guessnumber",
            number: number,
            tries: 0,
        });

        message.channel.send(
            "🎮 J'ai choisi un nombre entre 1 et 100. À vous de deviner!",
        );
    } else if (command === "!lockall") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.guild.channels.cache.forEach((channel) => {
            channel.permissionOverwrites
                .edit(message.guild.roles.everyone, {
                    SendMessages: false,
                })
                .catch(console.error);
        });

        message.channel.send("🔒 Tous les salons ont été verrouillés.");
    } else if (command === "!unlockall") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageChannels,
            )
        ) {
            return message.channel.send(
                "❌ Vous n'avez pas la permission d'utiliser cette commande.",
            );
        }

        message.guild.channels.cache.forEach((channel) => {
            channel.permissionOverwrites
                .edit(message.guild.roles.everyone, {
                    SendMessages: null,
                })
                .catch(console.error);
        });

        message.channel.send("🔓 Tous les salons ont été déverrouillés.");
    } else if (command === "!gstart") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send("❌ Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const duration = args[0];
        const winners = parseInt(args[1]);
        const prize = args.slice(2).join(" ");

        if (!duration || !winners || !prize) {
            return message.channel.send("❌ Format: !gstart [durée] [gagnants] [prix]\nExemple: !gstart 1h 1 Nitro Classic");
        }

        const ms = require('ms');
        const durationMs = ms(duration);
        if (!durationMs) {
            return message.channel.send("❌ Durée invalide. Exemple: 1h, 1d, 1w");
        }

        const embed = new EmbedBuilder()
            .setTitle("🎉 GIVEAWAY")
            .setDescription(`**Prix:** ${prize}\n**Gagnants:** ${winners}\n**Fin:** <t:${Math.floor((Date.now() + durationMs) / 1000)}:R>\n\nRéagissez avec 🎉 pour participer!`)
            .setColor("#FF0000")
            .setTimestamp(Date.now() + durationMs);

        message.channel.send({ embeds: [embed] }).then(msg => {
            msg.react("🎉");
            giveaways.set(msg.id, {
                prize: prize,
                winners: winners,
                endAt: Date.now() + durationMs,
                channelId: message.channel.id,
                messageId: msg.id,
                hostId: message.author.id
            });

            setTimeout(() => endGiveaway(msg.id), durationMs);
        });
    } else if (command === "!gend") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send("❌ Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const messageId = args[0];
        if (!messageId) {
            return message.channel.send("❌ Spécifiez l'ID du message du giveaway!");
        }

        endGiveaway(messageId);
    } else if (command === "!greroll") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send("❌ Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const messageId = args[0];
        if (!messageId) {
            return message.channel.send("❌ Spécifiez l'ID du message du giveaway!");
        }

        rerollGiveaway(messageId);
    }
});

async function endGiveaway(messageId) {
    const giveaway = giveaways.get(messageId);
    if (!giveaway) return;

    const channel = client.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return;

    const reaction = message.reactions.cache.get("🎉");
    if (!reaction) return;

    const users = await reaction.users.fetch();
    const validUsers = users.filter(user => !user.bot);

    if (validUsers.size === 0) {
        channel.send("❌ Pas assez de participants pour le giveaway!");
        return;
    }

    const winners = [];
    for (let i = 0; i < giveaway.winners; i++) {
        const winner = validUsers.random();
        if (winner) {
            winners.push(winner);
            validUsers.delete(winner.id);
        }
    }

    const winnersText = winners.map(w => `<@${w.id}>`).join(", ");
    channel.send(`🎉 Félicitations ${winnersText}! Vous avez gagné **${giveaway.prize}**!`);

    const embed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY TERMINÉ")
        .setDescription(`**Prix:** ${giveaway.prize}\n**Gagnants:** ${winnersText}\n**Terminé:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        .setColor("#00FF00")
        .setTimestamp();

    message.edit({ embeds: [embed] });
    giveaways.delete(messageId);
}

async function rerollGiveaway(messageId) {
    const giveaway = giveaways.get(messageId);
    if (!giveaway) return;

    const channel = client.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return;

    const reaction = message.reactions.cache.get("🎉");
    if (!reaction) return;

    const users = await reaction.users.fetch();
    const validUsers = users.filter(user => !user.bot);

    if (validUsers.size === 0) {
        channel.send("❌ Pas assez de participants pour le reroll!");
        return;
    }

    const winner = validUsers.random();
    channel.send(`🎉 Nouveau gagnant: <@${winner.id}>! Félicitations, vous avez gagné **${giveaway.prize}**!`);
}

client.login(token).catch((error) => {
    console.error("❌ Erreur de connexion:", error);
    process.exit(1);
});
