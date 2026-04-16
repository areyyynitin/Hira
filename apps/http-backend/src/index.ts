import express from  "express";
import { requireUser } from "./middleware";
import cors from "cors";
import { prisma } from "@repo/db/client";
import { workspaceRouter } from "./routes/workspace";
import { taskRouter } from "./routes/task";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/workspace" , workspaceRouter)
app.use("/task" , taskRouter)


app.listen(3001 , () => {
    console.log("HTTP Backend is running on port 3001");
})