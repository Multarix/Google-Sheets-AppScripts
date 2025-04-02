# App Scripts
### Main.gs
> Used when someone submits a form.

Fixes up and maintains the sheet to be in a presentable format

1. Centers the text in cells vertically and horizontally
2. Checks if the player is on the correct region
3. Changes some cells to fit our table format
4. Sends a webhook to discord to alert officers that there is a new application

### Auto-Updater.gs
> Runs every couple of hours.

Adjusts everyone in the form to be in or out of the guild, scrapes data directly from Black Desert's website

1. Grabs the HTML in text format from BDO's website
2. Picks out and formats the relevant text into an array
3. Iterates through every member on the list and sets them to Inactive, or within a given guild on the sheet depending on what data was scraped from PA's website.

### EssenceOfDawn.gs
> Runs every couple of hours.

Updates a sheet with price information for accessories that can be melted and which is the most efficient to melt (assuming you're buying it)
