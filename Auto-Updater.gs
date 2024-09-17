// const ss = SpreadsheetApp.getActiveSpreadsheet();
// const sheet = ss.getSheetByName('SHEET_NAME');

/**
 * Basic guild information
 * @typedef GuildData
 * @type {object}
 * @property {string} name
 * @property {string} region
 */


/**
 * Basic player data
 * @typedef PlayerData
 * @type {object}
 * @property {string} name
 * @property {string} guildName
 * @property {boolean} foundOnSheet
 */


/** @type {GuildData[]} */
const guilds = [
	{ name: "NA_Guild", region: "NA" },
	{ name: "EU_Guild", region: "EU" },
]


/**
 * Fetches the relevant guild page from black desert's website
 *
 * @param {GuildData} guild
 * @return {string}
 */
function getPearlAbyssHTML(guild){
	const url = `https://www.naeu.playblackdesert.com/en-US/Adventure/Guild/GuildProfile?guildName=${guild.name.toLowerCase()}&region=${guild.region.toUpperCase()}`;
	const response = UrlFetchApp.fetch(url);
	return response.getContentText();
}



/**
 * Gets a list of family names by scraping the HTML from black desert's website
 *
 * @param {GuildData} guild
 * @return {PlayerData[]}
 */
function getFamilyNames(guild){
	const html = getPearlAbyssHTML(guild);
	const cheerio = Cheerio.load(html); // Import Cheerio to make this work

	const nodes = cheerio(".text").text();
	const familyPresplit = nodes.replace(/\s+/g, "|").slice(1).slice(0, -1);
	const familyNames = familyPresplit.split("|").map(player => {
		return {
			name: player,
			guildName: guild.name,
			foundOnSheet: false
		}
	});

	return familyNames;
}



/**
 * Checks if a player is in a guild
 *
 * @param {PlayerData[]} families
 * @param {string[]} row
 * @param {number} rowNumber
 * @return {void}
 * @example // Array Order:
 * timestamp(0), familyName(1), discordTag(2), pvp(3), comments(4), NA(5), appliedTo(6), guildStatus(7)
 */
function checkIfPlayerInGuild(families, row, rowNumber){
	const sheetFamilyName = row[1].replace(/\s+/g, "");
	const invitedStatus = row[7];
	if(!invitedStatus) return;

	// Logger.log(`Processing ${sheetFamilyName}...`);
	
	let guildName = "";
	for(const family of families){
		if(sheetFamilyName.toLowerCase() !== family.name.toLowerCase()) continue;
		guildName = family.guildName;
		family.foundOnSheet = true;

		break;
	}
	
	const guildCell = sheet.getRange(`H${rowNumber + 2}`);
	
	if(!guildName){
		// Set the player as inactive, assuming not "pending invite" or "invited"... or "banned"
		
		if(["Pending Invite", "Invited", "No Application", "Banned"].includes(invitedStatus)) return // Logger.log(`Skipping ${sheetFamilyName} because ${invitedStatus}`);
		guildCell.setValue("Inactive/ Left");
	} else {
		// Update their guild, if it's not already correct
		
		if(["Banned", "Bald"].includes(invitedStatus)) return //Logger.log(`Skipping ${sheetFamilyName} because ${invitedStatus}`);
		guildCell.setValue(guildName);
	}
}



/**
 * Submits a form response adding a family to the sheet
 *
 * @param {PlayerData} family
 */
function addFamilyToSheet(family){
	const _comment = "AUTOMATICALLY ADDED BY APPS SCRIPT";
	const _name = family.name;
	
	const req = `REQ_LINK_HERE`;

	UrlFetchApp.fetch(req);
}



async function init(){
	let familyNames = [];

	for(const guild of guilds){
		const names = getFamilyNames(guild);
		familyNames.push(names.slice(1)); // Remove the first one as the GM is duplicated somewhere in the list
	}

	familyNames = familyNames.flat();
	if(familyNames.length === 0) return // There was some issue getting any family names

	const data = sheet.getRange("A2:H");
	const sheetValues = data.getValues();

	for(let i = 0; i < sheetValues.length; i++){
		const row = sheetValues[i];
		checkIfPlayerInGuild(familyNames, row, i);
	}
	
	for(const family of familyNames){
		if(family.foundOnSheet) continue;
		addFamilyToSheet(family);
	}
}

