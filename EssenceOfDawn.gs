const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getSheetByName('Index');


const itemNames = [
	"Black Distortion Earring",
	"Vaha's Dawn", "Ogre Ring",
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


async function getList(){
	const response  = UrlFetchApp.fetch(`https://api.arsha.io/v2/na/GetWorldMarketList?mainCategory=20&lang=en`);
	const data = JSON.parse(response.getContentText());
	
	return data;
}


async function getPrices(ids, sids){
	const response = UrlFetchApp.fetch(`https://api.arsha.io/v2/na/GetBiddingInfoList?id=${ids.join(",")}&sid=${sids.join(",")}&lang=en`);
	const data = JSON.parse(response.getContentText());
	
	return data;
}


function compareValues(oldValue, newValue){
  const res = {
    text: "",
    diff: ""
  }

  if(oldValue > newValue){
    res.text = `⬇️ decreased ⬇️ in price to ${newValue.toLocaleString()} from ${oldValue.toLocaleString()} (-${(oldValue - newValue).toLocaleString()})`;
    res.diff = (oldValue - newValue) * -1;
    return res;
  }

  if(oldValue < newValue){
    res.text = `⬆️ increased ⬆️ in price to ${newValue.toLocaleString()} from ${oldValue.toLocaleString()} (+${(newValue - oldValue).toLocaleString()})`;
    res.diff = newValue - oldValue;
    return res;
  }

  res.text = "did not change in price";
  res.diff = "N/A";
  return res;
}


async function run(){
  try {
    data = await getList();

    // Filter out all the items we donn't care about
    const shortList = [];
    for(const item of data){
      if(itemNames.includes(item.name)) shortList.push(item);
    }

    // ID: Item, SID: Enhance level
    const ids = [];
    const sids = [];
    for(const item of shortList){
      ids.push(item.id, item.id);
      sids.push(4, 5);
    }

    const prices = await getPrices(ids, sids);

    // Put in a format we can use/ loop through easier
    const organisedData = []
    for(const item of prices){
      const d = {
        name: "",
        price: 0,
      }
      
      if(item.sid === 4){
        d.name = `TET (IV) ${item.name}`;
      } else {
        d.name = `PEN (V) ${item.name}`;
      }
      
      d.price = item.orders.pop().price;
      
      organisedData.push(d);
    }
    
    // console.log(organisedData)

    // Update the cells
    for(let i = 4; i < 56; i++){
      const textCellValue = sheet.getRange(`B${i}`).getValue();
      for(const d of organisedData){
        if(d.name !== textCellValue) continue;

        const cell = sheet.getRange(`D${i}`);
        const oldValue = cell.getValue();
        cell.setValue(d.price);

        const compared = compareValues(parseInt(oldValue), d.price); 
        const differenceCell = sheet.getRange(`H${i}`);
        differenceCell.setValue(compared.diff)

        Logger.log(`${d.name} ${compared.text}`);
      }
    }
  } catch(e) {
    console.error("Unable to update the sheet");
  }
}
