
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
    let datePairs = [];
    var date = new Date();

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

    for (var i = 0; i < 13; i++) {
    var startDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
    var endDate = new Date(date.getFullYear(), date.getMonth() + 1 - i, 0);
        // Format start date and date 4 weeks from start date
        var formattedStartDate = formatDate(startDate);
        var formattedEndDate = formatDate(endDate);

        datePairs.push([formattedStartDate, formattedEndDate]);
    }


    return datePairs;
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

      summary.push({
        start: startTime,
        end: endTime,
        duration: durationMinutes,
        activity: activityName,
        role: role,
        isTimeOff: false,
        extensionBefore: shift['extensionBefore'],
        extensionAfter: shift['extensionAfter'],
      });
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

function displayData(vcb_data) {
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

 .column {
   flex: 1;
   padding: 10px;
   margin: 10px;
   border: 1px solid #888;
   min-width: 400px;
   height: 90vh;
   overflow-y: scroll;
 }

 .x-viewport {
    overflow: scroll !important;
  }
 .x-viewport > .x-body {
    overflow: scroll !important;
  }
 .x-body {
    overflow: scroll !important;
  }
  .x-box-layout-ct {
    overflow: scroll !important;
  }
 body {
   background: #eee;
   overflow: scroll;
   font-family: Arial, Helvetica, sans-serif;
   font-size: 26px;
 }

</style>

<span class="close" onclick="location.reload()">&times;</span>
<pre class="text">
</pre>
`;
  document.body.innerHTML = base_page;

  for (let i = 0; i < vcb_data.length; i++) {
    let data = vcb_data[i];
    let pre_element = document.createElement('span');
    pre_element.innerText = data;
    document.querySelector('.text').appendChild(pre_element);
  }


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

      let months = getStartEnd();
      let activities = (await doWebGet("v1/activities"));

      let shifts = [];
      let shift_ids = [];
      shifts.push(`id,shift_id,name,date,start_time,end_time,duration,activity,role,isTimeOff\n`);

      let uid = 1;


      for (let i = 0; i < months.length; i++) {
        let start = months[i][0];
        let end = months[i][1]


        let schedule = (await doWebPost(BODY_SCHEDULE(start, end)))['data']['attributes']['resourceData'];

        let mappedActivities = mapActivities(activities['data']);

        schedule.forEach(function(resource) {
          let resourceDetails = resource['workResourceDetails'];
          let name = '"' + resourceDetails['name']['last'] + ', ' + resourceDetails['name']['first'] + '"';

            // let draft = summarize(resource['draftSchedule']['events'], mappedWorkRules);
            let published = summarize(resource['publishedSchedule']['events'], mappedActivities);

            for (let i = 0; i < published.length; i++) {
              let shift = published[i];
              let date = new Date(shift.start);
              let date_string = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
              let start_time_string = date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
              let end_date = new Date(shift.end);
              let end_time_string = end_date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});

              let shift_ref = `${resourceDetails['id']}-${date_string}`;
              let shift_id = shift_ids.findIndex(shift => shift === shift_ref);

              if (shift_id == -1) {
                shift_ids.push(shift_ref);
                shift_id = shift_ids.length - 1;
              }

              let extBefore = shift['extensionBefore'];

              if (extBefore && extBefore['durationMinutes'] > 0) {
                let durationMinutes = extBefore['durationMinutes'];
                let date = new Date(extBefore['startTime']);
                let date_string = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
                let start_time_string = date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
                let end_date = new Date(extBefore['endTime']);
                let end_time_string = end_date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
                let activity = mappedActivities[extBefore['activityId']];
                shifts.push(`${uid},${shift_id},${name},${date_string},${start_time_string},${end_time_string},${durationMinutes},${activity},,N/A\n`);

                uid += 1;
              }

              let extAfter = shift['extensionAfter'];

            if (extAfter && extAfter['durationMinutes'] > 0) {
              let durationMinutes = extAfter['durationMinutes'];
              let date = new Date(extBefore['startTime']);
              let date_string = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
              let start_time_string = date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
              let end_date = new Date(extBefore['endTime']);
              let end_time_string = end_date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
              let activity = mappedActivities[extAfter['activityId']];
              shifts.push(`${uid},${shift_id},${name},${date_string},${start_time_string},${end_time_string},${durationMinutes},${activity},,N/A\n`);

              uid += 1;
            }
            shifts.push(`${uid},${shift_id},${name},${date_string},${start_time_string},${end_time_string},${shift.duration},${shift.activity},${shift.role},${shift.isTimeOff}\n`);

            uid += 1;
            }

        });

      }

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
