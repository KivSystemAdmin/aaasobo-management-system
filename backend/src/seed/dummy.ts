import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
});
export const prisma = new PrismaClient({ adapter });

type SyntheticCustomerSeed = {
  name: string;
  email: string;
  prefecture: string;
  hasSeenWelcome: boolean;
  createdAt: Date;
  updatedAt: Date;
  terminationAt: Date | null;
  childNames: [string, string];
};

const syntheticCustomerSeeds: SyntheticCustomerSeed[] = Array.from(
  { length: 30 },
  (_, index) => {
    const customerNames = [
      "Asami Takeda",
      "Kazuya Oshima",
      "Natsuki Morita",
      "Ryohei Shibata",
      "Emi Kurihara",
      "Takumi Nishio",
      "Aya Hoshino",
      "Daigo Matsuda",
      "Miyu Fujisaki",
      "Koki Arai",
      "Sayaka Arakawa",
      "Tatsuya Imai",
      "Rena Kawaguchi",
      "Yoshiki Kitamura",
      "Hina Kuroda",
      "Soma Nagasawa",
      "Yurika Ogata",
      "Keisuke Sakurai",
      "Maho Sugawara",
      "Naoto Tomita",
      "Ami Uematsu",
      "Shin Watanabe",
      "Yuka Yamamoto",
      "Reo Yoshida",
      "Kanna Aoyama",
      "Hikaru Endo",
      "Misato Goto",
      "Riku Honda",
      "Yui Ishii",
      "Takeru Jinno",
    ];
    const childNamesPool = [
      "Arisa",
      "Sorato",
      "Miori",
      "Keito",
      "Nanaka",
      "Rento",
      "Sakina",
      "Ryusei",
      "Akari",
      "Haruma",
      "Yuina",
      "Kosei",
      "Minori",
      "Renji",
      "Aona",
      "Kaito",
      "Rinka",
      "Taiga",
      "Ayane",
      "Yuto",
      "Nene",
      "Sotaro",
      "Koharu",
      "Rikuto",
      "Meika",
      "Itsuki",
      "Hinano",
      "Reona",
      "Suzuka",
      "Naoto",
      "Rio",
      "Shunta",
      "Airi",
      "Towa",
      "Yuika",
      "Kentaro",
      "Hana",
      "Ryoma",
      "Mao",
      "Sena",
      "Riko",
      "Haru",
      "Miu",
      "Yuma",
      "Noa",
      "Koki",
      "Yuzuki",
      "Taichi",
      "Mina",
      "Ren",
      "Karin",
      "Sho",
      "Sara",
      "Yusei",
      "Niko",
      "Rui",
      "Rina",
      "Yudai",
      "Asuka",
      "Hinata",
    ];
    const prefectures = [
      "東京都 / Tokyo",
      "神奈川県 / Kanagawa",
      "大阪府 / Osaka",
      "愛知県 / Aichi",
      "福岡県 / Fukuoka",
      "北海道 / Hokkaido",
    ];

    const name = customerNames[index];
    const createdAt = new Date(
      Date.UTC(2024, 6 + (index % 18), 3 + (index % 17)),
    );
    const updatedAt = new Date(
      Date.UTC(
        createdAt.getUTCFullYear(),
        createdAt.getUTCMonth(),
        createdAt.getUTCDate() + 4 + (index % 5),
      ),
    );
    const graduationOffsetMonths = 2 + (index % 6);
    const terminationAt =
      index % 4 === 0
        ? new Date(
            Date.UTC(
              createdAt.getUTCFullYear(),
              createdAt.getUTCMonth() + graduationOffsetMonths,
              25,
            ),
          )
        : null;

    return {
      name,
      email: `sample-family-${String(index + 1).padStart(2, "0")}@example.com`,
      prefecture: prefectures[index % prefectures.length],
      hasSeenWelcome: index % 2 === 0,
      createdAt,
      updatedAt,
      terminationAt,
      childNames: [childNamesPool[index * 2], childNamesPool[index * 2 + 1]],
    };
  },
);

