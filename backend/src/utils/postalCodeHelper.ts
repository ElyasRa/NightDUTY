// PLZ-Bereiche zu Bundesländern
const postalCodeRanges: { [key: string]: [number, number][] } = {
  'Baden-Württemberg': [[68000, 69999], [70000, 76999], [77000, 79999], [88000, 89999]],
  'Bayern': [[80000, 87999], [90000, 97999]],
  'Berlin': [[10000, 14999]],
  'Brandenburg': [[14000, 16999], [17000, 19999]],
  'Bremen': [[27568, 27580], [28000, 28999]],
  'Hamburg': [[20000, 21999], [22000, 22999]],
  'Hessen': [[34000, 36999], [60000, 61999], [63000, 65999]],
  'Mecklenburg-Vorpommern': [[17000, 19999], [23900, 23999]],
  'Niedersachsen': [[21000, 21999], [26000, 27999], [28000, 29999], [30000, 31999], [37000, 38999], [49000, 49999]],
  'Nordrhein-Westfalen': [[32000, 33999], [40000, 48999], [50000, 53999], [57000, 59999]],
  'Rheinland-Pfalz': [[54000, 56999], [65000, 67999], [76000, 76999]],
  'Saarland': [[66000, 66999]],
  'Sachsen': [[1000, 9999]],
  'Sachsen-Anhalt': [[6000, 6999], [38000, 39999]],
  'Schleswig-Holstein': [[23000, 25999]],
  'Thüringen': [[7000, 7999], [36000, 37999], [98000, 99999]]
}

export function getFederalStateFromPostalCode(postalCode: string): string | null {
  const code = parseInt(postalCode)
  if (isNaN(code)) return null

  for (const [state, ranges] of Object.entries(postalCodeRanges)) {
    for (const [min, max] of ranges) {
      if (code >= min && code <= max) {
        return state
      }
    }
  }
  return null
}

// ALLE Feiertage für 2025 nach Bundesland
export interface Holiday {
  date: string
  name: string
}

export function getHolidaysForState(state: string, year: number = 2025): Holiday[] {
  // Bundesweite Feiertage (gelten überall)
  const nationalHolidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: `${year}-04-18`, name: 'Karfreitag' },
    { date: `${year}-04-21`, name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: `${year}-05-29`, name: 'Christi Himmelfahrt' },
    { date: `${year}-06-09`, name: 'Pfingstmontag' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag' }
  ]

  // Bundeslandspezifische Feiertage
  const stateSpecificHolidays: { [key: string]: Holiday[] } = {
    'Baden-Württemberg': [
      { date: `${year}-01-06`, name: 'Heilige Drei Könige' },
      { date: `${year}-06-19`, name: 'Fronleichnam' },
      { date: `${year}-11-01`, name: 'Allerheiligen' }
    ],
    'Bayern': [
      { date: `${year}-01-06`, name: 'Heilige Drei Könige' },
      { date: `${year}-06-19`, name: 'Fronleichnam' },
      { date: `${year}-08-15`, name: 'Mariä Himmelfahrt' },
      { date: `${year}-11-01`, name: 'Allerheiligen' }
    ],
    'Berlin': [
      { date: `${year}-03-08`, name: 'Internationaler Frauentag' }
    ],
    'Brandenburg': [
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Bremen': [
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Hamburg': [
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Hessen': [
      { date: `${year}-06-19`, name: 'Fronleichnam' }
    ],
    'Mecklenburg-Vorpommern': [
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Niedersachsen': [
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Nordrhein-Westfalen': [
      { date: `${year}-06-19`, name: 'Fronleichnam' },
      { date: `${year}-11-01`, name: 'Allerheiligen' }
    ],
    'Rheinland-Pfalz': [
      { date: `${year}-06-19`, name: 'Fronleichnam' },
      { date: `${year}-11-01`, name: 'Allerheiligen' }
    ],
    'Saarland': [
      { date: `${year}-06-19`, name: 'Fronleichnam' },
      { date: `${year}-08-15`, name: 'Mariä Himmelfahrt' },
      { date: `${year}-11-01`, name: 'Allerheiligen' }
    ],
    'Sachsen': [
      { date: `${year}-10-31`, name: 'Reformationstag' },
      { date: `${year}-11-19`, name: 'Buß- und Bettag' }
    ],
    'Sachsen-Anhalt': [
      { date: `${year}-01-06`, name: 'Heilige Drei Könige' },
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Schleswig-Holstein': [
      { date: `${year}-10-31`, name: 'Reformationstag' }
    ],
    'Thüringen': [
      { date: `${year}-10-31`, name: 'Reformationstag' },
      { date: `${year}-09-20`, name: 'Weltkindertag' }
    ]
  }

  // Alle Feiertage zusammenführen
  const stateHolidays = stateSpecificHolidays[state] || []
  const allHolidays = [...nationalHolidays, ...stateHolidays]
  
  // Nach Datum sortieren
  return allHolidays.sort((a, b) => a.date.localeCompare(b.date))
}

// Funktion für mehrere Jahre (2024-2026)
export function getHolidaysForStateMultiYear(state: string, startYear: number = 2024, endYear: number = 2026): Holiday[] {
  const allHolidays: Holiday[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getHolidaysForState(state, year)
    allHolidays.push(...yearHolidays)
  }
  
  return allHolidays.sort((a, b) => a.date.localeCompare(b.date))
}
