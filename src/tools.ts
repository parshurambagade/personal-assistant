import { tool } from "@langchain/core/tools";
import { google } from "googleapis";
import * as z from "zod";

const eventSchema = z.object({
  summary: z.string().describe("Title of the event"),
  start: z.object({
    dateTime: z.string().describe("A start date time string for an event"),
    timeZone: z
      .string()
      .describe("A IANA timezone string in which event needs to be start."),
  }),
  end: z.object({
    dateTime: z.string().describe("An end date time string for an event"),
    timeZone: z
      .string()
      .describe("A IANA timezone string in which event needs to be end."),
  }),
  attendees: z.array(
    z.object({
      email: z.string().describe("The email of the attendee"),
      displayName: z.string().describe("The name of the attendee"),
    }),
  ),
});

type EventData = z.infer<typeof eventSchema>;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);
const tokens = {
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
};
oauth2Client.setCredentials(tokens);

// Create a new Calendar API client.
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export const createEvent = tool(
  async (eventData) => {
    console.log("Creating event...");
    console.log("Event Data: ", eventData);

    const { start, end, attendees, summary } = eventData as EventData;
    const response = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all",
      conferenceDataVersion: 1,
      requestBody: {
        start: start,
        end: end,
        attendees: attendees,
        conferenceData: {
          createRequest: {
            conferenceSolutionKey: "hangoutsMeet",
            requestId: crypto.randomUUID(),
          },
        },
        summary: summary,
      },
    });
    console.log("Response: ", response);

    return "Meeting has been created";
  },
  {
    name: "create_event",
    description: "Create a new calendar event.",
    schema: eventSchema,
  },
);

export const getEvents = tool(
  async (params) => {
    console.log("Calling calendar events tool");

    const { timeMin, timeMax, q } = params;
    console.log("TimeMin: ", timeMin);
    console.log("TimeMax: ", timeMax);
    console.log("Q: ", q);

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
        return "No upcoming events found.";
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
          "A minimum time (From time) in string to fetch events in the timeline",
        ),
      timeMax: z
        .string()
        .describe(
          "A maximum time (To time) in string to fetch events in the timeline",
        ),
    }),
  },
);

export const deleteEvent = tool(
  () => {
    console.log("Deleting event...");
    return "Event deleted.";
  },
  {
    name: "delete_event",
    description: "Delete a calendar event.",
    schema: z.object({}),
  },
);
