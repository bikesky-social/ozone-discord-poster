const { Webhook, MessageBuilder } = require("discord-webhook-node");
import { AtpAgent } from "@atproto/api";
import { sleep } from "bun";
import type { ModEventView } from "@atproto/api/dist/client/types/tools/ozone/moderation/defs";

async function ozoneDiscordPoster() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL as string;
  const bskyLabelerUsername = process.env.BSKY_LABELER_USERNAME as string;
  const bskyLabelerPassword = process.env.BSKY_LABELER_PASSWORD as string;
  const bskyLabelerDid = process.env.BSKY_LABELER_DID as string;
  const pollingSeconds = Number(process.env.POLLING_SECONDS);
  const ozoneUrl = process.env.OZONE_URL as string;

  const webhook = webhookUrl ? new Webhook(webhookUrl) : undefined;

  const agent = new AtpAgent({ service: "https://bsky.social" });

  try {
    await agent.login({
      identifier: bskyLabelerUsername,
      password: bskyLabelerPassword,
    });
    console.log(`authenticated labeler account`);
  } catch (error) {
    console.log(`failed to log into labeler: ${JSON.stringify(error)}`);
    return;
  }

  let first = true;
  let lastId = 0;

  async function postWebhook(event: ModEventView, isReport: boolean) {
    console.log(`posting: ${JSON.stringify(event)}`);

    const message = new MessageBuilder();

    const creatorProfile = await agent.getProfile({ actor: event.createdBy });

    message.setAuthor(
      event.creatorHandle,
      creatorProfile.data.avatar,
      `https://bsky.app/profile/${event.createdBy}`
    );

    message.setURL(
      `${ozoneUrl}/reports?quickOpen=${encodeURIComponent(
        event.subject.uri ?? event.subject.did ?? ""
      )}`
    );

    if (event.subject.$type === "com.atproto.admin.defs#repoRef") {
      // account
      message.setColor("#9B59B6");
      const subjectProfile = await agent.getProfile({
        actor: event.subject.did,
      });
      message.setTitle(`account: ${event.subjectHandle}`);
      message.addField(
        "Account bio:",
        subjectProfile.data.description ? subjectProfile.data.description : ""
      );
    } else if (event.subject.$type === "com.atproto.repo.strongRef") {
      if (event.subject.uri.includes("app.bsky.feed.post")) {
        // post
        message.setColor("#3498DB");
        message.setTitle(`post by ${event.subjectHandle}`);
        const posts = await agent.getPosts({ uris: [event.subject.uri] });
        if (posts.data.posts.length > 0) {
          message.addField(
            "Post:",
            posts.data.posts[0].record.text
              ? posts.data.posts[0].record.text
              : ""
          );
        }
      } else if (event.subject.uri.includes("app.bsky.graph.list")) {
        // list
        message.setColor("#2ECC71");
        message.setTitle(`list by ${event.subjectHandle}`);
      }
    }

    message.addField(
      "Comment:",
      event.event.comment ? event.event.comment : ""
    );
    message.setTimestamp();

    webhook.send(message);
  }

  Bun.serve({
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/health") return new Response("OK");
      return new Response("404!");
    },
  });

  console.log("server is listening");

  while (true) {
    const response = await agent.tools.ozone.moderation.queryEvents(
      {},
      {
        headers: {
          "atproto-proxy": `${bskyLabelerDid}#atproto_labeler`,
        },
      }
    );

    const events = response.data.events;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.event.$type !== "tools.ozone.moderation.defs#modEventReport")
        continue;
      if (first || lastId == event.id) {
        first = false;
        lastId = event.id;
        break;
      }
      lastId = event.id;
      await postWebhook(event, true);
      break;
    }

    await sleep(pollingSeconds * 1000);
  }
}

await ozoneDiscordPoster();
