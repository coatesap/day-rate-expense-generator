# Harvest Day Rate Expense Generator

Getting annoying with Harvest's [rubbish work-around](https://support.getharvest.com/hc/en-us/articles/360048181872-How-do-I-track-day-rates-in-Harvest-) for billing day rates? 
This script allows you to track your hours against a project as normal, but generate 
the daily expenses, as suggested by Harvest, automatically.

It looks at yesterday's time entries, finds those that are non-billable, sums them 
up per project, and creates expenses for any of those that exceed your MIN_HOURS setting.

## Setup
1. Copy `.env.example` to `.env`
1. Create a Personal Access Token over at https://id.getharvest.com/developers and add the details to your `.env file`
1. `yarn install`   
1. Call this NodeJS script from a scheduled task (cron) daily.