async function insertInstructors() {
  await prisma.instructor.createMany({
    data: [
      {
        // email: "helen@example.com",
        email: "kiv-developers@googlegroups.com",
        name: "Helene Gay Santos",
        nickname: "Helen",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "https://t6bgu8umfoykvmu2.public.blob.vercel-storage.com/helen-1-EiNuW9NSTik1NDhEo5hHy7SUJkrtmX.jpg",
        classURL: "https://zoom.us/j/123451?pwd=ABCde",
        meetingId: "123 456 7890",
        passcode: "helen",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu", // AaasoBo!Helen
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "elian@example.com",
        name: "Elian P.Quilisadio",
        nickname: "Elian",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "https://t6bgu8umfoykvmu2.public.blob.vercel-storage.com/elian-1-69ThGTdsTK2vhDetFBJgWy83aEM49U.jpg",
        classURL: "https://zoom.us/j/67890?pwd=FGHij",
        meetingId: "234 567 8901",
        passcode: "elian",
        password:
          "$2b$12$pNrLSRYlTIwTl//Tz3KMA.K2gdqRWA2/aikJ9ilr0ItQZWe1bJoay", // password: AaasoBo!Elian
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "lori@example.com",
        name: "Lorraine Nuesca",
        nickname: "Lori",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "lori-1.jpg",
        classURL: "https://zoom.us/j/123452?pwd=lori",
        meetingId: "lori 123 456",
        passcode: "lori",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "kaori@example.com",
        name: "Kaori Jean Garcia",
        nickname: "Kaori",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "kaori-1.jpg",
        classURL: "https://zoom.us/j/123453?pwd=kaori",
        meetingId: "kaori 123 456",
        passcode: "kaori",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "winnie@example.com",
        name: "Winnelyn Balangbang",
        nickname: "Winnie",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "winnie-1.jpg",
        classURL: "https://zoom.us/j/123454?pwd=winnie",
        meetingId: "winnie 123 456",
        passcode: "winnie",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "claude@example.com",
        name: "Claude Jean Hinampas",
        nickname: "Claude",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "claude-1.jpg",
        classURL: "https://zoom.us/j/123455?pwd=claude",
        meetingId: "claude 123 456",
        passcode: "claude",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "jdy@example.com",
        name: "Jiesheru Dy Bandisa",
        nickname: "JDY",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "jdy-1.jpg",
        classURL: "https://zoom.us/j/123456?pwd=jdy",
        meetingId: "jdy 123 456",
        passcode: "jdy",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "mae@example.com",
        name: "Mae Reantazo",
        nickname: "Mae",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "mae-1.jpg",
        classURL: "https://zoom.us/j/123457?pwd=mae",
        meetingId: "mae 123 456",
        passcode: "mae",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "eiyd@example.com",
        name: "Eiyd",
        nickname: "Eiyd",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "eiyd-1.jpg",
        classURL: "https://zoom.us/j/123458?pwd=eiyd",
        meetingId: "eiyd 123 456",
        passcode: "eiyd",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "kechia@example.com",
        name: "Kechia Oline Aquino",
        nickname: "Kechia",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "kechia-1.jpg",
        classURL: "https://zoom.us/j/123459?pwd=kechia",
        meetingId: "kechia 123 456",
        passcode: "kechia",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "yasmin@example.com",
        name: "Yasmin Luda",
        nickname: "Yasmin",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "yasmin-1.jpg",
        classURL: "https://zoom.us/j/1234510?pwd=yasmin",
        meetingId: "yasmin 123 456",
        passcode: "yasmin",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "dani@example.com",
        name: "Dani",
        nickname: "Dani",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "dani-1.jpg",
        classURL: "https://zoom.us/j/1234511?pwd=dani",
        meetingId: "dani 123 456",
        passcode: "dani",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "angela@example.com",
        name: "Angela Siega",
        nickname: "Angela",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "angela-1.jpg",
        classURL: "https://zoom.us/j/1234512?pwd=angela",
        meetingId: "angela 123 456",
        passcode: "angela",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "ronilo@example.com",
        name: "Ronilo Salimbot",
        nickname: "Ronilo",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "ronilo-1.jpg",
        classURL: "https://zoom.us/j/1234513?pwd=ronilo",
        meetingId: "ronilo 123 456",
        passcode: "ronilo",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "sheryll@example.com",
        name: "Sheryll",
        nickname: "Sheryll",
        birthdate: new Date("1988-05-15"),
        lifeHistory: "I am a dedicated instructor with a passion for teaching.",
        favoriteFood: "Sushi",
        hobby: "Reading",
        messageForChildren: "Always do your best!",
        workingTime: "9 AM - 5 PM (Philippines) on weekdays",
        skill: "Japanese Language",
        icon: "sheryll-1.jpg",
        classURL: "https://zoom.us/j/1234514?pwd=sheryll",
        meetingId: "sheryll 123 456",
        passcode: "sheryll",
        password:
          "$2b$12$KIe8onrscIo38gG7qugTuOgx5CY7JQ6VkvFKh/skOwkw1tNWdpVlu", // AaasoBo!Helen
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "rina@example.com",
        name: "Rina Fernandez",
        nickname: "Rina",
        birthdate: new Date("1990-02-03"),
        lifeHistory:
          "Experienced Japanese language instructor with 5+ years of teaching.",
        favoriteFood: "Tempura",
        hobby: "Traveling",
        messageForChildren: "Keep learning and smiling!",
        workingTime: "8 AM - 4 PM (Philippines)",
        skill: "Japanese Language",
        icon: "rina-1.jpg",
        classURL: "https://zoom.us/j/11111?pwd=rina",
        meetingId: "rina 123 111",
        passcode: "rina",
        password: "$2b$12$WzRinaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "tina@example.com",
        name: "Tina Villanueva",
        nickname: "Tina",
        birthdate: new Date("1991-07-21"),
        lifeHistory:
          "I enjoy helping students discover the beauty of Japanese.",
        favoriteFood: "Ramen",
        hobby: "Singing",
        messageForChildren: "Enjoy learning every day!",
        workingTime: "10 AM - 6 PM (Philippines)",
        skill: "Japanese Language",
        icon: "tina-1.jpg",
        classURL: "https://zoom.us/j/22222?pwd=tina",
        meetingId: "tina 123 222",
        passcode: "tina",
        password: "$2b$12$WzTinaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-08-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "mark@example.com",
        name: "Mark Reyes",
        nickname: "Mark",
        birthdate: new Date("1987-11-30"),
        lifeHistory: "Japanese educator and culture enthusiast.",
        favoriteFood: "Curry Rice",
        hobby: "Cycling",
        messageForChildren: "Mistakes help you grow!",
        workingTime: "1 PM - 9 PM (Philippines)",
        skill: "Japanese Conversation",
        icon: "mark-1.jpg",
        classURL: "https://zoom.us/j/33333?pwd=mark",
        meetingId: "mark 123 333",
        passcode: "mark",
        password: "$2b$12$WzMarkExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-08-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "liza@example.com",
        name: "Liza Morales",
        nickname: "Liza",
        birthdate: new Date("1995-05-05"),
        lifeHistory: "Specializes in conversational Japanese for teens.",
        favoriteFood: "Gyoza",
        hobby: "Dance",
        messageForChildren: "Be confident and speak out!",
        workingTime: "2 PM - 8 PM (Philippines)",
        skill: "Conversation",
        icon: "liza-1.jpg",
        classURL: "https://zoom.us/j/41414?pwd=liza",
        meetingId: "liza 414 141",
        passcode: "liza",
        password: "$2b$12$WzLizaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-09-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "paolo@example.com",
        name: "Paolo Santos",
        nickname: "Paolo",
        birthdate: new Date("1984-12-12"),
        lifeHistory: "Has experience teaching reading and writing skills.",
        favoriteFood: "Sliced Beef",
        hobby: "Hiking",
        messageForChildren: "Reading opens new worlds!",
        workingTime: "6 AM - 2 PM (Philippines)",
        skill: "Reading & Writing",
        icon: "paolo-1.jpg",
        classURL: "https://zoom.us/j/51515?pwd=paolo",
        meetingId: "paolo 515 151",
        passcode: "paolo",
        password: "$2b$12$WzPaoloExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-04-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "marie@example.com",
        name: "Marie Cruz",
        nickname: "Marie",
        birthdate: new Date("1993-03-03"),
        lifeHistory: "Loves creating interactive quizzes.",
        favoriteFood: "Pancakes",
        hobby: "Baking",
        messageForChildren: "Try new things and have fun!",
        workingTime: "12 PM - 8 PM (Philippines)",
        skill: "Kids activities",
        icon: "marie-1.jpg",
        classURL: "https://zoom.us/j/61616?pwd=marie",
        meetingId: "marie 616 161",
        passcode: "marie",
        password: "$2b$12$WzMarieExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-06-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "justin@example.com",
        name: "Justin Lim",
        nickname: "Justin",
        birthdate: new Date("1986-06-06"),
        lifeHistory: "Focuses on vocabulary building with games.",
        favoriteFood: "Slightly spicy noodles",
        hobby: "Gaming",
        messageForChildren: "Play and learn!",
        workingTime: "3 PM - 11 PM (Philippines)",
        skill: "Vocabulary",
        icon: "justin-1.jpg",
        classURL: "https://zoom.us/j/71717?pwd=justin",
        meetingId: "justin 717 171",
        passcode: "justin",
        password:
          "$2b$12$WzJustinExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2024-08-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "carla@example.com",
        name: "Carla Mendoza",
        nickname: "Carla",
        birthdate: new Date("1992-01-17"),
        lifeHistory: "Experienced with group lessons for beginners.",
        favoriteFood: "Bento",
        hobby: "Yoga",
        messageForChildren: "Teamwork makes learning fun!",
        workingTime: "9 AM - 5 PM (Philippines)",
        skill: "Group lessons",
        icon: "carla-1.jpg",
        classURL: "https://zoom.us/j/81818?pwd=carla",
        meetingId: "carla 818 181",
        passcode: "carla",
        password: "$2b$12$WzCarlaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-08-31T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "gem@example.com",
        name: "Gem Alcantara",
        nickname: "Gem",
        birthdate: new Date("1994-04-04"),
        lifeHistory: "Creative teacher who uses arts & crafts.",
        favoriteFood: "Fruit Salad",
        hobby: "Crafting",
        messageForChildren: "Create and learn!",
        workingTime: "10 AM - 6 PM (Philippines)",
        skill: "Arts-based lessons",
        icon: "gem-1.jpg",
        classURL: "https://zoom.us/j/91919?pwd=gem",
        meetingId: "gem 919 191",
        passcode: "gem",
        password: "$2b$12$WzGemExampleHash000000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-08-07T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "aileen@example.com",
        name: "Aileen Torres",
        nickname: "Aileen",
        birthdate: new Date("1988-08-08"),
        lifeHistory: "Helps shy kids open up through drama activities.",
        favoriteFood: "Somen",
        hobby: "Acting",
        messageForChildren: "Express yourself!",
        workingTime: "2 PM - 10 PM (Philippines)",
        skill: "Drama & voice",
        icon: "aileen-1.jpg",
        classURL: "https://zoom.us/j/20220?pwd=aileen",
        meetingId: "aileen 202 202",
        passcode: "aileen",
        password:
          "$2b$12$WzAileenExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-04-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "niko@example.com",
        name: "Niko Alvarez",
        nickname: "Niko",
        birthdate: new Date("1990-10-20"),
        lifeHistory: "Enjoys language exchange sessions with students.",
        favoriteFood: "Grilled fish",
        hobby: "Music",
        messageForChildren: "Talk and learn together!",
        workingTime: "6 PM - 2 AM (Philippines)",
        skill: "Conversation & exchange",
        icon: "niko-1.jpg",
        classURL: "https://zoom.us/j/30330?pwd=niko",
        meetingId: "niko 303 303",
        passcode: "niko",
        password:
          "$2b$12$WzNikoExampleHash000000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-06-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "jonah@example.com",
        name: "Jonah Perez",
        nickname: "Jonah",
        birthdate: new Date("1989-09-19"),
        lifeHistory: "Uses story-based learning and roleplay.",
        favoriteFood: "Fried rice",
        hobby: "Reading comics",
        messageForChildren: "Stories make learning fun!",
        workingTime: "9 AM - 5 PM (Philippines)",
        skill: "Storytelling",
        icon: "jonah-1.jpg",
        classURL: "https://zoom.us/j/40440?pwd=jonah",
        meetingId: "jonah 404 404",
        passcode: "jonah",
        password: "$2b$12$WzJonahExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-03-11T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "grace@example.com",
        name: "Grace Lim",
        nickname: "Grace",
        birthdate: new Date("1991-01-01"),
        lifeHistory: "Patient teacher focused on pronunciation.",
        favoriteFood: "Sushi Rolls",
        hobby: "Tea ceremony",
        messageForChildren: "Listen carefully and repeat!",
        workingTime: "11 AM - 7 PM (Philippines)",
        skill: "Pronunciation",
        icon: "grace-1.jpg",
        classURL: "https://zoom.us/j/50550?pwd=grace",
        meetingId: "grace 505 505",
        passcode: "grace",
        password: "$2b$12$WzGraceExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-01-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "andy@example.com",
        name: "Andy Gonzales",
        nickname: "Andy",
        birthdate: new Date("1987-02-02"),
        lifeHistory: "Focus on practical expressions for travel.",
        favoriteFood: "Tempura Udon",
        hobby: "Photography",
        messageForChildren: "Try to use new phrases every day!",
        workingTime: "7 AM - 3 PM (Philippines)",
        skill: "Travel Japanese",
        icon: "andy-1.jpg",
        classURL: "https://zoom.us/j/60660?pwd=andy",
        meetingId: "andy 606 606",
        passcode: "andy",
        password: "$2b$12$WzAndyExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2025-02-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "fame@example.com",
        name: "Fame Ramos",
        nickname: "Fame",
        birthdate: new Date("1993-12-24"),
        lifeHistory: "Creates phonics-based lesson plans for young learners.",
        favoriteFood: "Mochi",
        hobby: "Piano",
        messageForChildren: "Sing along and learn!",
        workingTime: "10 AM - 6 PM (Philippines)",
        skill: "Phonics",
        icon: "fame-1.jpg",
        classURL: "https://zoom.us/j/70707?pwd=fame",
        meetingId: "fame 707 707",
        passcode: "fame",
        password: "$2b$12$WzFameExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2024-12-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "faith@example.com",
        name: "Faith Ramos",
        nickname: "Faith",
        birthdate: new Date("1993-12-24"),
        lifeHistory: "Creates phonics-based lesson plans for young learners.",
        favoriteFood: "Mochi",
        hobby: "Piano",
        messageForChildren: "Sing along and learn!",
        workingTime: "10 AM - 6 PM (Philippines)",
        skill: "Phonics",
        icon: "faith-1.jpg",
        classURL: "https://zoom.us/j/710707?pwd=faith",
        meetingId: "faith 707 707",
        passcode: "faith",
        password: "$2b$12$WzFaithExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: "2024-12-27T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "yuki.nakamura@example.com",
        name: "Yuki Nakamura",
        nickname: "Yuki",
        birthdate: new Date("1989-04-05"),
        lifeHistory: "Full-stack instructor specializing in React and FastAPI.",
        favoriteFood: "Sushi",
        hobby: "Photography",
        messageForChildren: "Build something small every day.",
        workingTime: "9 AM - 5 PM (Japan)",
        skill: "React / FastAPI",
        icon: "yuki-1.jpg",
        classURL: "https://zoom.us/j/81001?pwd=yuki",
        meetingId: "81001 001 001",
        passcode: "yuki",
        password: "$2b$12$WzYukiExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-01T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "alex.thompson@example.com",
        name: "Alex Thompson",
        nickname: "Alex",
        birthdate: new Date("1985-11-21"),
        lifeHistory:
          "Instructor focused on scalable backend design using Node.js.",
        favoriteFood: "Curry",
        hobby: "Cycling",
        messageForChildren: "Practice makes progress!",
        workingTime: "10 AM - 6 PM (Philippines)",
        skill: "Node.js / PostgreSQL",
        icon: "alex-1.jpg",
        classURL: "https://zoom.us/j/82002?pwd=alex",
        meetingId: "82002 002 002",
        passcode: "alex",
        password: "$2b$12$WzAlexExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-02T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "mina.sato@example.com",
        name: "Mina Sato",
        nickname: "Mina",
        birthdate: new Date("1992-02-14"),
        lifeHistory:
          "Passionate about UX/UI and accessibility in modern web apps.",
        favoriteFood: "Tempura",
        hobby: "Drawing",
        messageForChildren: "Design with kindness.",
        workingTime: "9 AM - 5 PM (Japan)",
        skill: "Next.js / UX Design",
        icon: "mina-1.jpg",
        classURL: "https://zoom.us/j/83003?pwd=mina",
        meetingId: "83003 003 003",
        passcode: "mina",
        password: "$2b$12$WzMinaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-03T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "daniel.green@example.com",
        name: "Daniel Green",
        nickname: "Daniel",
        birthdate: new Date("1983-07-07"),
        lifeHistory: "Backend engineer teaching distributed systems and APIs.",
        favoriteFood: "Ramen",
        hobby: "Hiking",
        messageForChildren: "Break big problems into little ones.",
        workingTime: "2 PM - 10 PM (Philippines)",
        skill: "Go / Microservices",
        icon: "daniel-1.jpg",
        classURL: "https://zoom.us/j/84004?pwd=daniel",
        meetingId: "84004 004 004",
        passcode: "daniel",
        password:
          "$2b$12$WzDanielExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-04T00:00:00.000Z",
        terminationAt: "2025-03-30T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "haruka.fujimoto@example.com",
        name: "Haruka Fujimoto",
        nickname: "Haruka",
        birthdate: new Date("1990-06-18"),
        lifeHistory:
          "Frontend instructor helping teams adopt TypeScript effectively.",
        favoriteFood: "Sashimi",
        hobby: "Gardening",
        messageForChildren: "Code with curiosity.",
        workingTime: "9 AM - 5 PM (Japan)",
        skill: "TypeScript / React",
        icon: "haruka-1.jpg",
        classURL: "https://zoom.us/j/85005?pwd=haruka",
        meetingId: "85005 005 005",
        passcode: "haruka",
        password:
          "$2b$12$WzHarukaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-05T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "ryan.chen@example.com",
        name: "Ryan Chen",
        nickname: "Ryan",
        birthdate: new Date("1987-09-02"),
        lifeHistory:
          "Cloud instructor with expertise in AWS architecture and CI/CD.",
        favoriteFood: "Dumplings",
        hobby: "Gaming",
        messageForChildren: "Automate the boring stuff.",
        workingTime: "10 AM - 6 PM (Philippines)",
        skill: "AWS / DevOps",
        icon: "ryan-1.jpg",
        classURL: "https://zoom.us/j/86006?pwd=ryan",
        meetingId: "86006 006 006",
        passcode: "ryan",
        password: "$2b$12$WzRyanExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-06T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "kana.watanabe@example.com",
        name: "Kana Watanabe",
        nickname: "Kana",
        birthdate: new Date("1991-10-10"),
        lifeHistory:
          "Instructor focusing on startup prototyping and agile methods.",
        favoriteFood: "Udon",
        hobby: "Travel",
        messageForChildren: "Try and iterate!",
        workingTime: "11 AM - 7 PM (Philippines)",
        skill: "Product Design / Agile",
        icon: "kana-1.jpg",
        classURL: "https://zoom.us/j/87007?pwd=kana",
        meetingId: "87007 007 007",
        passcode: "kana",
        password: "$2b$12$WzKanaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-07T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "thomas.walker@example.com",
        name: "Thomas Walker",
        nickname: "Thomas",
        birthdate: new Date("1984-01-30"),
        lifeHistory:
          "Experienced in software testing and QA automation frameworks.",
        favoriteFood: "Pancakes",
        hobby: "Cycling",
        messageForChildren: "Test early and often.",
        workingTime: "9 AM - 5 PM (UK)",
        skill: "Cypress / Playwright",
        icon: "thomas-1.jpg",
        classURL: "https://zoom.us/j/88008?pwd=thomas",
        meetingId: "88008 008 008",
        passcode: "thomas",
        password:
          "$2b$12$WzThomasExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-08T00:00:00.000Z",
        terminationAt: "2025-02-14T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "miyu.takahashi@example.com",
        name: "Miyu Takahashi",
        nickname: "Miyu",
        birthdate: new Date("1993-03-03"),
        lifeHistory: "Designer turned instructor focusing on design systems.",
        favoriteFood: "Okonomiyaki",
        hobby: "Figma plugins",
        messageForChildren: "Design with empathy.",
        workingTime: "10 AM - 6 PM (Japan)",
        skill: "Figma / Design Systems",
        icon: "miyu-1.jpg",
        classURL: "https://zoom.us/j/89009?pwd=miyu",
        meetingId: "89009 009 009",
        passcode: "miyu",
        password: "$2b$12$WzMiyuExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-09T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "ethan.rivera@example.com",
        name: "Ethan Rivera",
        nickname: "Ethan",
        birthdate: new Date("1988-12-12"),
        lifeHistory: "Teaching scalable API design and GraphQL best practices.",
        favoriteFood: "Tacos",
        hobby: "Cooking",
        messageForChildren: "APIs are like Lego blocks.",
        workingTime: "1 PM - 9 PM (Philippines)",
        skill: "GraphQL / API Design",
        icon: "ethan-1.jpg",
        classURL: "https://zoom.us/j/90010?pwd=ethan",
        meetingId: "90010 010 010",
        passcode: "ethan",
        password: "$2b$12$WzEthanExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-10T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "aoi.suzuki@example.com",
        name: "Aoi Suzuki",
        nickname: "Aoi",
        birthdate: new Date("1994-09-09"),
        lifeHistory:
          "Full-stack instructor mentoring junior developers in startups.",
        favoriteFood: "Somen",
        hobby: "Reading",
        messageForChildren: "Ask lots of questions.",
        workingTime: "9 AM - 5 PM (Japan)",
        skill: "Next.js / Prisma",
        icon: "aoi-1.jpg",
        classURL: "https://zoom.us/j/91011?pwd=aoi",
        meetingId: "91011 011 011",
        passcode: "aoi",
        password: "$2b$12$WzAoiExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-11T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "logan.wright@example.com",
        name: "Logan Wright",
        nickname: "Logan",
        birthdate: new Date("1982-05-19"),
        lifeHistory:
          "Software architect with focus on performance optimization.",
        favoriteFood: "Steak",
        hobby: "Rock climbing",
        messageForChildren: "Efficiency matters, but clarity first.",
        workingTime: "9 AM - 5 PM (USA)",
        skill: "Rust / Systems Engineering",
        icon: "logan-1.jpg",
        classURL: "https://zoom.us/j/92012?pwd=logan",
        meetingId: "92012 012 012",
        passcode: "logan",
        password: "$2b$12$WzLoganExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-12T00:00:00.000Z",
        terminationAt: "2025-06-01T00:00:00.000Z",
        englishBackground: 0,
      },
      {
        email: "sayaka.kobayashi@example.com",
        name: "Sayaka Kobayashi",
        nickname: "Sayaka",
        birthdate: new Date("1991-01-07"),
        lifeHistory: "AI instructor passionate about teaching ML fundamentals.",
        favoriteFood: "Green tea sweets",
        hobby: "Machine learning experiments",
        messageForChildren: "Curiosity fuels discovery.",
        workingTime: "10 AM - 6 PM (Japan)",
        skill: "Python / Machine Learning",
        icon: "sayaka-1.jpg",
        classURL: "https://zoom.us/j/93013?pwd=sayaka",
        meetingId: "93013 013 013",
        passcode: "sayaka",
        password:
          "$2b$12$WzSayakaExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-13T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 0,
      },
      {
        email: "george.adams@example.com",
        name: "George Adams",
        nickname: "George",
        birthdate: new Date("1986-08-08"),
        lifeHistory:
          "Instructor specializing in data visualization and storytelling.",
        favoriteFood: "Paella",
        hobby: "Photography",
        messageForChildren: "Tell stories with data.",
        workingTime: "9 AM - 5 PM (UK)",
        skill: "D3.js / Visualization",
        icon: "george-1.jpg",
        classURL: "https://zoom.us/j/94014?pwd=george",
        meetingId: "94014 014 014",
        passcode: "george",
        password:
          "$2b$12$WzGeorgeExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-14T00:00:00.000Z",
        terminationAt: null,
        englishBackground: 1,
      },
      {
        email: "emi.nakagawa@example.com",
        name: "Emi Nakagawa",
        nickname: "Emi",
        birthdate: new Date("1990-12-12"),
        lifeHistory:
          "Web instructor focused on building inclusive and responsive UI.",
        favoriteFood: "Mochi",
        hobby: "Calligraphy",
        messageForChildren: "Be kind to your users.",
        workingTime: "9 AM - 5 PM (Japan)",
        skill: "HTML / CSS / Accessibility",
        icon: "/images/default-user-icon.jpg?t=1764200809362",
        classURL: "https://zoom.us/j/95015?pwd=emi",
        meetingId: "95015 015 015",
        passcode: "emi",
        password: "$2b$12$WzEmiExampleHash0000000000000000000000000000000000",
        createdAt: "2024-08-15T00:00:00.000Z",
        englishBackground: 1,
      },
      {
        email: "niki.alvarez@example.com",
        name: "Niki Alvarez",
        nickname: "Niki",
        birthdate: new Date("1990-10-20"),
        lifeHistory: "Enjoys language exchange sessions with students.",
        favoriteFood: "Grilled fish",
        hobby: "Music",
        messageForChildren: "Talk and learn together!",
        workingTime: "6 PM - 2 AM (Philippines)",
        skill: "Conversation & exchange",
        icon: "/images/default-user-icon.jpg?t=1764200809361",
        classURL: "https://zoom.us/j/102022?pwd=niki",
        meetingId: "102022 022 022",
        passcode: "niki",
        password:
          "$2b$12$WzNikiExampleHash000000000000000000000000000000000000",
        createdAt: "2024-08-22T00:00:00.000Z",
        englishBackground: 2,
      },
    ],
  });
}

