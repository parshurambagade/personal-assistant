import { ChatGroq } from "@langchain/groq";
import { createEvent, deleteEvent, getEvents } from "./tools";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
  type ConditionalEdgeRouter,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import readline from "node:readline/promises";
import { MemorySaver } from "@langchain/langgraph";

const tools = [createEvent, getEvents, deleteEvent];
const toolNode = new ToolNode(tools);

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);

/**
 * DEFINE MODEL NODE
 */
const assistant = async (state: typeof MessagesAnnotation.State) => {
  const response = await model.invoke([...state.messages]);
  return {
    messages: [response],
  };
};

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const lastMessage = state.messages.at(-1);

  // Check if it's an AIMessage before accessing tool_calls
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }

  // If the LLM makes a tool call, then perform an action
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  // Otherwise, we stop (reply to the user)
  return END;
};

const checkpointer = new MemorySaver();

/**
 * DEFINE THE STATE GRAPH
 */
const graph = new StateGraph(MessagesAnnotation)
  .addNode("llmCall", assistant)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addEdge("toolNode", "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .compile({ checkpointer });

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const currentDateTime = new Date().toLocaleString();
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const SYSTEM_PROMPT = `
  You are a helpful personal assistant, your name is Kunal and your task is to help user and answer user queries.
  You have access to following tools: 
  1. createEvent - use this to create new event
  2. getEvents - use this to get the events
  3. deleteEvent - use this to delete a event

  If you dont know the answer, say I dont know the answer. 

  Current DateTime: ${currentDateTime},
  Current TimeZone: ${currentTimeZone}
  `;
  while (true) {
    const query = await rl.question("You: ");
    if (query === "/bye") {
      break;
    }

    const result = await graph.invoke(
      {
        messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(query)],
      },
      { configurable: { thread_id: "1" } },
    );
    console.log("Assistant: ", result.messages.at(-1)?.content);
  }
  rl.close();
}

main();
