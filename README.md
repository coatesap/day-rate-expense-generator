# Harvest Day Rate Expense Generator

Getting annoying with Harvest's [rubbish work-around](https://support.getharvest.com/hc/en-us/articles/360048181872-How-do-I-track-day-rates-in-Harvest-) for invoicing day rates? 
This script allows you to track your hours against a project as normal, but generate 
the daily expenses, as suggested by Harvest, automatically.

It looks at your previous month's time entries, finds those that are non-billable, sums them 
up per project per day, and creates expenses for any of those that exceed your `MIN_HOURS_PER_DAY` setting.

## Setup
1. Copy `.env.example` to `.env`
1. Add an Expense Category for your day rate in Harvest
1. Set `HARVEST_EXPENSE_NAME` in `.env` to the Expense Category's name
1. Create a Personal Access Token over at https://id.getharvest.com/developers and add the details to your `.env` file
1. `yarn install`   
1. Run this script before doing your invoicing: `node generate.js`