async function insertInstructorTagCatalogs() {
  await prisma.instructorTagCatalog.createMany({
    data: [
      { label: "Minecraft", sortOrder: 1 },
      { label: "Kids Specialist", sortOrder: 2 },
      { label: "Phonics Expert", sortOrder: 3 },
      { label: "Grammar Coach", sortOrder: 4 },
      { label: "Conversation Focus", sortOrder: 5 },
      { label: "Beginner Friendly", sortOrder: 6 },
      { label: "Pronunciation Focus", sortOrder: 7 },
      { label: "Exam Preparation", sortOrder: 8 },
      { label: "Reading Support", sortOrder: 9 },
      { label: "Writing Support", sortOrder: 10 },
      { label: "Listening Training", sortOrder: 11 },
      { label: "Speaking Training", sortOrder: 12 },
      { label: "Homework Support", sortOrder: 13 },
      { label: "Interactive Lessons", sortOrder: 14 },
      { label: "Storytelling", sortOrder: 15 },
      { label: "Music Activities", sortOrder: 16 },
      { label: "Game-based Learning", sortOrder: 17 },
      { label: "STEM English", sortOrder: 18 },
      { label: "Art Activities", sortOrder: 19 },
      { label: "Travel English", sortOrder: 20 },
      { label: "Business English", sortOrder: 21 },
      { label: "Daily Conversation", sortOrder: 22 },
      { label: "Parent Feedback", sortOrder: 23 },
      { label: "Flexible Schedule", sortOrder: 24 },
      { label: "Weekend Available", sortOrder: 25 },
      { label: "Morning Available", sortOrder: 26 },
      { label: "Evening Available", sortOrder: 27 },
      { label: "Advanced Learners", sortOrder: 28 },
      { label: "Shy Kids Support", sortOrder: 29 },
      { label: "Motivational Coach", sortOrder: 30 },
    ],
    skipDuplicates: true,
  });
}

