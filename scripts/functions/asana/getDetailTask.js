function getDetailTask(asanaApiToken, tasks_gid){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': headers
  }
  
  ///tasks?opt_fields=completed,completed_at&assignee=1201538044657377&completed_since=2021-12-24T05%3A07%3A43.413Z&limit=10&workspace=108897034660210
  const endpoint_url = "https://app.asana.com/api/1.0" + "/tasks" + "/" + tasks_gid;
  //console.log(endpoint_url);
  var response = UrlFetchApp.fetch(endpoint_url, options);
  var responseJson = JSON.parse(response);
  
  //結果を返却
  return responseJson["data"]["permalink_url"];
  
}