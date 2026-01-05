# Harvest Day Rate Expense Generator

Annoyed with Harvest's [awkward work-around](https://support.getharvest.com/hc/en-us/articles/360048181872-How-do-I-track-day-rates-in-Harvest-) for invoicing day rates? 
This script allows you to track your hours against a project as normal, but generate 
the daily expenses, as suggested by Harvest, automatically.

It looks at your previous month's time entries, finds those that are non-billable, sums them 
up per project per day, and creates expenses for any of those that exceed your `MIN_HOURS_PER_DAY` setting.

## Setup
1. Copy `.env.example` to `.env`
2. Add an Expense Category for your day rate in Harvest
3. Set `HARVEST_EXPENSE_NAME` in `.env` to the Expense Category's name
4. For the projects you wish to generate billing for, set their "Project Type" to _"Time & Materials"_
5. Set the tasks within those projects that you use to record your time entries to **non billable**
6. Create a Personal Access Token over at https://id.getharvest.com/developers and add the details to your `.env` file
7. `yarn install`   
8. Run this script before doing your invoicing: `node generate.js`

## Usage

Run `node generate.js` to generate expenses for the previous month. 
You can optionally supply an ISO month (YYYY-MM) as an argument, e.g. `node generate.js 2025-01` to generate expenses for January 2025.


## Releasing new versions to npmjs.com
1. Use git to add a new tag (e.g. `git tag v1.2.1`)
2. Push with tags (`git push --tags`)
3. A GitHub action (see `/.github/workflows/npm-publish.yml`) will automatically run.