async function insertInstructorTagAssignments() {
  const [instructors, tags] = await Promise.all([
    prisma.instructor.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    }),
    prisma.instructorTagCatalog.findMany({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const tagIds = tags.map(({ id }) => id);

  const data = instructors.flatMap(({ id: instructorId }, instructorIndex) => {
    const tagCount = tagIds.length;
    if (tagCount === 0) {
      return [];
    }
    const selectedCount = Math.min(tagCount, 3 + (instructorIndex % 8));
    const startIndex = instructorIndex % tagCount;
    const step = (instructorIndex % 4) + 1;

    const selectedTagIds = new Set<number>();
    let cursor = startIndex;

    while (selectedTagIds.size < selectedCount) {
      selectedTagIds.add(tagIds[cursor]);
      cursor = (cursor + step) % tagCount;
    }

    const updatedBy =
      instructorIndex % 3 === 0 ? null : (instructorIndex % 2) + 1;

    return [...selectedTagIds].map((tagId) => ({
      instructorId,
      tagId,
      updatedBy,
    }));
  });

  await prisma.instructorTagAssignment.createMany({
    data,
    skipDuplicates: true,
  });
}

async function insertCustomers() {
  await prisma.customer.createMany({
    data: [
      {
        name: "Alice",
        email: "alice@example.com",
        emailVerified: "2025-03-08T14:31:26.816Z",
        password:
          "$2b$12$GFM.a0hEjl/0/U3IjO057esEr7l.NMKZSeRC7c1he6wzDvoIW4oxy", // AaasoBo!Alice
        prefecture: "青森県 / Aomori",
        hasSeenWelcome: true,
        createdAt: "2024-08-01T00:00:00.000Z",
        updatedAt: "2024-08-10T00:00:00.000Z",
      },
      {
        name: "Bob",
        email: "bob@example.com",
        password:
          "$2b$12$txZ49345mBu/RNVfnKFw9.VahiO1wj4z.6aeKckM50LYkd2Upz3eC", // AaasoBo!Bob
        prefecture: "北海道 / Hokkaido",
        hasSeenWelcome: true,
        emailVerified: "2025-04-11T01:26:02.736Z",
        createdAt: "2024-08-01T00:00:00.000Z",
        updatedAt: "2024-08-10T00:00:00.000Z",
      },
      {
        name: "山田 花",
        email: "hana@example.com",
        password:
          "$2b$12$qbcPqqpR3nKgtCgrusCbQOfMqJJHiMlBSkeClYEeWkKM6Fc6xahD2",
        prefecture: "北海道 / Hokkaido",
        hasSeenWelcome: false,
        emailVerified: "2025-04-11T01:26:02.736Z",
        createdAt: "2025-04-01T00:00:00.000Z",
        updatedAt: "2024-08-10T00:00:00.000Z",
      },
      {
        name: "Charlie",
        email: "charlie@example.com",
        password:
          "$2b$12$6OQZt2y0M4Bnb9S1jxT0gOyYcKxh6PzZTUSZQhd02lYroS8PZL2zW",
        prefecture: "東京都 / Tokyo",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-05-12T00:00:00.000Z",
        updatedAt: "2025-05-12T00:00:00.000Z",
      },
      {
        name: "佐藤 太郎",
        email: "taro@example.com",
        password:
          "$2b$12$5U9ovY5lz4bKXQjzzwYjIuLC6oJjOQ8cUQhd5cT2hwB8kD0V5WvUO",
        prefecture: "大阪府 / Osaka",
        hasSeenWelcome: true,
        emailVerified: "2025-06-15T10:05:45.000Z",
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-15T00:00:00.000Z",
      },
      {
        name: "Emily",
        email: "emily@example.com",
        password:
          "$2b$12$vZQteLy2vCrXWkTVF9rU8O7QWX3N4Ab2IEpFsb0jRyy4Rfx6LZJVm",
        prefecture: "福岡県 / Fukuoka",
        hasSeenWelcome: false,
        emailVerified: "2025-07-20T08:12:30.000Z",
        createdAt: "2025-07-01T00:00:00.000Z",
        updatedAt: "2025-07-10T00:00:00.000Z",
      },
      {
        name: "田中 一郎",
        email: "ichiro@example.com",
        password:
          "$2b$12$ENvI8JtU1xSO0hb7K3WwTehKdbzjANaZ3wSwIyk5tMGoD5R7uqFQa",
        prefecture: "愛知県 / Aichi",
        hasSeenWelcome: true,
        emailVerified: "2025-08-05T09:45:12.000Z",
        createdAt: "2025-08-01T00:00:00.000Z",
        updatedAt: "2025-08-10T00:00:00.000Z",
      },
      {
        name: "David",
        email: "david@example.com",
        password:
          "$2b$12$4ZmvPgFGQ1I6E1h5R.DW6O/h4RDU8PxfPWe7Pkc7U5u4z3V8Aej8W",
        prefecture: "京都府 / Kyoto",
        hasSeenWelcome: true,
        emailVerified: "2025-08-22T13:30:00.000Z",
        createdAt: "2025-08-20T00:00:00.000Z",
        updatedAt: "2025-08-22T00:00:00.000Z",
      },
      {
        name: "中村 美咲",
        email: "misaki@example.com",
        password:
          "$2b$12$mnTs1a2YbJdSgS0Yo1c0E.x3JGpTzi8BzLx0uEykf8Y4UwEBGlxHa",
        prefecture: "兵庫県 / Hyogo",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-09-01T00:00:00.000Z",
        updatedAt: "2025-09-05T00:00:00.000Z",
      },
      {
        name: "Ethan",
        email: "ethan@example.com",
        password:
          "$2b$12$gC3VbE5fr3tHzmRMWq7Eae2OD.IeAjKxz3o/6WitWBHCW3DhzAEOq",
        prefecture: "神奈川県 / Kanagawa",
        hasSeenWelcome: true,
        emailVerified: "2025-09-18T10:22:00.000Z",
        createdAt: "2025-09-10T00:00:00.000Z",
        updatedAt: "2025-09-18T00:00:00.000Z",
      },
      {
        name: "高橋 結衣",
        email: "yui@example.com",
        password:
          "$2b$12$VLmJteRjy0MhoPb1Fq.kLeEHTFLkT3VFrdKQ2Zg3u0aQtNqI/8FG6",
        prefecture: "静岡県 / Shizuoka",
        hasSeenWelcome: true,
        emailVerified: "2025-10-02T09:15:00.000Z",
        createdAt: "2025-10-01T00:00:00.000Z",
        updatedAt: "2025-10-02T00:00:00.000Z",
      },
      {
        name: "Olivia",
        email: "olivia@example.com",
        password:
          "$2b$12$3HjZAg0hB3h8sVnBdP2fReKc9CbbhZ0RpZCk29FGxTqH72wFQPyci",
        prefecture: "広島県 / Hiroshima",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-10-10T00:00:00.000Z",
        updatedAt: "2025-10-15T00:00:00.000Z",
      },
      {
        name: "鈴木 蓮",
        email: "ren@example.com",
        password:
          "$2b$12$zFn8kEzGdD6s7P6Qb2y8M.uwL7N2RLqL1DdzJ.TtMtTbA5iF3/ghK",
        prefecture: "宮城県 / Miyagi",
        hasSeenWelcome: true,
        emailVerified: "2025-10-18T11:40:00.000Z",
        createdAt: "2025-10-15T00:00:00.000Z",
        updatedAt: "2025-10-18T00:00:00.000Z",
      },
      {
        name: "佐々木 翔",
        email: "sho@example.com",
        password:
          "$2b$12$WZ1GZJQG5fLz9vYw2DyvDehFGs9mA1xCYULgPMhERmWQn2J6kDfO2",
        prefecture: "岩手県 / Iwate",
        hasSeenWelcome: true,
        emailVerified: "2025-03-05T10:00:00.000Z",
        createdAt: "2025-03-01T00:00:00.000Z",
        updatedAt: "2025-03-05T00:00:00.000Z",
      },
      {
        name: "Isabella",
        email: "isabella@example.com",
        password:
          "$2b$12$U7xFhz9wO1VjkbZ1VwA88Osg8m0W0b7PzZSYjUgUVoym9ZPa6yZQK",
        prefecture: "長野県 / Nagano",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-03-10T00:00:00.000Z",
        updatedAt: "2025-03-12T00:00:00.000Z",
      },
      {
        name: "松本 健太",
        email: "kenta@example.com",
        password:
          "$2b$12$uFRvT7Jp9KZ6YFz6O7v5uO63R8tQj1q1eYb6o8lZJHj0WPLzjTz5W",
        prefecture: "新潟県 / Niigata",
        hasSeenWelcome: true,
        emailVerified: "2025-03-18T09:10:00.000Z",
        createdAt: "2025-03-15T00:00:00.000Z",
        updatedAt: "2025-03-18T00:00:00.000Z",
      },
      {
        name: "Noah",
        email: "noah@example.com",
        password:
          "$2b$12$PMa7k9HwQqW6nA8s2eCq3uFjV3sC7fGgYqZ1hN7wQqP3vSxZyD4a.",
        prefecture: "群馬県 / Gunma",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-04-01T00:00:00.000Z",
        updatedAt: "2025-04-05T00:00:00.000Z",
      },
      {
        name: "藤田 美絵",
        email: "mie@example.com",
        password:
          "$2b$12$Yt5Qx2T6rP8lZxW3bYc9UeJdZ5f0OaHnCqP3rT6vL6sFvC9gBzJgG",
        prefecture: "茨城県 / Ibaraki",
        hasSeenWelcome: true,
        emailVerified: "2025-04-10T08:15:00.000Z",
        createdAt: "2025-04-05T00:00:00.000Z",
        updatedAt: "2025-04-10T00:00:00.000Z",
      },
      {
        name: "Lion",
        email: "lion@example.com",
        password:
          "$2b$12$L1b3Hq8mX0r7EoW1yGv2qFJfPzN8nQvYjL2sHk3xBvC8jM9sQqH2m",
        prefecture: "埼玉県 / Saitama",
        hasSeenWelcome: true,
        emailVerified: "2025-04-15T11:30:00.000Z",
        createdAt: "2025-04-10T00:00:00.000Z",
        updatedAt: "2025-04-15T00:00:00.000Z",
      },
      {
        name: "渡辺 直樹",
        email: "naoki@example.com",
        password:
          "$2b$12$W1c7Yt2Fq8mV9Lk4N1p3tRjGzV2yBfN6xDqC5hR8wEoU3vP6zJrK3y",
        prefecture: "千葉県 / Chiba",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-04-20T00:00:00.000Z",
        updatedAt: "2025-04-22T00:00:00.000Z",
      },
      {
        name: "Sophia",
        email: "sophia@example.com",
        password:
          "$2b$12$Yy2jR8mCzV4bN6pX2dL9tQjM7rP1kVhJ3xU6yZgT9sBqR8vW3nH4m",
        prefecture: "東京都 / Tokyo",
        hasSeenWelcome: true,
        emailVerified: "2025-04-25T09:00:00.000Z",
        createdAt: "2025-04-20T00:00:00.000Z",
        updatedAt: "2025-04-25T00:00:00.000Z",
      },
      {
        name: "加藤 愛",
        email: "ai@example.com",
        password:
          "$2b$12$Vn2zQx1kHq5lW3dEoT8mV7yPzR1fG8aJjL3bC9nM0tU4vS6xD2qP4y",
        prefecture: "神奈川県 / Kanagawa",
        hasSeenWelcome: true,
        emailVerified: "2025-05-01T10:10:00.000Z",
        createdAt: "2025-04-28T00:00:00.000Z",
        updatedAt: "2025-05-01T00:00:00.000Z",
      },
      {
        name: "James",
        email: "james@example.com",
        password:
          "$2b$12$Lq7kR1nTzM4hD8pW2vS6aN0fQjP5xC3uEoT1kL9vBzJrD2mYxN8aL",
        prefecture: "富山県 / Toyama",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-05-05T00:00:00.000Z",
        updatedAt: "2025-05-07T00:00:00.000Z",
      },
      {
        name: "井上 美月",
        email: "mizuki@example.com",
        password:
          "$2b$12$N2zQkYtR8mV6pX3lC1hG9fT0bN5oM2vL3yR6jK8pW4qZ1dF7xE9nS",
        prefecture: "石川県 / Ishikawa",
        hasSeenWelcome: true,
        emailVerified: "2025-05-10T12:00:00.000Z",
        createdAt: "2025-05-07T00:00:00.000Z",
        updatedAt: "2025-05-10T00:00:00.000Z",
      },
      {
        name: "Lucas",
        email: "lucas@example.com",
        password:
          "$2b$12$B1zLkJpR8qT3hM7vN2dF5yW4aC6oZ8uR3tP2kL9sX5vG7jQ0bE1nA",
        prefecture: "長崎県 / Nagasaki",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-05-15T00:00:00.000Z",
        updatedAt: "2025-05-17T00:00:00.000Z",
      },
      {
        name: "森本 健斗",
        email: "kento@example.com",
        password:
          "$2b$12$H2nLkT5rQ3yV6oW1pE8fJ9zM7uC2sV0dN4aX5jK9rL8pG3tH6bZ7y",
        prefecture: "熊本県 / Kumamoto",
        hasSeenWelcome: true,
        emailVerified: "2025-05-20T08:40:00.000Z",
        createdAt: "2025-05-17T00:00:00.000Z",
        updatedAt: "2025-05-20T00:00:00.000Z",
      },
      {
        name: "Ava",
        email: "ava@example.com",
        password:
          "$2b$12$R9kN5pQ4mX6vE3jB1hT2sU9zC5fV8dN7rL0xK4qM2yG6tA8jW3bE0",
        prefecture: "岐阜県 / Gifu",
        hasSeenWelcome: true,
        emailVerified: "2025-05-25T09:30:00.000Z",
        createdAt: "2025-05-22T00:00:00.000Z",
        updatedAt: "2025-05-25T00:00:00.000Z",
      },
      {
        name: "山口 遼",
        email: "ryo@example.com",
        password:
          "$2b$12$W5xP2nT6qK9vM1yL3eR8fB7sN2cJ4tV5aX0hP8zL9dE6mU2wJ3vC9",
        prefecture: "奈良県 / Nara",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-05-30T00:00:00.000Z",
        updatedAt: "2025-06-01T00:00:00.000Z",
      },
      {
        name: "Mia",
        email: "mia@example.com",
        password:
          "$2b$12$C3vQ7nY1xL6bP4rF8mW2tH9kE5zV7jC0nX1aM6sD2yU8pJ4rZ5qE1",
        prefecture: "岡山県 / Okayama",
        hasSeenWelcome: true,
        emailVerified: "2025-06-05T10:00:00.000Z",
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-05T00:00:00.000Z",
      },
      {
        name: "林 美香",
        email: "mika@example.com",
        password:
          "$2b$12$P8xV3hL1mQ7eB9rW5tK2sZ4fG6jD1vA7nM3uP2kT0yN5qL8rE4bJ6",
        prefecture: "滋賀県 / Shiga",
        hasSeenWelcome: true,
        emailVerified: "2025-06-10T12:00:00.000Z",
        createdAt: "2025-06-08T00:00:00.000Z",
        updatedAt: "2025-06-10T00:00:00.000Z",
      },
      {
        name: "Jun",
        email: "jun@example.com",
        password:
          "$2b$12$S3nD5lF7qV9pR1xM6eK2zC4tB8uW3yJ0aL5mP7rN2vG8kE1tQ6hU5",
        prefecture: "山口県 / Yamaguchi",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-06-15T00:00:00.000Z",
        updatedAt: "2025-06-17T00:00:00.000Z",
        terminationAt: "2025-08-17T00:00:00.000Z",
      },
      {
        name: "小林 智子",
        email: "tomoko@example.com",
        password:
          "$2b$12$V1mC4rL8qF5jS9eN3pK2hD6vA7uW0yX5bT9nR2zP4gM3vL7kE8jF2",
        prefecture: "大分県 / Oita",
        hasSeenWelcome: true,
        emailVerified: "2025-06-20T10:00:00.000Z",
        createdAt: "2025-06-17T00:00:00.000Z",
        updatedAt: "2025-06-20T00:00:00.000Z",
        terminationAt: "2025-08-20T00:00:00.000Z",
      },
      {
        name: "Frank",
        email: "frank@example.com",
        password:
          "$2b$12$M8pJ3nW5tF9hK6rB1eZ2xG7uD4qN0yA3lS8mV2pT9wC7bL5dH1fU3",
        prefecture: "香川県 / Kagawa",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-06-25T00:00:00.000Z",
        updatedAt: "2025-06-27T00:00:00.000Z",
        terminationAt: "2025-08-27T00:00:00.000Z",
      },
      {
        name: "伊藤 萌",
        email: "moe@example.com",
        password:
          "$2b$12$R4xT9pQ2kV8bL5rC3jN1sF6gZ0uE7hY2dA5vT3mP8yQ6nR9wB1eG5",
        prefecture: "愛媛県 / Ehime",
        hasSeenWelcome: true,
        emailVerified: "2025-07-01T09:30:00.000Z",
        createdAt: "2025-06-28T00:00:00.000Z",
        updatedAt: "2025-07-01T00:00:00.000Z",
        terminationAt: "2025-08-01T00:00:00.000Z",
      },
      {
        name: "Jack",
        email: "jack@example.com",
        password:
          "$2b$12$G2lT9mH5qV8rD1xC3pK7fB9uS4tW0aN6eZ2jP8kR5vM7nC1hL3yE2",
        prefecture: "山形県 / Yamagata",
        hasSeenWelcome: true,
        emailVerified: "2025-07-05T08:20:00.000Z",
        createdAt: "2025-07-02T00:00:00.000Z",
        updatedAt: "2025-07-05T00:00:00.000Z",
        terminationAt: "2025-08-05T00:00:00.000Z",
      },
      {
        name: "斎藤 悠",
        email: "haruka@example.com",
        password:
          "$2b$12$F3hQ5kN1pV6rL9wJ8tB2sG4aC7dZ0uE2mV9xP5nT1yR3qL6oH8fM7",
        prefecture: "三重県 / Mie",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-07-10T00:00:00.000Z",
        updatedAt: "2025-07-12T00:00:00.000Z",
        terminationAt: "2025-08-12T00:00:00.000Z",
      },
      {
        name: "Ella",
        email: "ella@example.com",
        password:
          "$2b$12$D4nF1jK8qM7vS2eN6pT5rB9uC3wY0aL9mV1kZ8xJ5tG7hQ2pL3rU4",
        prefecture: "佐賀県 / Saga",
        hasSeenWelcome: true,
        emailVerified: "2025-07-15T11:00:00.000Z",
        createdAt: "2025-07-12T00:00:00.000Z",
        updatedAt: "2025-07-15T00:00:00.000Z",
        terminationAt: "2025-08-15T00:00:00.000Z",
      },
      {
        name: "Liam",
        email: "liam@example.com",
        password:
          "$2b$12$mUQx8w7bL9mYbR.L5eT1TOzVuW0PfFxRQF7gqQ13HjWwDvvzJHZKC",
        prefecture: "東京都 / Tokyo",
        hasSeenWelcome: true,
        emailVerified: "2025-06-10T10:12:00.000Z",
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-10T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "佐々木 海斗",
        email: "kaito@example.com",
        password:
          "$2b$12$HbZP1jOaFZOBcGfV2S9JeOy6KuRLLtV7H.Ht0ptYf6KsnxkQx8WzC",
        prefecture: "神奈川県 / Kanagawa",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-05-12T00:00:00.000Z",
        updatedAt: "2025-05-18T00:00:00.000Z",
        terminationAt: "2025-09-10T00:00:00.000Z",
      },
      {
        name: "Sophie",
        email: "sophie@example.com",
        password:
          "$2b$12$h7mY0mUFJfMplWltR7qDk.yZzH7iZqKTrzKcdYZ7xMhpZLhD8FnL6",
        prefecture: "大阪府 / Osaka",
        hasSeenWelcome: true,
        emailVerified: "2025-07-15T11:25:00.000Z",
        createdAt: "2025-07-01T00:00:00.000Z",
        updatedAt: "2025-07-15T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "井上 美和",
        email: "miwa@example.com",
        password:
          "$2b$12$dHfgX72Ihzs1YUVR5gTrBuXGL6AldZ.DIXK4cbAoeS5d7lFvNOIXa",
        prefecture: "京都府 / Kyoto",
        hasSeenWelcome: true,
        emailVerified: "2025-04-20T09:00:00.000Z",
        createdAt: "2025-04-01T00:00:00.000Z",
        updatedAt: "2025-04-20T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "Noe",
        email: "noe@example.com",
        password:
          "$2b$12$YbgW/XV7FfR9N4Q7x9LciOhMiy6Ppo48MN3PU.3bxlI83C1G7W6GS",
        prefecture: "福岡県 / Fukuoka",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-02-10T00:00:00.000Z",
        updatedAt: "2025-03-01T00:00:00.000Z",
        terminationAt: "2025-08-05T00:00:00.000Z",
      },
      {
        name: "加藤 優",
        email: "yu@example.com",
        password:
          "$2b$12$QhLZ2qR3pKft29JwGmEWmuNCX0kYLUb4zK3VZf0ibmBGK1YtQ/bAG",
        prefecture: "愛知県 / Aichi",
        hasSeenWelcome: true,
        emailVerified: "2025-03-05T08:15:00.000Z",
        createdAt: "2025-03-01T00:00:00.000Z",
        updatedAt: "2025-03-05T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "Issa",
        email: "issa@example.com",
        password:
          "$2b$12$UuN87vvLnsSPmiu5vbi8EOg7tAH1yazHBiLba4Quc3vM8jP2B.LhK",
        prefecture: "北海道 / Hokkaido",
        hasSeenWelcome: true,
        emailVerified: "2025-05-20T12:10:00.000Z",
        createdAt: "2025-05-01T00:00:00.000Z",
        updatedAt: "2025-05-20T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "松本 颯太",
        email: "sota@example.com",
        password:
          "$2b$12$eR4cdm1S/yZmb71e6mMjxOvjvNue8Of1BB88RjeB6DTV2fBGhR6L.",
        prefecture: "茨城県 / Ibaraki",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-01-12T00:00:00.000Z",
        updatedAt: "2025-02-01T00:00:00.000Z",
        terminationAt: "2025-07-25T00:00:00.000Z",
      },
      {
        name: "Jones",
        email: "jones@example.com",
        password:
          "$2b$12$CAvYeRuz9Lj8cJ6N5w6TJeuknmkiHoxeePKzvAEuH1BpXG.efv1Ti",
        prefecture: "静岡県 / Shizuoka",
        hasSeenWelcome: true,
        emailVerified: "2025-08-05T14:20:00.000Z",
        createdAt: "2025-08-01T00:00:00.000Z",
        updatedAt: "2025-08-05T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "森 美穂",
        email: "miho@example.com",
        password:
          "$2b$12$BMnhN2ipcc.xSzM4.oxhYOa6kmp97rHz.aEuZFxvQ2qHt0KUhhTxG",
        prefecture: "岡山県 / Okayama",
        hasSeenWelcome: true,
        emailVerified: "2025-06-18T11:00:00.000Z",
        createdAt: "2025-06-01T00:00:00.000Z",
        updatedAt: "2025-06-18T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "Benjamin",
        email: "benjamin@example.com",
        password:
          "$2b$12$9P/fF6EDK.OgPAnR2HtqXeNqsh8uLwYwTUrX0QyUtbrW2Z8y52v2m",
        prefecture: "広島県 / Hiroshima",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-05-10T00:00:00.000Z",
        updatedAt: "2025-06-01T00:00:00.000Z",
        terminationAt: "2025-09-30T00:00:00.000Z",
      },
      {
        name: "山本 莉子",
        email: "riko@example.com",
        password:
          "$2b$12$gQLp3/.DqsxY1JXUlm40G.ygQx3DeJUVwBqUebXGTFPpFh9n2z0aS",
        prefecture: "宮城県 / Miyagi",
        hasSeenWelcome: true,
        emailVerified: "2025-07-22T09:35:00.000Z",
        createdAt: "2025-07-10T00:00:00.000Z",
        updatedAt: "2025-07-22T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "Charlotte",
        email: "charlotte@example.com",
        password:
          "$2b$12$94RhivD7eA/A.dAqVMPidO.kJYPj5zYvMIH/IVTQp8.gXhJfS0b8K",
        prefecture: "石川県 / Ishikawa",
        hasSeenWelcome: true,
        emailVerified: "2025-08-12T08:10:00.000Z",
        createdAt: "2025-08-01T00:00:00.000Z",
        updatedAt: "2025-08-12T00:00:00.000Z",
        terminationAt: null,
      },
      {
        name: "藤田 翼",
        email: "tsubasa@example.com",
        password:
          "$2b$12$B15Vn52EhNn1G/MEHcZ3UOy3NOn3rZz1vWbIeuX3DWe0TcdsEyoW.",
        prefecture: "新潟県 / Niigata",
        hasSeenWelcome: false,
        emailVerified: null,
        createdAt: "2025-03-12T00:00:00.000Z",
        updatedAt: "2025-03-20T00:00:00.000Z",
        terminationAt: "2025-08-18T00:00:00.000Z",
      },
      {
        name: "Henry",
        email: "henry@example.com",
        password:
          "$2b$12$YQUHBNWn5eQ6r3MCcp5rUOt1RjSGjqimJHVC96bWv7gW2T3uJ8yMe",
        prefecture: "福島県 / Fukushima",
        hasSeenWelcome: true,
        emailVerified: "2025-09-01T09:45:00.000Z",
        createdAt: "2025-08-20T00:00:00.000Z",
        updatedAt: "2025-09-01T00:00:00.000Z",
        terminationAt: null,
      },
      ...syntheticCustomerSeeds.map((customerSeed, index) => ({
        name: customerSeed.name,
        email: customerSeed.email,
        password:
          "$2b$12$47fH6clEdzE2Dd8d7KCeQe2WM2KVeGD25KugHll808LBI6kI.dQqK", // AaasoBo!Admin
        prefecture: customerSeed.prefecture,
        hasSeenWelcome: customerSeed.hasSeenWelcome,
        emailVerified:
          index % 5 === 0 ? null : customerSeed.updatedAt.toISOString(),
        createdAt: customerSeed.createdAt.toISOString(),
        updatedAt: customerSeed.updatedAt.toISOString(),
        terminationAt: customerSeed.terminationAt
          ? customerSeed.terminationAt.toISOString()
          : null,
      })),
    ],
  });
}

async function insertAdmins() {
  await prisma.admin.createMany({
    data: [
      {
        name: "Admin",
        email: "admin@example.com",
        password:
          "$2b$12$47fH6clEdzE2Dd8d7KCeQe2WM2KVeGD25KugHll808LBI6kI.dQqK", // password: AaasoBo!Admin
      },
      {
        name: "Admin2",
        email: "admin2@example.com",
        password:
          "$2b$12$7eMUSK5aFgvlfHJ1Oxk3gOF4bb85id0mEhZgwNW1Y33SYW/5Qr582", // password: AaasoBo!Admin2
      },
    ],
  });
}

async function insertInstructorFees() {
  const helen = await getInstructor("Helen");

  await prisma.instructorFee.createMany({
    data: [
      {
        instructorId: helen.id,
        currency: "JPY",
        effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
        effectiveTo: new Date("2026-03-15T00:00:00.000Z"),
        trialFee: 1000,
        regularFee: 2000,
        cancelFee: 500,
        cancelWithoutNoticeFee: 250,
      },
      {
        instructorId: helen.id,
        currency: "JPY",
        effectiveFrom: new Date("2026-03-16T00:00:00.000Z"),
        effectiveTo: null,
        trialFee: 1500,
        regularFee: 2500,
        cancelFee: 600,
        cancelWithoutNoticeFee: 300,
      },
    ],
  });
}

async function insertClasses() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");
  const hana = await getCustomer("山田 花");
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");
  const aliceHelenRecurringClass = await prisma.recurringClass.findFirst({
    where: {
      subscriptionId: alice.subscription[0].id,
      instructorId: helen.id,
      endAt: null,
    },
    select: { id: true },
  });

  if (!aliceHelenRecurringClass) {
    throw new Error("Active recurring class for Alice and Helen not found");
  }

  await prisma.class.createMany({
    data: [
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-05T07:00:00Z",
      //   status: "completed",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-0",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-12T07:00:00Z",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-1",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-19T07:00:00Z",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-2",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-26T07:00:00Z",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-3",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-06T07:00:00Z",
      //   status: "completed",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-4",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-13T07:00:00Z",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-5",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-20T07:00:00Z",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-6",
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-27T07:00:00Z",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      //   createdAt: "2024-08-05T07:00:00Z",
      //   updatedAt: "2024-08-05T07:00:00Z",
      //   classCode: "1-7",
      // },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-01-06T07:00:00Z",
        status: "booked",
        subscriptionId: alice.subscription[0].id,
        recurringClassId: aliceHelenRecurringClass.id,
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "1-0",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-01-06T08:00:00Z",
        status: "rebooked",
        subscriptionId: alice.subscription[0].id,
        recurringClassId: aliceHelenRecurringClass.id,
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "1-1",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-01-06T09:00:00Z",
        status: "canceledByCustomer",
        subscriptionId: alice.subscription[0].id,
        recurringClassId: aliceHelenRecurringClass.id,
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "1-2",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-01-06T10:00:00Z",
        status: "canceledByInstructor",
        subscriptionId: alice.subscription[0].id,
        recurringClassId: aliceHelenRecurringClass.id,
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "1-3",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-01-06T06:00:00Z",
        status: "completed",
        subscriptionId: alice.subscription[0].id,
        recurringClassId: aliceHelenRecurringClass.id,
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "1-4",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-01-06T11:00:00Z",
        status: "rebooked",
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "ft-0",
        isFreeTrial: true,
      },
      {
        customerId: alice.id,
        status: "pending",
        rebookableUntil: "2026-04-30T09:00:00Z",
        createdAt: "2025-05-20T07:00:00Z",
        updatedAt: "2025-05-20T07:00:00Z",
        classCode: "ft-0-2",
        isFreeTrial: true,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-03-02T01:00:00Z",
        status: "completed",
        subscriptionId: alice.subscription[0].id,
        createdAt: "2026-03-02T01:00:00Z",
        updatedAt: "2026-03-05T10:00:00.000Z",
        classCode: "payroll-1",
        isFreeTrial: true,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-03-10T03:00:00Z",
        status: "completed",
        subscriptionId: alice.subscription[0].id,
        createdAt: "2026-03-10T03:00:00Z",
        updatedAt: "2026-03-12T10:00:00.000Z",
        classCode: "payroll-2",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-03-14T00:00:00Z",
        status: "canceledByInstructor",
        canceledAt: "2026-03-13T14:00:00Z",
        subscriptionId: alice.subscription[0].id,
        createdAt: "2026-03-13T14:00:00Z",
        updatedAt: "2026-03-15T09:12:00.000Z",
        classCode: "payroll-3",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-03-16T00:00:00Z",
        status: "completed",
        subscriptionId: alice.subscription[0].id,
        createdAt: "2026-03-16T00:00:00Z",
        updatedAt: "2026-03-20T03:00:00.000Z",
        classCode: "payroll-4",
        isFreeTrial: false,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2026-03-19T23:00:00Z",
        status: "canceledByInstructor",
        canceledAt: "2026-03-19T15:30:00Z",
        subscriptionId: alice.subscription[0].id,
        createdAt: "2026-03-19T15:30:00Z",
        updatedAt: "2026-03-28T03:00:00.000Z",
        classCode: "payroll-5",
        isFreeTrial: false,
      },
      // {
      //   instructorId: helen.id,
      //   customerId: bob.id,
      //   dateTime: "2024-06-03T15:30:00+09:00",
      //   status: "completed",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: elian.id,
      //   customerId: bob.id,
      //   dateTime: "2024-06-03T16:00:00+09:00",
      //   status: "completed",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: elian.id,
      //   customerId: bob.id,
      //   dateTime: "2024-06-29T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-08T10:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: bob.id,
      //   dateTime: "2024-08-08T10:30:00+09:00",
      //   status: "booked",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-08T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: bob.id,
      //   dateTime: "2024-08-08T11:30:00+09:00",
      //   status: "booked",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-08T12:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: bob.id,
      //   dateTime: "2024-08-08T12:30:00+09:00",
      //   status: "booked",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-08T13:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: bob.id,
      //   dateTime: "2024-08-08T13:30:00+09:00",
      //   status: "booked",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-08T14:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: bob.id,
      //   dateTime: "2024-08-08T14:30:00+09:00",
      //   status: "booked",
      //   subscriptionId: bob.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-08T15:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-13T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-14T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-14T12:00:00+09:00",
      //   status: "completed",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-14T13:00:00+09:00",
      //   status: "canceledByInstructor",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-14T14:00:00+09:00",
      //   status: "canceledByCustomer",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-15T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-16T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-17T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-19T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-20T11:00:00+09:00",
      //   status: "canceledByCustomer",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-21T11:00:00+09:00",
      //   status: "canceledByInstructor",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-22T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
      // {
      //   instructorId: helen.id,
      //   customerId: alice.id,
      //   dateTime: "2024-08-23T11:00:00+09:00",
      //   status: "booked",
      //   subscriptionId: alice.subscription[0].id,
      //   recurringClassId: 1,
      // },
    ],
  });

  const monthlyTrendSeed = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 3 + index, 15));
    const month = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const customer = syntheticCustomerSeeds[index].name;
    const statusCycle = [
      "completed",
      "completed",
      "canceledByCustomer",
      "completed",
      "canceledByInstructor",
    ] as const;

    return {
      month,
      customer,
      status: statusCycle[index % statusCycle.length],
    };
  });

  const additionalClasses = await Promise.all(
    monthlyTrendSeed.map(async (seed, index) => {
      const customer = await getCustomer(seed.customer);
      const classDate = new Date(`${seed.month}-15T07:00:00.000Z`);
      const isWithInstructor = index % 3 !== 0;
      const instructorId = isWithInstructor
        ? index % 2 === 0
          ? helen.id
          : elian.id
        : null;

      const subscriptionId =
        customer.name === alice.name
          ? alice.subscription[0].id
          : customer.name === bob.name
            ? bob.subscription[0].id
            : customer.name === hana.name
              ? hana.subscription[0].id
              : null;

      return {
        instructorId,
        customerId: customer.id,
        dateTime: classDate,
        status: seed.status,
        subscriptionId,
        rebookableUntil: new Date(
          classDate.getTime() + 1000 * 60 * 60 * 24 * 7,
        ),
        createdAt: new Date(classDate.getTime() - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(classDate.getTime() - 1000 * 60 * 60 * 24),
        classCode: `dashboard-trend-${index + 1}`,
        isFreeTrial: subscriptionId === null,
      };
    }),
  );

  await prisma.class.createMany({
    data: additionalClasses,
  });
}

