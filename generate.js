require('dotenv').config()
const p = require('phin')

const request = async (path, method = 'GET', data = null) => {
    const {body} = await p({
        ...(data && {data}), // only include body data if supplied
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

const get_expense_category_id = async () => {
    // Get id for whatever expense_category is_active with name "Day Rate"
    const {expense_categories} = await request('expense_categories?is_active=true')
    return expense_categories.find(c => c.name === process.env.HARVEST_EXPENSE_NAME).id
}

const get_days_worked = async (from, to) => {
    const {time_entries} = await request(`time_entries?from=${from}&to=${to}&is_running=false`)

    // We're only interested in "non-billable" entries
    const non_billable = time_entries.filter(t => t.billable === false)

    // Sum up the total number of hours per project per day
    const totals = non_billable.reduce((acc, {hours, spent_date, project: {id: project_id}}) => {
        const key = JSON.stringify({project_id, spent_date})
        return {
            ...acc,
            [key]: (acc[key] || 0) + hours
        }
    }, {})

    // Exclude any projects where the total number of hours is less than what we consider to be a day's work
    const days_with_enough_hours = Object.entries(totals).filter(([_, hours]) => hours > process.env.MIN_HOURS_PER_DAY)

    // Return just our unique keys for each day worked
    return days_with_enough_hours.map(([key]) => key)
}

const get_existing_expenses = async (from, to) => {
    // Find any existing expenses for this date range
    const {expenses} = await request(`expenses?from=${from}&to=${to}`)

    // Filter out any existing expenses that aren't for day rates
    const relevant_expenses = expenses.filter(e => e.expense_category.name === process.env.HARVEST_EXPENSE_NAME)

    // Return the unique keys for these expenses
    return relevant_expenses.reduce((acc, {spent_date, project: {id: project_id}}) => (
        [...acc, JSON.stringify({project_id, spent_date})]
    ), [])
}

const run = async () => {
    // Look back over the last calendar month
    const date_start = new Date()
    date_start.setDate(1)
    date_start.setMonth(date_start.getMonth() - 1) // This is safe, as -1 = December

    const date_end = new Date()
    date_end.setMonth(date_start.getMonth() + 1) // This should be safe, as 12 = January
    date_end.setDate(0)

    let [from] = date_start.toISOString().split('T')
    let [to] = date_end.toISOString().split('T')

    // Get all our data from Harvest in parallel
    const [
        expense_category_id,
        existing_expenses,
        days_worked,
    ] = await Promise.all([
        get_expense_category_id(),
        get_existing_expenses(from, to),
        get_days_worked(from, to)
    ])

    // Filter away any expenses that already exist in Harvest
    const new_expenses = days_worked.filter(key => !existing_expenses.includes(key))
    let count = 0
    const expensesCreated = [];

    await Promise.all(new_expenses.map(async (key) => {
        // Create a new expense for each remaining entry
        const {project_id, spent_date} = JSON.parse(key)
        const { id } = await request('expenses', 'POST', {
          project_id,
          expense_category_id,
          spent_date
        })
        count++
        expensesCreated.push({id, project_id, spent_date})
    }))

    // Order expenses by date
    expensesCreated.sort((a, b) => a.spent_date > b.spent_date ? 1 : -1)

    // Display created expenses to the user
    expensesCreated.forEach(({id, project_id, spent_date}) => {
        console.log(`Expense ${id} created for project ${project_id} on ${spent_date}`)
    })

    return count
}

run().then((count) => console.log(`Done. ${count} expenses created.`))
