import { tool } from "@langchain/core/tools";
import { google } from "googleapis";
import * as z from "zod";
import tokens from "../tokens.json";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);
oauth2Client.setCredentials(tokens);
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
  async (params) => {
    console.log("Calling calendar events tool");

    const { timeMin, timeMax, q } = params;
    console.log("TimeMin: ", timeMin);
    console.log("TimeMax: ", timeMax);
    console.log("Q: ", q);
    // Create a new Calendar API client.
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    try {
      // Get the list of events.
      const result = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        q,
      });
      const events = result.data.items;

      if (!events || events.length === 0) {
        console.log("No upcoming events found.");
        return [];
      }

      const results = events.map((event) => {
        return {
          kind: event?.kind,
          status: event?.status,
          summary: event?.summary,
          creator: event?.creator,
          organizer: event?.organizer,
          start: event?.start,
          end: event?.end,
          eventType: event?.eventType,
          hangoutLink: event?.hangoutLink,
          attendees: event?.attendees,
        };
      });
      console.log("Events: ", results);
      return JSON.stringify(results);
    } catch (error) {
      console.error(error);
    }

    return "Could not fetch calendar events, try again!";
  },
  {
    name: "get_events",
    description: "Get the calendar events.",
    schema: z.object({
      q: z.string().describe("A query to get the events from calendar"),
      timeMin: z
        .string()
        .describe(
          "A minimum time (From time) in UTC to fetch events in the timeline",
        ),
      timeMax: z
        .string()
        .describe(
          "A maximum time (To time) in UTC to fetch events in the timeline",
        ),
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
