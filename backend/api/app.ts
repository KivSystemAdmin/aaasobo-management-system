import { server } from "../src/server";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;

if (!process.env.VERCEL) {
  server.listen(PORT, () => console.log(`[Server]: http://localhost:${PORT}`));
}

export default server;
