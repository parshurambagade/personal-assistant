import { tool } from "@langchain/core/tools";
import * as z from "zod";

export const createEvent = tool(
  () => {
    console.log("Creating event...");
    return;
  },
  {
    name: "create_event",
    description: "Create a new calendar event.",
    schema: z.object({}),
  },
);

export const getEvents = tool(
  () => {
    console.log("Getting events...");
    return;
  },
  {
    name: "get_events",
    description: "Get the calendar events.",
    schema: z.object({}),
  },
);

export const deleteEvent = tool(
  () => {
    console.log("Deleting event...");
    return;
  },
  {
    name: "delete_event",
    description: "Delete a calendar event.",
    schema: z.object({}),
  },
);
