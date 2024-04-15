function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function doWebPost(body) {
  let login = getCookie("csrfp_login");
  let token = getCookie("csrfp_token");

  let api = body['data']['type'];

  let request = await fetch(`${URL}/api/wfm/main/${api}`, {
    "credentials": "include",
    "headers": {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/vnd.api+json",
        "Crnk-Compact": "true",
        "X-CSRF-Login": login,
        "X-CSRF-Header": token,
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
    },
    "body": JSON.stringify(body),
    "referrer": `${URL}/wfo/ui/`,
    "method": "POST",
    "mode": "cors"
  });

  return await request.json();
}

async function doWebGet(api) {
  let login = getCookie("csrfp_login");
  let token = getCookie("csrfp_token");

  let request = await fetch(`${URL}/api/wfm/main/${api}`, {
    "credentials": "include",
    "headers": {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/vnd.api+json",
        "Crnk-Compact": "true",
        "X-CSRF-Login": login,
        "X-CSRF-Header": token,
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
    },
    "referrer": `${URL}/wfo/ui/`,
    "mode": "cors"
  });

  return await request.json();
}

function getStartEnd() {
    var currentDate = new Date();
    // If the current day isn't Monday, find the most recent Monday
    if (currentDate.getUTCDay() !== 1) { // 0 is Sunday, 1 is Monday
        var daysToMonday = 1 - currentDate.getUTCDay(); // Calculate days until next Monday
        if (daysToMonday > 0) daysToMonday -= 7; // If the current day is after Monday, subtract a week

        currentDate.setUTCDate(currentDate.getUTCDate() + daysToMonday); // Set currentUTCDate to the most recent Monday
    }

    // Set start date to currentUTCDate
    var startDate = new Date(currentDate);
    var endDate = new Date(startDate);

    // Find the date 4 weeks from the start date
    endDate.setUTCDate(startDate.getUTCDate() + 28);

    // Format dates as "YYYY-MM-DDTHH:MM:SSZ"
    function formatDate(date) {
        var year = date.getUTCFullYear();
        var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        var day = date.getUTCDate().toString().padStart(2, '0');
        var hours = '00';
        var minutes = '00';
        var seconds = '00';
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    }

    // Format start date and date 4 weeks from start date
    var formattedStartDate = formatDate(startDate);
    var formattedEndDate = formatDate(endDate);

    return [formattedStartDate, formattedEndDate];
  }

  function mapActivities(list) {
    var resultMap = {};
    list.forEach(function(item) {
        resultMap[item.id] = item.attributes.name;
    });
    return resultMap;
  }

  function summarize(schedule, activities) {
    var summary = [];
    var timeOffs = [];
    schedule.forEach(function(shift) {
      let startTime = new Date(shift['startTime']);
      let endTime = new Date(shift['endTime']);
      let durationMinutes = shift['durationMinutes'];
      let activityName = activities[shift['activityId']];
      let role = '';
      if (activityName.includes('ISS')) {
        role = 'ISS';
      } else if (activityName.includes('CSPL')) {
        role = 'Pl.';
      } else if (activityName.includes('CS')) {
        role = 'CS';
      }

      if (shift.hasOwnProperty('shiftId') && ['ISS', 'CS', 'Pl.'].includes(role)) {
        summary.push({
          start: startTime,
          end: endTime,
          duration: durationMinutes,
          role: role,
          isTimeOff: false
        });
      }
      if (shift.eventType === "TimeOffEvent") {
        timeOffs.push({
          start: startTime,
          end: endTime,
        });
      }
    });

    timeOffs.forEach(function(timeOff) {
      let startTime = new Date(timeOff.start);
      let endTime = new Date(timeOff.end);
      summary.forEach(function(shift) {
        if (shift.start <= startTime && shift.end >= endTime) {
          shift.isTimeOff = true;
        }
      });
    });

    return summary;
  }

function setSimplePage(title, content) {
      document.body.innerHTML = `
<style>
    body {
        font-family: serif;
        background-color: #f2f2f2;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }

    .content {
        text-align: center;
        padding: 20px;
        border-radius: 20px;
        min-width: 1000px;
        min-height: 600px;
        background-color: white;
    }
</style>
<div class="content">
    <h1 style="font-size: 3rem;">${title}</h1>
    ${content ? '<pre>' + content + '</pre>' : ''}
    <button onclick="window.location.reload();" style="margin-top: 20px;">Press this to go back</button>
</div>
      `;
}

function fmtTime(time) {
  // returns 9am, 9pm or 9:30am
  let hours = time.getHours();
  let minutes = time.getMinutes();
  let ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  if (minutes === 0) {
    return hours + ampm;
  } else {
    return hours + ':' + minutes.toString().padStart(2, '0') + ampm;
  }

}

