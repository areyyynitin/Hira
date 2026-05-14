import express from  "express";
import cors from "cors";
import { createServer } from "http";
import { workspaceRouter } from "./routes/workspace";
import { taskRouter } from "./routes/task";
import { initSocket } from "./socket";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/workspace" , workspaceRouter)
app.use("/task" , taskRouter)

initSocket(httpServer);

httpServer.listen(3001 , () => {
    console.log("HTTP Backend is running on port 3001");
})