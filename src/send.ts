import {
  Client,
  Guild,
  Message,
  TextChannel,
  RichEmbed,
  MessageReaction,
  User
} from "discord.js";
const serverInfo = require("./server_info.json");

/* Build an embed from the given information, intended to use as a check
 *  before sending a message.
 */
function buildTestEmbed(msg: string, dest: string) {
  return new RichEmbed()
    .setColor("#4AC55E")
    .attachFile("./resources/acm-logo-thicc.png")
    .setTitle("ACM Announcement - DOUBLE CHECK")
    .setAuthor("Super Intelligent Gnome")
    .setThumbnail("https://cdn.mstacm.org/static/acm.png")
    .addField("[at_everyone][announcement]", msg)
    .addField("Destination:", dest)
    .addField(
      "What will be removed:",
      "'- DOUBLE CHECK'\nThe Destination Field\n[at_everyone] will become @"
    )
    .addField(
      "Controls",
      "You need at least 3 👌 to send the message, besides the creator, otherwise it will timeout and will not be sent. You can react with 🚫 to cancel early."
    )
    .setTimestamp()
    .setFooter(
      "If you have any questions, talk to Gavin Lewis.",
      "https://cdn.mstacm.org/static/acm.png"
    );

  if (discordMessage.attachments.size > 0) {
    msg_embed.setImage(discordMessage.attachments.array()[0].url);
  }
  return msg_embed;
}

// Generate an embed from the msg and send it
async function sendEmbed(msg: string, dest: string, client: Client) {
  let msg_embed: RichEmbed = new RichEmbed()
    .setColor("#4AC55E")
    .setTitle(title)
    .attachFile("https://cdn.mstacm.org/static/acm.png")
    .setAuthor("ACM Announcement")
    .setThumbnail("https://cdn.mstacm.org/static/acm.png")

    .addField("[@everyone][announcement]", msg);

  if (discordMessage.attachments.size > 0) {
    msg_embed.attachFile(discordMessage.attachments.array()[0].url);
  }
  sendToChannel(dest, msg_embed, client);
}

/* Sends a quick and dirty double check message, need a check in the main loop to see
 *  if the embed gets the proper react to send
 */
export async function sendCheckup(
  discord_message: Message,
  targets: string,
  message: string,
  client: Client
) {
  // Embeds can only be so long
  if (toSend.length >= 1024) {
    discord_message.channel.send("Message must be less than 1024 characters.");
    return;
  }
  if (title.length >= 256) {
    discord_message.channel.send("Title must be less than 256 characters.");
    return;
  }
  // Should only ever be a Message, not a Message array because we only send one message
  const checkupMsg: Message | Message[] = await discord_message.channel.send(
    buildTestEmbed(message, targets)
  );

  const NUM_TO_APPROVE = 2;
  const NUM_TO_DISAPPROVE = 1;
  const YUP_EMOJI = "👌";
  const NOPE_EMOJI = "🚫";

  const filter = (reaction: MessageReaction, user: User) => {
    // Only other users can approve, but the creator can deny
    return (
      (reaction.emoji.name === YUP_EMOJI &&
        user.id !== discord_message.author.id) ||
      reaction.emoji.name === NOPE_EMOJI
    );
  };

  if (checkupMsg instanceof Message) {
    // If we have a single message
    await checkupMsg.react(YUP_EMOJI).then(() => checkupMsg.react(NOPE_EMOJI));
  } else {
    await checkupMsg[0]
      .react(YUP_EMOJI)
      .then(() => checkupMsg[0].react(NOPE_EMOJI));
  }

  if (checkupMsg instanceof Message) {
    const collector = checkupMsg.createReactionCollector(filter, {
      time: 150000
    });

    collector.on("collect", (reaction, reactionCollector) => {
      if (reactionCollector.collected.get(NOPE_EMOJI)) {
        // If we collected a Nope
        const bad_count: number = reactionCollector.collected.get(NOPE_EMOJI)
          .count;
        if (bad_count >= 2) {
          // Someone said no
          collector.stop();
        }
      }
      if (reactionCollector.collected.get(YUP_EMOJI)) {
        // If we collected a yup
        const good_count: number = reactionCollector.collected.get(YUP_EMOJI)
          .count;
        if (good_count >= NUM_TO_APPROVE + 1) {
          // We are ready to send
          checkupMsg.channel.send("Enough people have confirmed, sending...");
          send_to_channel(targets, "@everyone", client);
          send_embed(toSend, title, targets, client, discord_message);
          collector.stop(); // Keeps from multi sending, calls on(end()...
        } else {
          checkupMsg.channel.send(
            "Need " +
              (NUM_TO_APPROVE - good_count + 1).toString() +
              " more to send"
          );
        }
      }
    });

    collector.on("end", collected => {
      if (collected.get(NOPE_EMOJI)) {
        // Collected a nope
        if (collected.get(NOPE_EMOJI).count >= NUM_TO_DISAPPROVE + 1) {
          checkupMsg.channel.send("Someone said no, cancelling sending.");
        }
      } else if (collected.get(YUP_EMOJI)) {
        // We collected a yup
        if (collected.get(YUP_EMOJI).count < NUM_TO_APPROVE + 1) {
          checkupMsg.channel.send(
            "There was not enough feedback, get more reactions."
          );
        }
      }
    });
  } else {
    checkupMsg[0].awaitReactions(filter);
  }
}

/*  Will send the contents of an approved embed to the intended destination
 */
export async function sendToChannel(
  targets: string,
  message: string | RichEmbed,
  client: Client
): Promise<Message[]> {
  // targets: A string that looks like |sec|web|
  // message: The exact string you want sent
  return new Promise<Message[]>(async (accept: any, reject: any) => {
    const messages: Message[] = [];

    let filteredTargets: string[] = [];

    if (targets.indexOf("EVERYONE") === -1) {
      let targetDiscords: string[] = targets
        .toLocaleUpperCase()
        .split("|")
        .map(item => item.trim());

      targetDiscords.filter((item: string, index: number) => {
        if (targetDiscords.indexOf(item) === index) filteredTargets.push(item);
      });
    } else {
      // Add all communities to the targets if everyone was there or no one was
      filteredTargets = [
        "GEN",
        "SEC",
        "WEB",
        "GAME",
        "COMP",
        "W",
        "HACK",
        "DATA",
        "CDT"
      ];
    }

    // TODO: Add a check back to the user in an embed to make sure all info is correct before sending

    console.log(filteredTargets);

    filteredTargets.forEach(async function(community: string) {
      if (community) {
        try {
          const guild: Guild = client.guilds.find(
            gui => gui.name === serverInfo[community].guild
          );
          if (guild) {
            const channel: TextChannel = guild.channels.find(
              chan => chan.name === serverInfo[community].channel
            ) as TextChannel;
            if (channel) {
              console.log("Simulate sending");
              console.log(message);
              const msg: Message | Message[] = await channel.send(message);
              if (msg instanceof Message) messages.push(msg);
              else messages.concat(msg);
            } else {
              console.log(
                `Channel: ${serverInfo[community].channel} not found`
              );
              reject();
            }
          } else {
            console.log(`Guild: ${serverInfo[community].guild} not found`);
            reject();
          }
        } catch (err) {
          console.log("Error sending the message.");
          reject();
        }
      }
    });
    accept(messages);
  });
}
