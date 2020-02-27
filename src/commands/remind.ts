import { Client, Message, RichEmbed } from "discord.js";
import { Reminder, ReminderLoader } from "../reminder";
import { sendToChannel, sendCheckup } from "../send";

let helpMessage: RichEmbed = new RichEmbed()
  .setColor("#4AC55E")
  .setTitle("?remind Help")
  .setAuthor("Gnome");

function remindPush(msg: Message, args: string[], client: Client) {
  // This is for pushing reminders to the masses
  // Set some flags so code isn't repeated
  // ?remind -p [all|n] |everyone|web|sec|w|game|comp|data|hack|
  // let reminderNum: number = 0;  // The reminder number in the list [0+]
  let toSend: string = ""; // The string to send to the discords, determined by reminder

  let reminderLoader: ReminderLoader = new ReminderLoader(); // Used to load reminders from storage
  let reminder: Reminder; // The Reminder object to send

  let sendMsg: boolean = true; // Goes false if there is not a specified reminder to push

  // Right now checks that coms are like |sec|web|
  // Need opening and closing pipes
  let pattCommunities: RegExp = /\|(\w+\|){1,7}/i;
  let communitiesArr: RegExpMatchArray = msg.content.match(pattCommunities);

  // Determines which reminder to push
  if (args[2] === "all") {
    // Push all the reminders
    // Probably shouldn't do this one
    console.log("This will be implemented later.");
  } else if (typeof args[2] === "string" && !isNaN(Number(args[2]))) {
    // That line checks to make sure what was passed is a number
    // Push just the number given
    if (reminderLoader.validNum(Number(args[2]))) {
      // Make sure we have a valid number first
      reminder = reminderLoader.getReminderByNum(Number(args[2]));
      console.log(typeof reminder);
      toSend = reminder.get_string();
      console.log("Going to toSend");
    } else {
      console.log("No idea which reminder to grab");
      sendMsg = false;
    }

    // Make sure user picked a valid reminder
    if (sendMsg) {
      // Used to straigh send the messge, now we do a check
      // send_to_channel(communitiesArr[0].trim(), toSend, client);
      sendCheckup(msg, communitiesArr[0].trim(), toSend, "Reminder", client);
    }
  } else {
    console.log("No idea which reminder to grab");
    sendMsg = false;
  }

  // Make sure user picked a valid reminder
  if (sendMsg) {
    sendToChannel(communitiesArr[0].trim(), toSend, client);
  }
}

function remindList(msg: Message) {
  msg.channel.send("WIP");
}

function remindHelp(msg: Message) {
  msg.channel.send(helpMessage);
}

function remind(msg: Message) {
  // If there is no flag, then this is a new reminder
  // Might change so it needs a -n flag?
  let validConfig: boolean = true;

  // Vars to pass to the Reminder Object
  let name: string;
  let location: string;
  let startdate: Date;
  let enddate: Date;

  // What to populate after regex matches
  let nameArr: RegExpMatchArray;
  let locationArr: RegExpMatchArray;
  let datetimeArr: RegExpMatchArray;

  const pattName: RegExp = /\$(.{1,32})\$/i;
  const pattLocation: RegExp = /\|(.{1,32})\|/i;
  const pattDatetime: RegExp = /((0[1-9]|1[0-2])\/([0-2][1-9]|3[0-1])\/(20[0-9][0-9]) (0[1-9]|1[0-2]):([0-5][0-9]))-((0[1-9]|1[0-2])\/([0-2][1-9]|3[0-1])\/(20[0-9][0-9]) (0[1-9]|1[0-2]):([0-5][0-9]))/i;

  // Dissect the user message
  nameArr = msg.content.match(pattName);
  locationArr = msg.content.match(pattLocation);
  datetimeArr = msg.content.match(pattDatetime);

  if (nameArr) {
    name = nameArr[1];
  } else {
    msg.channel.send(
      "Name was not valid. Needs to be between 1 and 32 characters, in between $$."
    );
    validConfig = false;
  }

  if (locationArr) {
    location = locationArr[1];
  } else {
    msg.channel.send(
      "Location was not valid. Needs to be between 1 and 32 characters, in between ||."
    );
    validConfig = false;
  }

  if (datetimeArr) {
    // If datetime was found, pull them from the array
    let currdate = new Date();
    startdate = new Date(datetimeArr[1]);
    enddate = new Date(datetimeArr[7]);

    // First check that start datetime is after current datetime
    // Then check that end datetime is after start datetime

    if (
      startdate.getTime() < currdate.getTime() ||
      enddate.getTime() < startdate.getTime()
    ) {
      msg.channel.send("Date was not valid. Your times are in the past.");
      validConfig = false;
    }
  } else {
    console.log(startdate);
    console.log(enddate);
    msg.channel.send(
      "Date was not valid. ex) 01/12/2019 12:00-01/12/2019 12:50"
    );
    validConfig = false;
  }

  if (validConfig) {
    // Got a valid data message, send it to the db
    const newReminder = new Reminder(
      msg.author.toString(),
      name,
      location,
      startdate,
      enddate
    );
    newReminder.save();

    msg.channel.send("Valid data message.");
    console.log("Valid data message.");
  } else {
    msg.channel.send("That wasn't quite right, follow the format below.");
    msg.channel.send(
      "?remind $Title$ |Location| 01/12/2019 12:00-01/12/2019 12:50"
    );
  }
}

function cmdRemind(message: Message, args: string[], client: Client) {
  if (args[1] === "-p") {
    remindPush(message, args, client);
  } else if (args[1] === "-l") {
    remindList(message);
  } else if (args[1] === "-h") {
    remindHelp(message);
  } else {
    remind(message);
  }
}

export { cmdRemind };
