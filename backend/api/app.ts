import { server } from "../src/server";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
