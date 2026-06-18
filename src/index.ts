import { ChatGroq } from "@langchain/groq";
import { createEvent, deleteEvent, getEvents } from "./tools";

const tools = [createEvent, getEvents, deleteEvent];

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);
