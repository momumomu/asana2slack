//SlackのIDからnameへ変換して返す関数
function convertIdToName(slackApiToken, slackUserId){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + slackApiToken,
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  //optionsを定義
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': headers
  }
  const endpoint_url = "https://slack.com/api" + "/users.info" + "?user=" + slackUserId;
  let response = UrlFetchApp.fetch(endpoint_url, options);
  let responseJson = JSON.parse(response);
  return responseJson["user"]["name"];
}