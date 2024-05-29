const express = require('express') //3rd party pkg from NPM website
const {open} = require('sqlite') //3rd party pkg from NPM website
const sqlite3 = require('sqlite3') //3rd party pkg from NPM website
const path = require('path') //core module or inbuild file of Node JS
const app = express() //server instance created
const dbPath = path.join(__dirname, 'covid19India.db')
const dp = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at URL')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

function convertingDbObjToResponseObjStateTable(dbObj) {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  }
}

function convertingDbObjToResponseObjDistrictTable(dbObj) {
  return {
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  }
}

//URL: http://localhost:3000
//API-1: Returns a list of all states in the state table --> Path: /states/
app.get('/states/', async (request, response) => {
  const allStatesQuery = `
        SELECT *
        FROM state
        ORDER BY state_id;
    `
  const allStates = await db.all(allStatesQuery)
  response.send(
    allStates.map(eachObj => convertingDbObjToResponseObjStateTable(eachObj)),
  )
})

//API-2: Returns a state based on the state ID --> Path: /states/:stateId/
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId}
  `
  const getSpecificState = await db.get(getStateQuery)
  const {state_id, state_name, population} = getSpecificState
  const camelCaseObj = {
    stateId: state_id,
    stateName: state_name,
    population: population,
  }
  response.send(camelCaseObj)
})

//API-3: Create a district in the district table, district_id is auto-incremented --> Path: /districts/
app.post('/districts/', async (request, response) => {
  const requestBody = request.body
  const {districtName, stateId, cases, cured, active, deaths} = requestBody
  const createDistrictQuery = `
    INSERT INTO 
      district (district_name, state_id, cases, cured, active, deaths)
     VALUES
      ("${districtName}", ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    `
  const createDistrict = await db.run(createDistrictQuery)
  response.send('District Successfully Added')
})

//API-4: Returns a district based on the district ID --> Path: /districts/:districtId/
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
  `
  const getSpecificDistrict = await db.get(getDistrictQuery)
  const {district_id, district_name, state_id, cases, cured, active, deaths} =
    getSpecificDistrict
  const camelCaseObj = {
    districtId: district_id,
    districtName: district_name,
    stateId: state_id,
    cases: cases,
    cured: cured,
    active: active,
    deaths: deaths,
  }
  response.send(camelCaseObj)
})

//API-5: Deletes a district from the district table based on the district ID --> Path: /districts/:districtId/
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
  `
  const deleteSpecificDistrict = await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//API-6: Updates the details of a specific district based on the district ID --> Path: /districts/:districtId/
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
    UPDATE district
    SET 
      district_name = "${districtName}",
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE district_id = ${districtId}; 
    `
  const updateSpecificDistrict = await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//API-7: Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID --> Path: /states/:stateId/stats/
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const sumStatisticsQuery = `
    SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths)
    FROM district
    WHERE state_id = ${stateId};
  `
  const statistics = await db.get(sumStatisticsQuery)
  console.log(statistics)
  response.send({
    totalCases: statistics['SUM(cases)'],
    totalCured: statistics['SUM(cured)'],
    totalActive: statistics['SUM(active)'],
    totalDeaths: statistics['SUM(deaths)'],
  })
})

//API-8: Returns an object containing the state name of a district based on the district ID --> Path: /districts/:districtId/details/
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT state.state_name
    FROM state NATURAL JOIN district
    WHERE district.district_id = ${districtId}
  `
  const getStateName = await db.get(getStateNameQuery)
  console.log(getStateName)
  const {state_name} = getStateName
  const camelCaseObj = {stateName: state_name}
  response.send(camelCaseObj)
})

module.exports = app
