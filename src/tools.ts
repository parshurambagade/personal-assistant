import { tool } from "@langchain/core/tools";
import * as z from "zod";

export const createEvent = tool(
  () => {
    console.log("Creating event...");
    return "Meeting has been created";
  },
  {
    name: "create_event",
    description: "Create a new calendar event.",
    schema: z.object({
      query: z
        .string()
        .describe("A query to create a event in google calendar."),
    }),
  },
);

export const getEvents = tool(
  () => {
    console.log("Getting events...");
    return JSON.stringify([
      {
        name: "Meeting with Yash",
        date: "19-06-2026",
        time: "06:00PM",
        venue: "Google Meet",
      },
    ]);
  },
  {
    name: "get_events",
    description: "Get the calendar events.",
    schema: z.object({
      query: z.string().describe("A query to get the events from calendar"),
    }),
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
