function addSavedItems(slackApiToken, channel, timestamp){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + slackApiToken,
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  // const payload = {
  //   "channel": channel,
  //   "timestamp": timestamp
  // }
  const options = {
    'method': 'post',
    'headers': headers
  }

  //endpointURLの生成
  const endpoint_url = "https://slack.com/api" + "/stars.add" + "?channel=" + channel + "&timestamp=" + timestamp;
  // console.log(endpoint_url);

  //post処理を実行
  try {
    const response = UrlFetchApp.fetch(endpoint_url, options);
    const responseJson = JSON.parse(response);
  } catch {
    console.log("error", "addSavedItems")
  }
  // console.log(responseJson);
}