async function insertChildren() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");
  const charlie = await getCustomer("Charlie");
  const emily = await getCustomer("Emily");
  const taro = await getCustomer("佐藤 太郎");
  const david = await getCustomer("David");
  const ethan = await getCustomer("Ethan");
  const olivia = await getCustomer("Olivia");
  const james = await getCustomer("James");
  const lucas = await getCustomer("Lucas");
  const henry = await getCustomer("Henry");
  const sophia = await getCustomer("Sophia");
  const benjamin = await getCustomer("Benjamin");
  const demoCustomers = await Promise.all(
    syntheticCustomerSeeds.map(({ name }) => getCustomer(name)),
  );

  await prisma.child.createMany({
    data: [
      {
        name: "Peppa",
        customerId: alice.id,
        birthdate: new Date("2018-05-15"),
        personalInfo:
          "Age: 6 years, English Level: Beginner. Enjoys playing with friends and loves jumping in muddy puddles.",
      },
      {
        name: "Suzy",
        customerId: alice.id,
        birthdate: new Date("2018-06-20"),
        personalInfo:
          "Age: 6 years, English Level: Beginner. Likes playing with dolls and has a pet sheep named Woolly.",
      },
      {
        name: "Emily",
        customerId: bob.id,
        birthdate: new Date("2017-11-02"),
        personalInfo:
          "Age: 7 years, English Level: Intermediate. Loves drawing and is very creative. Enjoys reading stories.",
      },
      {
        name: "Mio",
        customerId: charlie.id,
        birthdate: new Date("2017-02-19"),
        personalInfo:
          "Age: 8 years, English Level: Beginner. Loves animals and learning songs in English.",
      },
      {
        name: "Riku",
        customerId: emily.id,
        birthdate: new Date("2016-10-11"),
        personalInfo:
          "Age: 9 years, English Level: Intermediate. Enjoys science topics and speaking challenges.",
      },
      {
        name: "Hina",
        customerId: taro.id,
        birthdate: new Date("2018-07-03"),
        personalInfo:
          "Age: 7 years, English Level: Beginner. Likes roleplay and practicing greetings.",
      },
      {
        name: "Aoi",
        customerId: david.id,
        birthdate: new Date("2017-12-21"),
        personalInfo:
          "Age: 8 years, English Level: Beginner. Very active and enjoys game-based lessons.",
      },
      {
        name: "Leo",
        customerId: ethan.id,
        birthdate: new Date("2016-05-09"),
        personalInfo:
          "Age: 9 years, English Level: Intermediate. Interested in sports and vocabulary quizzes.",
      },
      {
        name: "Sora",
        customerId: olivia.id,
        birthdate: new Date("2019-01-14"),
        personalInfo:
          "Age: 7 years, English Level: Beginner. Enjoys picture books and short conversations.",
      },
      {
        name: "Mina",
        customerId: james.id,
        birthdate: new Date("2017-08-30"),
        personalInfo:
          "Age: 8 years, English Level: Intermediate. Likes discussing favorite foods and hobbies.",
      },
      {
        name: "Ren",
        customerId: lucas.id,
        birthdate: new Date("2018-03-08"),
        personalInfo:
          "Age: 8 years, English Level: Beginner. Enjoys phonics and speaking in complete sentences.",
      },
      {
        name: "Yuna",
        customerId: henry.id,
        birthdate: new Date("2016-09-17"),
        personalInfo:
          "Age: 9 years, English Level: Intermediate. Loves storytelling and question-answer practice.",
      },
      {
        name: "Kaito",
        customerId: sophia.id,
        birthdate: new Date("2017-04-26"),
        personalInfo:
          "Age: 8 years, English Level: Beginner. Enjoys songs and repeating useful classroom phrases.",
      },
      {
        name: "Nico",
        customerId: benjamin.id,
        birthdate: new Date("2018-11-05"),
        personalInfo:
          "Age: 7 years, English Level: Beginner. Likes introducing himself and talking about school.",
      },
      ...demoCustomers.flatMap((customer, index) => {
        const [firstChildName, secondChildName] =
          syntheticCustomerSeeds[index].childNames;
        const baseChild = {
          name: firstChildName,
          customerId: customer.id,
          birthdate: new Date(2017, (index + 1) % 12, 10),
          personalInfo:
            "Sample profile: beginner learner with varied interests for dashboard data.",
        };

        if (index % 2 === 0) {
          return [
            baseChild,
            {
              name: secondChildName,
              customerId: customer.id,
              birthdate: new Date(2019, (index + 4) % 12, 20),
              personalInfo:
                "Sample profile: sibling account to diversify child count in dashboard data.",
            },
          ];
        }

        return [baseChild];
      }),
    ],
  });
}

