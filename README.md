# Ozone Discord Poster

A Typescript web service that sends Ozone reports to a Discord webhook. The server queries your Bluesky labeler's reports at an interval that you choose and sends any new reports about accounts, posts and lists to a Discord webhook.

Finally - notifications for your Ozone reports!

## Configuration

The web service is configured using environment variables. The expected environment variables are:

```sh
# the Discord webhook for the channel to post to
DISCORD_WEBHOOK_URL="<replace with the Discord webhook url>"

# the Bluesky labeler's handle
BSKY_LABELER_USERNAME="<replace with username>"

# the Bluesky labeler's password
BSKY_LABELER_PASSWORD="<replace with password>"

# the DID of the Bluesky labeler
BSKY_LABELER_DID="<replace with the Bluesky labeler's did>"

# the URL to the labeler's Ozone server
OZONE_URL="<replace with Ozone server URL eg. https://ozone.example.com>"

# how many seconds to wait before checking for more reports 
POLLING_SECONDS=60
```

## Deploying

### Render

The easiest way to deploy this service is to use the "Deploy to Render" button below. Using this button will create a new service on Render which you can configure. It will run on Render's Free service tier.

<a href="https://render.com/deploy?repo=https://github.com/bikesky-social/ozone-discord-poster">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
</a>

### Docker

This service is available on Docker Hub at [bikesky/ozone-discord-poster](https://hub.docker.com/r/bikesky/ozone-discord-poster). You can run it with the following command:

```sh
docker run -p 3000:3000 --env-file .env bikesky/ozone-discord-poster
```

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun index.ts
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
