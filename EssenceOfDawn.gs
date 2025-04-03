const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getSheetByName('Index');

// It would be smarter to use the ID's instead of names, but it is what it is.
const itemNames = [
	"Black Distortion Earring",
	"Vaha's Dawn",
	"Ogre Ring",
	"Laytenn's Power Stone",
	"Eye of the Ruins Ring",
	"Ring of Crescent Guardian",
	"Valtarra Eclipsed Belt",
	"Basilisk's Belt",
	"Serap's Necklace",
	"Tungrad Ring",
	"Tungrad Belt",
	"Tungrad Necklace",
	"Tungrad Earring",
	"Dawn Earring",
	"Ominous Ring",
	"Turo's Belt",
	"Revived Lunar Necklace",
	"Revived Lunar Necklace",
	"Ring of Cadry Guardian",
	"Narc Ear Accessory",
	"Forest Ronaros Ring",
	"Revived River Necklace",
	"Ocean Haze Ring",
	"Ethereal Earring",
	"Centaurus Belt",
	"Orkinrad's Belt",
	"Sicil's Necklace"
];


async function getList() {
	const response = UrlFetchApp.fetch(`https://api.arsha.io/v2/na/GetWorldMarketList?mainCategory=20&lang=en`);
	const data = JSON.parse(response.getContentText());

	return data;
}


async function getPrices(ids, sids) {
	const response = UrlFetchApp.fetch(`https://api.arsha.io/v2/na/GetBiddingInfoList?id=${ids.join(",")}&sid=${sids.join(",")}&lang=en`);
	const data = JSON.parse(response.getContentText());

	return data;
}


function compareValues(oldValue, newValue) {
	const res = {
		text: "did not change in price",
		diff: 0
	}

	if (oldValue > newValue) {
		res.text = `⬇️ decreased ⬇️ in price to ${newValue.toLocaleString()} from ${oldValue.toLocaleString()} (-${(oldValue - newValue).toLocaleString()})`;
		res.diff = (oldValue - newValue) * -1;
		return res;
	}

	if (oldValue < newValue) {
		res.text = `⬆️ increased ⬆️ in price to ${newValue.toLocaleString()} from ${oldValue.toLocaleString()} (+${(newValue - oldValue).toLocaleString()})`;
		res.diff = newValue - oldValue;
		return res;
	}

	return res;
}


async function run() {
	// Wrap in a try/catch so google doesn't email me if something fails (Nothing I can do about it in that situation)
	try {
		// Chance to fail, hopefully doesn't
		data = await getList();

		// Filter out all the items we donn't care about
		const shortList = [];
		for (const item of data) {
			if (itemNames.includes(item.name)) shortList.push(item);
		}

		// ID: Item, SID: Enhance level
		const ids = [];
		const sids = [];
		for (const item of shortList) {
			ids.push(item.id, item.id);
			sids.push(4, 5);
		}

		// Chance to fail, hopefully doesn't
		const prices = await getPrices(ids, sids);

		// Put in a format we can use/ loop through easier
		const organisedData = []
		for (const item of prices) {
			const d = {
				name: (item.sid === 4) ? `TET (IV) ${item.name}` : `PEN (V) ${item.name}`,
				price: item.orders.shift().price,
			}

			organisedData.push(d);
		}

		// These arrays are to update the data all at once (Quicker, more efficient)
		const newPrices = [];
		const newDiffs = [];

		// Table starts B4, so i starts at 4.
		for (let i = 4; i < 56; i++) {
			// Name of the item
			const textCellValue = sheet.getRange(`B${i}`).getValue();
			for (const d of organisedData) {
				if (d.name !== textCellValue) continue;

				const cell = sheet.getRange(`D${i}`);   // Price of the item
				const oldValue = cell.getValue();
				newPrices.push([d.price]);

				// Price difference from the last value
				const compared = compareValues(parseInt(oldValue), d.price);
				newDiffs.push([compared.diff]);

				Logger.log(`${d.name} ${compared.text}`);
			}
		}

		// Update the cells
		sheet.getRange("D4:D55").setValues(newPrices);
		sheet.getRange("H4:H55").setValues(newDiffs);

	} catch (e) {
		console.error(`Unable to update the sheet:\n${e}`);
	}
}