async function insertClassAttendance() {
  const customers = await prisma.customer.findMany();
  const classes = await prisma.class.findMany();
  const children = await prisma.child.findMany();

  // if (classes.length < 4 || children.length < 1) {
  //   throw new Error("Not enough classes or children found");
  // }

  await prisma.classAttendance.createMany({
    data: [
      { classId: classes[0].id, childrenId: children[0].id },
      { classId: classes[0].id, childrenId: children[1].id },
      { classId: classes[1].id, childrenId: children[0].id },
      { classId: classes[2].id, childrenId: children[0].id },
      { classId: classes[3].id, childrenId: children[0].id },
      { classId: classes[4].id, childrenId: children[0].id },
      { classId: classes[5].id, childrenId: children[0].id },
      { classId: classes[5].id, childrenId: children[1].id },
    ],
  });

  // if (classes.length < 17 || children.length < 2) {
  //   throw new Error("Not enough classes or children found");
  // }

  // const august8ClassIds = classes.slice(6, 17).map((c) => c.id);

  // if (august8ClassIds.length !== 11) {
  //   throw new Error("August 8th class IDs count mismatch");
  // }

  // const aliceChildren = children.filter(
  //   (child) => child.customerId === customers[0].id,
  // );

  // const attendanceData = august8ClassIds.flatMap((classId) =>
  //   aliceChildren.map((child) => ({
  //     classId,
  //     childrenId: child.id,
  //   })),
  // );

  // await prisma.classAttendance.createMany({
  //   data: attendanceData,
  // });
}

