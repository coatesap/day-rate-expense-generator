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
  // Find all time entries for the last couple of weeks
  const date_start = new Date()
  const date_end = new Date()
  date_start.setDate(date_start.getDate() - 14)
  date_end.setDate(date_end.getDate() - 1)
  let [from] = date_start.toISOString().split('T')
  let [to] = date_end.toISOString().split('T')
  const { time_entries } = await request(`time_entries?from=${from}&to=${to}&is_running=false`)

  // We're only interested in "non-billable" entries
  const non_billable = time_entries.filter(t => t.billable === false)

  // Sum up the total number of hours per project per day
  const totals = non_billable.reduce((acc, { hours, spent_date, project: { id: project_id } }) => {
    const key = JSON.stringify({ project_id, spent_date })
    return {
      ...acc,
      [key]: (acc[key] || 0) + hours
    }
  }, {})

  // Exclude any projects where the total number of hours is less than what we consider to be a day's work
  const qualifying = Object.fromEntries(Object.entries(totals).filter(([_, hours]) => hours > process.env.MIN_HOURS))

  // Get id for whatever expense_category is_active with name "Day Rate"
  const { expense_categories } = await request('expense_categories?is_active=true')
  const { id: expense_category_id } = expense_categories.find(c => c.name === 'Day Rate')

  // Find any existing expenses for this date range
  const { expenses: existing_expenses } = await request(`expenses?from=${from}&to=${to}`)
  const relevant_expenses = existing_expenses.filter(e => e.expense_category.id === expense_category_id)
  const existing_expense_keys = relevant_expenses.reduce((acc, { spent_date, project: { id: project_id } }) => (
    [...acc, JSON.stringify({ project_id, spent_date })]
  ), [])
  // Filter away any expenses that already exist in Harvest
  const expenses = Object.fromEntries(Object.entries(qualifying).filter(([key]) => !existing_expense_keys.includes(key)))

  // Create a new expense for each remaining entry
  for (let key in expenses) {
    const { project_id, spent_date } = JSON.parse(key)
    const { id } = await request('expenses', 'POST', {
      project_id,
      expense_category_id,
      spent_date
    })
    console.log(`Expense ${id} created for project ${project_id} on ${spent_date}`)
  }
}

run().then(() => console.log('Done'))
