import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";


//
// ———————————————————————————————————————————
//  CONFIG
// ———————————————————————————————————————————
//
const APP_BASE_URL = process.env.APP_URL ?? "http://localhost:5173";

const TOTAL_USERS = 40; 
const DAYS_SPREAD = 5;
const REPLY_CHANCE = 0.5; // 20% des messages sont des réponses

//
// ———————————————————————————————————————————
//  RANDOM UTILS
// ———————————————————————————————————————————
//

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithin(days: number) {
  const now = Date.now();
  const offset = randomInt(0, days * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

function randomAvatar(username: string) {
  const styles = [
    "avataaars",
    "bottts",
    "fun-emoji",
    "adventurer",
    "lorelei",
    "pixel-art",
    "micah",
    "shapes"
  ];
  const style = randomItem(styles);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(
    username
  )}`;
}

//
// ———————————————————————————————————————————
//  MESSAGE POOL
// ———————————————————————————————————————————
//
const messagePool = [
  "Salut tout le monde 👋",
  "Ça fonctionne tellement bien !",
  "Qui est chaud pour un vocal ? 🎧",
  "Je teste le scroll infini… encore.",
  "Ce projet va être incroyable 🔥",
  "Les messages s'enchaînent vite ici 😅",
  "On dirait un vrai Discord maison.",
  "Des idées pour améliorer l’UI ?",
  "Le backend tourne mieux que prévu.",
  "Voilà un message complètement random.",
  "Essayons un message un peu plus long pour voir comment ça wrap dans l’UI. Je veux être sûr que tout reste lisible même quand un membre écrit un texte plus conséquent.",
  "Voici un autre message, mais cette fois avec quelques emojis 🤖✨🧪",
  "Je réponds juste pour tester la feature de reply 👌",
  "C’est vraiment fluide.",
  "On avance bien !",
];

//
// ———————————————————————————————————————————
//  USER BIOS
// ———————————————————————————————————————————
//
const bios = [
  "🔧 Dev en herbe",
  "🎮 Gamer passionné",
  "🌙 Productif la nuit",
  "☕ Addict au café",
  "✨ Pixel lover",
  "📚 Toujours en train d'apprendre",
  "💡 Idées partout",
  "🤖 Bots > Humains",
  "🔥 Toujours chaud pour coder",
];

//
// ———————————————————————————————————————————
//  CHANNEL CONFIG
// ———————————————————————————————————————————
//
const CHANNEL_DESCRIPTIONS = [
  { name: "général", count: 300 },
  { name: "blabla", count: 200 },
  { name: "gaming", count: 150 },
  { name: "dev", count: 150 },
  { name: "entraide", count: 80 },
  { name: "médis", count: 80 },
  { name: "annonces", count: 20 },
  { name: "règles", count: 10 },
  { name: "memes", count: 50 },
  { name: "screenshots", count: 40 },
];

//
// ———————————————————————————————————————————
//  MAIN SEED
// ———————————————————————————————————————————
//

async function main() {
  console.log("🚀 SEED MASSIF — démarrage…");

  //
  // ——— BOT
  //
  const botEmail = "bot@velmu.ai";
  let botUser = await prisma.user.findUnique({ where: { email: botEmail } });

  if (!botUser) {
    botUser = await prisma.user.create({
      data: {
        email: botEmail,
        username: "VelmuBot",
        discriminator: "0000",
        passwordHash: await bcrypt.hash("botpasswordsecure", 10),
        avatarUrl: randomAvatar("VelmuBot"),
        bio: "🤖 Je suis l'IA officielle de ce serveur.",
      },
    });
  }

  //
  // ——— USERS
  //
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [botUser];
  for (let i = 0; i < TOTAL_USERS; i++) {
    const username = `user${i}_${Math.random().toString(36).slice(2, 7)}`;
    const email = `${username}@test.com`;

    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        username,
        discriminator: randomInt(1000, 9999).toString(),
        passwordHash,
        avatarUrl: randomAvatar(username),
        bio: randomItem(bios),
      },
    });

    users.push(u);
  }

  console.log(`👥 Utilisateurs générés : ${users.length}`);

  //
  // ——— SERVER UNIQUE
  //
  const server = await prisma.server.create({
    data: {
      name: "Velmu Officiel",
      ownerId: botUser.id,
      categories: {
        create: [
          {
            name: "Bienvenue",
            order: 0,
            channels: {
              create: [
                { name: "général", type: "text" },
                { name: "annonces", type: "text" },
                { name: "règles", type: "text" },
              ],
            },
          },
          {
            name: "Discussions",
            order: 1,
            channels: {
              create: [
                { name: "blabla", type: "text" },
                { name: "gaming", type: "text" },
                { name: "dev", type: "text" },
                { name: "entraide", type: "text" },
              ],
            },
          },
          {
            name: "Média",
            order: 2,
            channels: {
              create: [
                { name: "memes", type: "text" },
                { name: "screenshots", type: "text" },
              ],
            },
          },
        ],
      },
      members: {
        create: users.map((u) => ({
          userId: u.id,
          role: u.id === botUser.id ? "OWNER" : "MEMBER",
        })),
      },
      invites: {
        create: {
          code: "VELMU-SEED-" + randomInt(1000, 9999),
          creatorId: botUser.id,
        },
      },
    },
    include: {
      categories: { include: { channels: true } },
      invites: true,
    },
  });

  //
  // ——— MESSAGES
  //
  console.log("✉️  Génération des messages…");

  for (const ch of server.categories.flatMap((c) => c.channels)) {
    if (ch.type !== "text") continue;

    const channelConfig = CHANNEL_DESCRIPTIONS.find((x) => x.name === ch.name);
    const count = channelConfig?.count ?? 50;

    const allMessages = [];

    // 1) Créer les messages de base
    for (let i = 0; i < count; i++) {
      const author = randomItem(users);
      const createdAt = randomDateWithin(DAYS_SPREAD);

      const msg = await prisma.message.create({
        data: {
          content: randomItem(messagePool),
          userId: author.id,
          channelId: ch.id,
          createdAt,
        },
      });

      allMessages.push(msg);
    }

    // 2) Ajouter des replies (20%)
    const repliesTargetPool = [...allMessages];

    for (let i = 0; i < Math.floor(count * REPLY_CHANCE); i++) {
      const author = randomItem(users);
      const original = randomItem(repliesTargetPool);
      const createdAt = randomDateWithin(DAYS_SPREAD);

      const reply = await prisma.message.create({
        data: {
          content: randomItem(messagePool),
          userId: author.id,
          channelId: ch.id,
          replyToId: original.id,
          createdAt,
        },
      });

      allMessages.push(reply);
    }

    console.log(`💬 Salon #${ch.name} → ${allMessages.length} messages`);
  }

  const inviteUrl = `${APP_BASE_URL}/invite/${server.invites[0].code}`;
  console.log("🎉 Seed terminé !");
  console.log("🔗 Invite :", inviteUrl);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