async function insertPlans() {
  await prisma.plan.createMany({
    data: [
      {
        name: "月3,180円プラン / 3,180 yen/month Plan",
        description: "2 classes per week",
        weeklyClassTimes: 2,
        englishBackground: 0,
      },
      {
        name: "月7,980円プラン / 7,980 yen/month Plan",
        description: "5 classes per week",
        weeklyClassTimes: 5,
        englishBackground: 0,
      },
      {
        name: "月5,980円プラン / 5,980 yen/month Plan",
        description: "1 classes per week",
        weeklyClassTimes: 1,
        englishBackground: 1,
      },
      {
        name: "月10,800円プラン / 10,800 yen/month Plan",
        description: "2 classes per week",
        weeklyClassTimes: 2,
        englishBackground: 2,
      },
    ],
  });
}

async function insertSubscriptions() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");
  const hana = await getCustomer("山田 花");
  const plan1 = await getPlan("月3,180円プラン / 3,180 yen/month Plan");
  const plan2 = await getPlan("月7,980円プラン / 7,980 yen/month Plan");
  const plan3 = await getPlan("月5,980円プラン / 5,980 yen/month Plan");
  const plan4 = await getPlan("月10,800円プラン / 10,800 yen/month Plan");

  await prisma.subscription.createMany({
    data: [
      {
        customerId: alice.id,
        planId: plan1.id,
        selectType: "https://...1",
        startAt: new Date("2024-08-01"),
        endAt: null,
      },
      {
        customerId: alice.id,
        planId: plan2.id,
        selectType: "https://...2",
        startAt: new Date("2025-01-01"),
        endAt: null,
      },
      {
        customerId: bob.id,
        planId: plan2.id,
        selectType: "https://...3",
        startAt: new Date("2024-06-01"),
        endAt: null,
      },
      {
        customerId: bob.id,
        planId: plan3.id,
        selectType: "https://...4",
        startAt: new Date("2024-06-01"),
        endAt: null,
      },
      {
        customerId: hana.id,
        planId: plan1.id,
        selectType: "https://...5",
        startAt: new Date("2025-04-04"),
        endAt: null,
      },
      {
        customerId: hana.id,
        planId: plan4.id,
        selectType: "https://...6",
        startAt: new Date("2025-04-04"),
        endAt: null,
      },
    ],
  });
}

async function insertRecurringClasses() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");
  const hana = await getCustomer("山田 花");
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");

  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: helen.id,
      startAt: "2025-02-03T07:30:00Z", // Monday 16:30 JST
      recurringClassAttendance: {
        create: [
          {
            childrenId: alice.children[0].id,
          },
          {
            childrenId: alice.children[1].id,
          },
        ],
      },
    },
  });

  // Additional recurring classes for Alice for comprehensive testing
  // Historical class with Elian (ended) - customer changed time but kept same instructor
  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: elian.id,
      startAt: "2024-12-02T07:00:00Z", // Monday 16:00 JST
      endAt: "2025-02-03T07:00:00Z", // Ends exactly when new class begins
      recurringClassAttendance: {
        create: [
          {
            childrenId: alice.children[0].id, // Peppa (same as new class)
          },
        ],
      },
    },
  });

  // New active class with Elian (continuation after time change)
  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: elian.id,
      startAt: "2025-02-03T07:00:00Z", // Monday 16:00 JST
      recurringClassAttendance: {
        create: [
          {
            childrenId: alice.children[0].id, // Peppa (same child as historical)
          },
        ],
      },
    },
  });

  await prisma.recurringClass.create({
    data: {
      subscriptionId: bob.subscription[0].id,
      instructorId: helen.id,
      startAt: "2025-02-05T07:00:00Z",
      recurringClassAttendance: {
        create: [
          {
            childrenId: bob.children[0].id,
          },
        ],
      },
    },
  });

  await prisma.recurringClass.create({
    data: {
      subscriptionId: hana.subscription[0].id,
      instructorId: helen.id,
      startAt: "2025-04-03T07:00:00Z",
    },
  });

  // await prisma.recurringClass.create({
  //   data: {
  //     subscriptionId: alice.subscription[0].id,
  //     instructorId: elian.id,
  //     startAt: "2024-07-03T02:00:00Z",
  //     endAt: "2024-08-01T00:00:00Z",
  //     recurringClassAttendance: {
  //       create: [
  //         {
  //           childrenId: alice.children[0].id,
  //         },
  //       ],
  //     },
  //   },
  // });
  // await prisma.recurringClass.create({
  //   data: {
  //     subscriptionId: alice.subscription[0].id,
  //     instructorId: elian.id,
  //     startAt: "2024-07-18T03:00:00Z",
  //     endAt: "2024-09-01T00:00:00Z",
  //     recurringClassAttendance: {
  //       create: [
  //         {
  //           childrenId: alice.children[0].id,
  //         },
  //         {
  //           childrenId: alice.children[1].id,
  //         },
  //       ],
  //     },
  //   },
  // });
  // await prisma.recurringClass.create({
  //   data: {
  //     subscriptionId: alice.subscription[0].id,
  //     instructorId: elian.id,
  //     startAt: "2024-08-23T01:00:00Z",
  //     endAt: "2024-10-01T00:00:00Z",
  //     recurringClassAttendance: {
  //       create: [
  //         {
  //           childrenId: alice.children[0].id,
  //         },
  //         {
  //           childrenId: alice.children[1].id,
  //         },
  //       ],
  //     },
  //   },
  // });
  // await prisma.recurringClass.create({
  //   data: {
  //     subscriptionId: alice.subscription[0].id,
  //     instructorId: elian.id,
  //     startAt: "2024-09-02T04:00:00Z",
  //     recurringClassAttendance: {
  //       create: [
  //         {
  //           childrenId: alice.children[0].id,
  //         },
  //       ],
  //     },
  //   },
  // });
}

