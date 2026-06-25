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
import { AIMessage, HumanMessage } from "@langchain/core/messages";

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

/**
 * DEFINE THE STATE GRAPH
 */
const graph = new StateGraph(MessagesAnnotation)
  .addNode("llmCall", assistant)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addEdge("toolNode", "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .compile();

async function main() {
  const result = await graph.invoke({
    messages: [new HumanMessage("Hi, when is my birthday?")],
  });
  console.log("Assistant: ", result.messages.at(-1)?.content);
}

main();
