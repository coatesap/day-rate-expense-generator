require('dotenv').config()
const p = require('phin')

const request = async (path, method = 'GET', data = {}) => {
  const { body } = await p({
    data,
    headers: {
      'Harvest-Account-Id': process.env.HARVEST_ACCOUNT_ID,
      'Authorization': 'Bearer ' + process.env.HARVEST_TOKEN,
      'User-Agent': 'Day Rate Expense Generator',
    },
    method,
    parse: 'json',
    url: 'https://api.harvestapp.com/v2/' + path,
  })
  return body
}

const run = async () => {
  // Find any time entries for yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  let [date] = yesterday.toISOString().split('T')
  const { time_entries } = await request(`time_entries?from=${date}&to=${date}`)

  // We're only interested in "non-billable" entries
  const non_billable = time_entries.filter(t => t.billable === false)

  // Sum up the total number of hours per project
  const totals = non_billable.reduce((acc, t) => {
    acc[t.project.id] = (acc[t.project.id] || 0) + t.hours
    return acc
  }, {})

  // Exclude any projects where the total number of hours is less than what we consider to be a day's work
  const qualifying = Object.fromEntries(Object.entries(totals).filter(([_, hours]) => hours > 6))

  // Get id for whatever expense_category is_active with name "Day Rate"
  const { expense_categories } = await request('expense_categories?is_active=true')
  const category = expense_categories.find(c => c.name === 'Day Rate')

  // Create a new expense for each remaining entry
  for (let project_id in qualifying) {
    const { id } = await request('expenses', 'POST', {
      project_id,
      expense_category_id: category.id,
      spent_date: date
    })
    console.log(`Expense ${id} created for ${date}`)
  }
}

run().then(() => console.log('Done'))