async function insertInstructorSchedules() {
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");
  const niki = await getInstructor("Niki");
  const emi = await getInstructor("Emi");

  // Helen's first schedule (historical - 2024-06-01 to 2024-07-31)
  const helenSchedule1 = await prisma.instructorSchedule.create({
    data: {
      instructorId: helen.id,
      effectiveFrom: new Date("2024-06-01"),
      effectiveTo: new Date("2024-08-01"),
      timezone: "Asia/Tokyo",
    },
  });

  // Helen's first schedule slots
  await prisma.instructorSlot.createMany({
    data: [
      // Monday (1)
      {
        scheduleId: helenSchedule1.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 1,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      // Wednesday
      {
        scheduleId: helenSchedule1.id,
        weekday: 3,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 3,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 3,
        startTime: new Date("1970-01-01T19:00:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 3,
        startTime: new Date("1970-01-01T19:30:00Z"),
      },
      // Friday (5)
      {
        scheduleId: helenSchedule1.id,
        weekday: 5,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 5,
        startTime: new Date("1970-01-01T17:30:00Z"),
      },
      {
        scheduleId: helenSchedule1.id,
        weekday: 5,
        startTime: new Date("1970-01-01T18:00:00Z"),
      },
    ],
  });

  // Helen's second schedule
  const helenSchedule2 = await prisma.instructorSchedule.create({
    data: {
      instructorId: helen.id,
      effectiveFrom: new Date("2024-08-01"),
      effectiveTo: new Date("2025-01-01"),
      timezone: "Asia/Tokyo",
    },
  });

  // Helen's second schedule slots
  await prisma.instructorSlot.createMany({
    data: [
      // Monday (1)
      {
        scheduleId: helenSchedule2.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 1,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 1,
        startTime: new Date("1970-01-01T17:30:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 1,
        startTime: new Date("1970-01-01T18:00:00Z"),
      },
      // Wednesday (3)
      {
        scheduleId: helenSchedule2.id,
        weekday: 3,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 3,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 3,
        startTime: new Date("1970-01-01T18:30:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 3,
        startTime: new Date("1970-01-01T19:00:00Z"),
      },
      // Thursday (4)
      {
        scheduleId: helenSchedule2.id,
        weekday: 4,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 4,
        startTime: new Date("1970-01-01T17:30:00Z"),
      },
      {
        scheduleId: helenSchedule2.id,
        weekday: 4,
        startTime: new Date("1970-01-01T18:00:00Z"),
      },
    ],
  });

  // Helen's current schedule
  const helenSchedule3 = await prisma.instructorSchedule.create({
    data: {
      instructorId: helen.id,
      effectiveFrom: new Date("2025-01-01"),
      effectiveTo: null, // Current schedule
      timezone: "Asia/Tokyo",
    },
  });

  // Helen's current (third) schedule slots
  await prisma.instructorSlot.createMany({
    data: [
      // Monday (1)
      {
        scheduleId: helenSchedule3.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 1,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 1,
        startTime: new Date("1970-01-01T17:30:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 1,
        startTime: new Date("1970-01-01T18:00:00Z"),
      },
      // Thursday (4)
      {
        scheduleId: helenSchedule3.id,
        weekday: 4,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 4,
        startTime: new Date("1970-01-01T17:30:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 4,
        startTime: new Date("1970-01-01T18:00:00Z"),
      },
      // Friday (5)
      {
        scheduleId: helenSchedule3.id,
        weekday: 5,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 5,
        startTime: new Date("1970-01-01T17:00:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 5,
        startTime: new Date("1970-01-01T18:00:00Z"),
      },
      {
        scheduleId: helenSchedule3.id,
        weekday: 5,
        startTime: new Date("1970-01-01T19:00:00Z"),
      },
    ],
  });

  // Elian's current schedule
  const elianSchedule = await prisma.instructorSchedule.create({
    data: {
      instructorId: elian.id,
      effectiveFrom: new Date("2024-08-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    },
  });

  // Elian's weekly slots
  await prisma.instructorSlot.createMany({
    data: [
      // Monday (1)
      {
        scheduleId: elianSchedule.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: elianSchedule.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      // Tuesday (2)
      {
        scheduleId: elianSchedule.id,
        weekday: 2,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      // Wednesday (3)
      {
        scheduleId: elianSchedule.id,
        weekday: 3,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
    ],
  });

  // Niki's current schedule
  const nikiSchedule = await prisma.instructorSchedule.create({
    data: {
      instructorId: niki.id,
      effectiveFrom: new Date("2024-09-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    },
  });

  await prisma.instructorSlot.createMany({
    data: [
      // Monday (1)
      {
        scheduleId: nikiSchedule.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: nikiSchedule.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      // Tuesday (2)
      {
        scheduleId: nikiSchedule.id,
        weekday: 2,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      // Wednesday (3)
      {
        scheduleId: nikiSchedule.id,
        weekday: 3,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
    ],
  });

  // Emi's current schedule
  const emiSchedule = await prisma.instructorSchedule.create({
    data: {
      instructorId: emi.id,
      effectiveFrom: new Date("2024-09-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    },
  });

  await prisma.instructorSlot.createMany({
    data: [
      // Monday (1)
      {
        scheduleId: emiSchedule.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      {
        scheduleId: emiSchedule.id,
        weekday: 1,
        startTime: new Date("1970-01-01T16:30:00Z"),
      },
      // Tuesday (2)
      {
        scheduleId: emiSchedule.id,
        weekday: 2,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
      // Wednesday (3)
      {
        scheduleId: emiSchedule.id,
        weekday: 3,
        startTime: new Date("1970-01-01T16:00:00Z"),
      },
    ],
  });
}

async function insertInstructorAbsences() {
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");
  await prisma.instructorAbsence.createMany({
    data: [
      {
        instructorId: helen.id,
        absentAt: new Date("2025-02-14T10:00:00Z"),
      },
      {
        instructorId: helen.id,
        absentAt: new Date("2025-03-21T14:00:00Z"),
      },
      {
        instructorId: elian.id,
        absentAt: new Date("2025-02-28T09:00:00Z"),
      },
      {
        instructorId: helen.id,
        absentAt: new Date("2025-07-28T07:00:00Z"),
      },
      {
        instructorId: helen.id,
        absentAt: new Date("2025-07-28T07:30:00Z"),
      },
    ],
  });
}

async function insertEvents() {
  await prisma.event.createMany({
    data: [
      {
        name: "通常授業日 / Regular Class Day",
        color: "#FFFFFF",
      },
      {
        name: "お休み / No Class",
        color: "#FAD7CD",
      },
      {
        name: "お休み振替対象日 / No Class (Rebookable)",
        color: "#FF0000",
      },
      {
        name: "テーマクラスウィーク / Theme Class Week",
        color: "#FFFF00",
      },
    ],
  });
}

async function insertSchedules() {
  const [noClassEvent, noClassRebookableEvent, themeClassWeekEvent] =
    await Promise.all([
      prisma.event.findFirst({
        where: { name: "お休み / No Class" },
        select: { id: true },
      }),
      prisma.event.findFirst({
        where: { name: "お休み振替対象日 / No Class (Rebookable)" },
        select: { id: true },
      }),
      prisma.event.findFirst({
        where: { name: "テーマクラスウィーク / Theme Class Week" },
        select: { id: true },
      }),
    ]);

  if (!noClassEvent || !noClassRebookableEvent || !themeClassWeekEvent) {
    throw new Error("Required events for business schedules were not found");
  }

  const legacyEventIdMap: Record<number, number> = {
    2: noClassEvent.id,
    3: noClassRebookableEvent.id,
    4: themeClassWeekEvent.id,
  };

  await prisma.schedule.createMany({
    data: [
      {
        date: new Date("2025-01-01T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-02T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-03T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-04T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-05T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-12T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-13T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-01-14T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-01-15T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-01-16T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-01-17T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-01-18T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-01-19T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-01-26T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-02-02T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-02-09T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-02-10T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-02-11T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-02-12T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-02-13T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-02-14T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-02-15T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-02-16T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-02-23T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-03-02T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-03-09T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-03-10T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-03-11T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-03-12T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-03-13T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-03-14T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-03-15T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-03-16T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-03-23T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-03-30T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-03-31T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-01T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-02T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-06T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-13T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-14T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-04-15T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-04-16T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-04-17T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-04-18T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-04-19T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-04-20T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-27T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-29T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-04-30T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-01T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-02T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-03T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-04T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-05T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-06T00:00:00Z"),
        eventId: 3,
      },
      {
        date: new Date("2025-05-11T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-12T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-05-13T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-05-14T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-05-15T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-05-16T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-05-17T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-05-18T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-05-25T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-06-01T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-06-08T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-06-15T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-06-16T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-06-17T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-06-18T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-06-19T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-06-20T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-06-21T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-06-22T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-06-29T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-07-06T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-07-13T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-07-14T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-07-15T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-07-16T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-07-17T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-07-18T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-07-19T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-07-20T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-07-27T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-03T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-04T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-08-05T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-08-06T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-08-07T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-08-08T00:00:00Z"),
        eventId: 4,
      },

      {
        date: new Date("2025-08-09T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-08-10T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-11T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-12T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-13T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-14T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-15T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-16T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-17T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-24T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-08-31T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-09-07T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-09-14T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-09-15T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-09-16T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-09-17T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-09-18T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-09-19T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-09-20T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-09-21T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-09-28T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-10-05T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-10-12T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-10-19T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-10-20T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-10-21T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-10-22T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-10-23T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-10-24T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-10-25T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-10-26T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-10-30T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-10-31T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-11-01T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-11-02T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-11-09T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-11-16T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-11-17T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-11-18T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-11-19T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-11-20T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-11-21T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-11-22T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-11-23T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-11-30T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-07T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-14T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-17T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-12-18T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-12-19T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-12-20T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-12-21T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-22T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-12-23T00:00:00Z"),
        eventId: 4,
      },
      {
        date: new Date("2025-12-24T00:00:00Z"),
        eventId: 3,
      },
      {
        date: new Date("2025-12-25T00:00:00Z"),
        eventId: 3,
      },
      {
        date: new Date("2025-12-28T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-29T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-30T00:00:00Z"),
        eventId: 2,
      },
      {
        date: new Date("2025-12-31T00:00:00Z"),
        eventId: 2,
      },
    ].map((schedule) => ({
      ...schedule,
      eventId: legacyEventIdMap[schedule.eventId],
    })),
  });
}

async function insertSystemStatus() {
  await prisma.systemStatus.create({
    data: {
      status: "Running",
    },
  });
}

async function insertMessageBoardPosts() {
  await prisma.messageBoardPost.createMany({
    data: [
      {
        target: "customers",
        body: "Spring campaign starts next week. Please check your registered class times.",
        createdAt: new Date("2026-03-01T09:00:00.000Z"),
      },
      {
        target: "instructors",
        body: "Please submit your March lesson reflections by Friday 18:00 JST.",
        createdAt: new Date("2026-03-02T09:00:00.000Z"),
      },
      {
        target: "both",
        body: "The system will undergo maintenance on March 15 from 02:00 to 04:00 JST.",
        createdAt: new Date("2026-03-03T09:00:00.000Z"),
      },
      {
        target: "customers",
        body: "Golden Week booking slots will be released early on April 1.",
        createdAt: new Date("2026-03-04T09:00:00.000Z"),
      },
      {
        target: "instructors",
        body: "Please confirm your available schedule for next month by end of day Thursday.",
        createdAt: new Date("2026-03-05T09:00:00.000Z"),
      },
      {
        target: "both",
        body: "A new Message Board toggle feature is now available on calendar pages.",
        createdAt: new Date("2026-03-06T09:00:00.000Z"),
      },
      {
        target: "customers",
        body: "Need help with rebooking? Contact support and include the class code.",
        createdAt: new Date("2026-03-07T09:00:00.000Z"),
      },
      {
        target: "instructors",
        body: "Reminder: update your profile self-introduction for the new school year.",
        createdAt: new Date("2026-03-08T09:00:00.000Z"),
      },
      {
        target: "both",
        body: "Thank you for joining AaasoBo! Let's keep making English fun together.",
        createdAt: new Date("2026-03-09T09:00:00.000Z"),
      },
      {
        target: "both",
        body: "Dashboard refresh speed was improved. Please report any loading issues.",
        createdAt: new Date("2026-03-10T09:00:00.000Z"),
      },
    ],
  });
}

async function getCustomer(name: string) {
  const customer = await prisma.customer.findFirst({
    where: { name },
    include: { children: true, subscription: true },
  });
  if (!customer) {
    throw new Error(`Customer ${name} not found`);
  }
  // Include only active subscriptions.
  customer.subscription = customer.subscription.filter(
    ({ endAt }) => endAt === null,
  );
  return customer;
}

async function getInstructor(nickname: "Helen" | "Elian" | "Niki" | "Emi") {
  const instructor = await prisma.instructor.findFirst({ where: { nickname } });
  if (!instructor) {
    throw new Error(`Instructor ${nickname} not found`);
  }
  return instructor;
}

async function getPlan(
  name:
    | "月3,180円プラン / 3,180 yen/month Plan"
    | "月7,980円プラン / 7,980 yen/month Plan"
    | "月5,980円プラン / 5,980 yen/month Plan"
    | "月10,800円プラン / 10,800 yen/month Plan",
) {
  const plan = await prisma.plan.findFirst({ where: { name } });
  if (!plan) {
    throw new Error(`Plan ${name} not found`);
  }
  return plan;
}

async function deleteAll(table: Uncapitalize<Prisma.ModelName>) {
  switch (table) {
    case "admin":
      await prisma.admin.deleteMany();
      return;
    case "child":
      await prisma.child.deleteMany();
      return;
    case "class":
      await prisma.class.deleteMany();
      return;
    case "classAttendance":
      await prisma.classAttendance.deleteMany();
      return;
    case "customer":
      await prisma.customer.deleteMany();
      return;
    case "event":
      await prisma.event.deleteMany();
      return;
    case "messageBoardPost":
      await prisma.messageBoardPost.deleteMany();
      return;
    case "instructor":
      await prisma.instructor.deleteMany();
      return;
    case "instructorAbsence":
      await prisma.instructorAbsence.deleteMany();
      return;
    case "instructorFee":
      await prisma.instructorFee.deleteMany();
      return;
    case "instructorTagAssignment":
      await prisma.instructorTagAssignment.deleteMany();
      return;
    case "instructorTagCatalog":
      await prisma.instructorTagCatalog.deleteMany();
      return;
    case "instructorSchedule":
      await prisma.instructorSchedule.deleteMany();
      return;
    case "instructorSlot":
      await prisma.instructorSlot.deleteMany();
      return;
    case "plan":
      await prisma.plan.deleteMany();
      return;
    case "recurringClass":
      await prisma.recurringClass.deleteMany();
      return;
    case "recurringClassAttendance":
      await prisma.recurringClassAttendance.deleteMany();
      return;
    case "schedule":
      await prisma.schedule.deleteMany();
      return;
    case "subscription":
      await prisma.subscription.deleteMany();
      return;
    case "systemStatus":
      await prisma.systemStatus.deleteMany();
      return;
    default:
      throw new Error(`Unsupported table for seed cleanup: ${table}`);
  }
}

async function main() {
  {
    // Dependent on the below
    await deleteAll("classAttendance");
    await deleteAll("recurringClassAttendance");

    // Dependent on the below
    await deleteAll("class");
    await deleteAll("recurringClass");
    await deleteAll("instructorSlot");
    await deleteAll("instructorTagAssignment");

    // Dependent on the below
    await deleteAll("child");
    await deleteAll("subscription");
    await deleteAll("instructorSchedule");
    await deleteAll("instructorFee");
    await deleteAll("schedule");
    await deleteAll("instructorAbsence");

    // Independent
    await deleteAll("admin");
    await deleteAll("instructor");
    await deleteAll("instructorTagCatalog");
    await deleteAll("customer");
    await deleteAll("plan");
    await deleteAll("event");
    await deleteAll("messageBoardPost");
  }

  {
    // Independent
    await insertPlans();
    await insertCustomers();
    await insertInstructors();
    await insertInstructorTagCatalogs();
    await insertAdmins();
    await insertEvents();
    await insertSystemStatus();
    await insertMessageBoardPosts();

    // Dependant on the above
    await insertInstructorTagAssignments();
    await insertInstructorFees();
    await insertInstructorSchedules();
    await insertSubscriptions();
    await insertChildren();
    await insertSchedules();

    // Dependant on the above
    await insertRecurringClasses();
    await insertClasses();

    // Dependant on the above
    await insertInstructorAbsences();

    // Dependant on the above
    await insertClassAttendance();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
