const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getSheetByName('SHEET_NAME');
const webhookURL = "LINK_HERE";
const GOOGLE_DOC_URL = "LINK_HERE";
const GUILD_ICON_URL = "LINK_HERE";


/** Align a range of cells */
function setCellAlign(range, alignment){
	const cell = sheet.getRange(range);
	cell.setHorizontalAlignment(alignment);
	cell.setVerticalAlignment(alignment);
}


function setAppliedTo(event){
	const range = event.range;
	const row = range.getRow();

	const appliedTo = event.values[6];
	const guild = (appliedTo.endsWith("Guilds")) ? "Both" : appliedTo.split(" ").pop();

	const appliedToCell = sheet.getRange("G" + row);
	appliedToCell.setValue(guild);
}



/** Set a cell to "Pending Invite" */
function setCellToPending(event){
	const range = event.range;
	const row = range.getRow();

	const pendingCell = sheet.getRange("H" + row);
	pendingCell.setValue("Pending Invite");
}



/** Ticks the box or deletes the row depending on if they're an NA player */
function checkIsNAPlayer(event){
	const range = event.range;
	const row = range.getRow();

	const isNA = (event.values[5] === "Yes, I am on NA.");
	const pendingCell = sheet.getRange("F" + row);

	if(!isNA){
		sheet.deleteRow(row);
		return 0;
	}

	pendingCell.setValue("Y");
	return 1;
}



/** Creates a discord embed object */
function createDiscordEmbed(event){
	const row = event.range.getRow();
	const values = event.values;
	const [_timestamp, familyName, discordTag, pvp, additionalComments, _na, appliedTo] = values;
	const guild = (appliedTo.endsWith("Guilds")) ? "Both" : appliedTo.split(" ").pop();

	const guildColors = {
		"NA_Guild": 1684262,
		"EU_Guild": 10181046,
		"Both": 15844367
	}

	const embed = {
		type: "rich",
		color: guildColors[guild],
		author: {
			name: `Application #${row}`,
			url: `${LINK_TO_GOOGLE_DOC}&range=${row}:${row}`,
			icon_url: "GUILD_ICON_URL"
		},
		fields: [
			{
				name: "Family Name",
				value: familyName,
				inline: true
			},
			{
				name: "\u200b",
				value: "\u200b",
				inline: true
			},
			{
				name: "Discord Tag",
				value: (discordTag) ? discordTag.replace(/_/g, "\\_") : "N/A", // eslint-disable-line no-useless-escape
				inline: true
			},
			{
				name: "Interested in PvP? :crossed_swords:",
				value: pvp,
				inline: false
			},
			{
				name: "Additional Comments :notepad_spiral:",
				value: (additionalComments) ? additionalComments : "N/A",
				inline: false
			},
			{
				name: "Applied To:",
				value: guild,
				inline: false
			}
		],
		timestamp: new Date().toISOString()
	};

	return embed;
}



function checkIfAutoAdd(event){
  const values = event.values;
	const [_timestamp, _familyName, _discordTag, _pvp, additionalComments, _na, _appliedTo] = values;
  if(additionalComments === "AUTOMATICALLY ADDED BY APPS SCRIPT"){
    return true;
  }

  return false
}



/** Sends data to discord */
function sendWebhookData(event){
	const embed = createDiscordEmbed(event);

	const Payload = JSON.stringify({
		embeds: [embed]
	});

	const params = {
		method: "POST",
		payload: Payload,
		muteHttpExceptions: true,
		contentType: "application/json"
	};

	const response = UrlFetchApp.fetch(webhookURL, params);
}


/** Ran when a new form is submitted and the sheet adds the data */
function onFormSubmit(event){
	setCellAlign("A1:H", "center");

	if(!event) return console.error("No event was created! Skipping next parts");

	const isValid = checkIsNAPlayer(event);
	if(!isValid) return;

	setAppliedTo(event);
	setCellToPending(event);
  const autoAdded = checkIfAutoAdd(event);
	if(!autoAdded) sendWebhookData(event);
}


/** Creates a trigger */
function createTrigger(){
	const ss = SpreadsheetApp.getActive();
	ScriptApp.newTrigger('onFormSubmit')
		.forSpreadsheet(ss)
		.onFormSubmit()
		.create();
}