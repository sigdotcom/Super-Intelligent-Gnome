<<<<<<< HEAD
import { Client, Message } from "discord.js";
import { send_to_channel } from "../send";

// Yell at everyone on every server. This will definitely make friends.

const SERVERS: string = "EVERYONE"; 

function cmd_scream(message: Message, client: Client) {
    var toSend: string = message.content.substring(8);
    console.log(toSend);
    if (toSend.length >= 1) {
        send_to_channel(SERVERS, toSend, client);
    }
}

export { cmd_scream };
=======
import { Client } from "discord.js";
import { ParsedMessage } from "discord-command-parser";
import { sendCheckup } from "../send";
import { logBot } from "../logging_config";
import { isAuthenticated } from "../authenticators";
import { validateScream } from "../validators";

// Yell at everyone on every server. This will definitely make friends.

const SERVERS: string = "EVERYONE";

async function cmdScream(parsed: ParsedMessage, client: Client) {
  isAuthenticated(parsed, "officer");
  validateScream(parsed);
  const message: string = parsed.body;
  const index: number = message.indexOf("\n");
  const title: string = message.substring(0, index);
  const toSend: string = message.substring(index + 1);

  logBot.debug("Sending scream message.");
  sendCheckup(parsed.message, SERVERS, toSend, title, client);
}

export { cmdScream };
>>>>>>> 09493761af265c82a8cd3cae3372224219a24f14