function displayData(vcb_data) {
  vcb_data.sort((a, b) => a.start - b.start || b.role.localeCompare(a.role) || a.end - b.end);
  const base_page = `
<style>
 .close {
   color: #aaa;
   position: fixed;
   font-size: 38px;
   font-weight: bold;
 }

 .close:hover,
 .close:focus {
   color: black;
   text-decoration: none;
   cursor: pointer;
 }

 .table {
   display: flex;
   flex-direction: row;
   justify-content: space-between;
   height: 100%;
 }

 .column {
   flex: 1;
   padding: 10px;
   margin: 10px;
   border: 1px solid #888;
   min-width: 400px;
   height: 90vh;
   overflow-y: scroll;
 }
 body {
   background: #eee;
   font-family: Arial, Helvetica, sans-serif;
   font-size: 26px;
 }

</style>

<span class="close" onclick="location.reload()">&times;</span>
<div class="table">
</div>
`;
   document.body.innerHTML = base_page;
   let day_columns = {};
  vcb_data.forEach((item) => {
     let date = new Date(item.start);
     let date_string = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
     if (!day_columns[date_string]) {
       // create a div with class column
       let div = document.createElement('div');
       div.classList.add('column');
       // put an h3 inside
       let h3 = document.createElement('h3');
       h3.textContent = date.toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'});
       div.appendChild(h3);
       // put a ul inside
       let ul = document.createElement('ul');
       div.appendChild(ul);
       day_columns[date_string] = div;
     }

     let li = document.createElement('li');
     let role = item.role;
     if (item.isDraft) {
        role += ':Draft';
     }

     let role_text = role === "CS" ? '' : `(${role})`;

     li.innerHTML = `<strong>${fmtTime(item.start)} to ${fmtTime(item.end)}</strong>: ${item.name} ${role_text}`;
     if (item.role === 'ISS') {
        li.style.color = 'darkred';
     }
     if (item.role === 'Pl.') {
        li.style.color = '#007bd4';
     }
     if (item.isTimeOff) {
       li.style.textDecoration = 'line-through';
       li.style.color = 'gray';
     }
     if (item.isDraft) {
       li.style.textDecoration = 'italic';
       li.style.color = 'darkgreen';
     }
     day_columns[date_string].appendChild(li);

   });

   // go through the sorted list of day_column properties
   let sorted_days = Object.keys(day_columns).sort();
   sorted_days.forEach((day) => {
     let table = document.querySelector('.table');
      table.appendChild(day_columns[day]);
   });

    document.body.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      document.body.scrollLeft -= evt.deltaY;
    });

}


  (async () => {
    if (!window.location.href.includes(URL)) {
      setSimplePage('You are not logged into Verint!', "You must be logged into verint before you can use this tool.");
      return;
    }
    try {
      setSimplePage('Loading')

      const BODY_SCHEDULE = (start, end) => ({
        "data": {
          "attributes": {
            "calendarFilterCriteria": {
              "extendedResourceAttributes": [],
              "limit": 999,
              "offset": 0,
              "resourcePluginIds": [
                "actualScheduleSummary",
                "adherenceSummary",
                "draftSchedule",
                "extendedWorkResourceDetails",
                "publishedSchedule",
                "secondaryTimeRecordSummary",
                "workResourceDetails"
              ],
              "sortCriteria": {
                "ascending": true,
                "focusedViewDateAscending": true,
                "pluginId": "draftSchedule",
                "strategyId": "ShiftStartTime"
              },
              "summaryIntervals": [],
              "viewEndDate": end ,
              "viewStartDate": start,
              "workResourceWorkspaceCriteria": {
                "employeeFilterName": "DEFAULT_ALL",
                "endTime": end,
                "startTime": start,
                "useAllEmployees": true,
                "useAllPhantoms": false,
                "useAllPoolers": false,
                "workResourceIds": []
              }
            }
          },
          "type": "v2/calendar-filter"
        }
      });

      const SHIFT_WORKRULES = (start, end) => ({
        "data": {
          "type": "v1/find-shiftworkr",
          "attributes": {
            "workResourceWorkspaceCriteria": {
              "startTime": start,
              "endTime": end,
              "useAllEmployees": true,
              "useAllPhantoms": true,
              "useAllPoolers": false,
              "workResourceIds": [],
              "employeeFilterName": "",
            }
          }
        }
      });

      let [start, end] = getStartEnd();
      let schedule = (await doWebPost(BODY_SCHEDULE(start, end)))['data']['attributes']['resourceData'];
      let activities = (await doWebGet("v1/activities"));

      let mappedActivities = mapActivities(activities['data']);

      let shifts = [];

      schedule.forEach(function(resource) {
        let resourceDetails = resource['workResourceDetails'];
        let name = resourceDetails['name']['first'] + ' ' + resourceDetails['name']['last'];

        // let draft = summarize(resource['draftSchedule']['events'], mappedWorkRules);
        let published = summarize(resource['publishedSchedule']['events'], mappedActivities);

        for (let i = 0; i < published.length; i++) {
          let shift = published[i];

          shifts.push({
            name: name,
            start: shift.start,
            end: shift.end,
            duration: shift.duration,
            role: shift.role,
            isTimeOff: shift.isTimeOff,
            isDraftOnly: false
          });
        }

      });

      let modal = document.getElementById('vcb-modal');
      if (modal) {
        modal.remove();
      }

      displayData(shifts);
    } catch (e) {
      let error = e.stack;
      setSimplePage('Something Went Wrong', "Please report this error to the developer: \n" + error);
      console.error(e);
    }
})()
